package handlers

import (
	"errors"
	"strconv"
	"time"

	"logikraf-export/backend/middleware"
	"logikraf-export/backend/models"
	"logikraf-export/backend/utils"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

type OrderHandler struct {
	DB *gorm.DB
}

// Status yang boleh dituju dari status saat ini.
var statusFlow = map[string][]string{
	"draft":     {"confirmed", "cancelled"},
	"confirmed": {"packed", "cancelled"},
	"packed":    {"shipped"},
	"shipped":   {"completed"},
	"completed": {},
	"cancelled": {},
}

var validStatus = []string{"draft", "confirmed", "packed", "shipped", "completed", "cancelled"}

func (h *OrderHandler) List(c fiber.Ctx) error {
	status := c.Query("status")
	q := c.Query("q")
	query := h.DB.Preload("Buyer").Preload("Incoterm").Preload("PortLoading").Preload("PortDischarge").Preload("Items.Product").Preload("Shipment")
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if q != "" {
		like := "%" + q + "%"
		query = query.Where("order_no LIKE ? OR buyer_id IN (SELECT id FROM buyers WHERE company_name LIKE ?)", like, like)
	}
	var orders []models.Order
	if err := query.Order("id DESC").Find(&orders).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal memuat pesanan"})
	}
	for i := range orders {
		computeOrderTotals(&orders[i])
	}
	return c.JSON(orders)
}

type createOrderReq struct {
	ShippingMode    string `json:"shipping_mode"`
	BuyerID         uint   `json:"buyer_id"`
	IncotermID      uint   `json:"incoterm_id"`
	PortLoadingID   uint   `json:"port_loading_id"`
	PortDischargeID uint   `json:"port_discharge_id"`
	Currency        string `json:"currency"`
	PaymentTerms    string `json:"payment_terms"`
	Notes           string `json:"notes"`
}

func (h *OrderHandler) Create(c fiber.Ctx) error {
	var req createOrderReq
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "payload tidak valid"})
	}
	if req.BuyerID == 0 || req.IncotermID == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "buyer dan incoterm wajib diisi"})
	}
	if req.ShippingMode == "" {
		req.ShippingMode = "courier"
	}
	if !containsStr([]string{"courier", "lcl", "fcl"}, req.ShippingMode) {
		return c.Status(400).JSON(fiber.Map{"error": "shipping_mode harus courier, lcl, atau fcl"})
	}
	if req.ShippingMode != "courier" && (req.PortLoadingID == 0 || req.PortDischargeID == 0) {
		return c.Status(400).JSON(fiber.Map{"error": "pelabuhan wajib diisi untuk mode laut (LCL/FCL)"})
	}
	if req.ShippingMode == "courier" {
		req.PortLoadingID = 0
		req.PortDischargeID = 0
	}
	// Validasi referensi sebelum insert (hindari FK error 500)
	var refs struct {
		Buyer, Incoterm, PortL, PortD int64
	}
	h.DB.Model(&models.Buyer{}).Where("id = ?", req.BuyerID).Count(&refs.Buyer)
	h.DB.Model(&models.Incoterm{}).Where("id = ?", req.IncotermID).Count(&refs.Incoterm)
	if refs.Buyer == 0 || refs.Incoterm == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "data referensi (buyer/incoterm) tidak valid"})
	}
	if req.ShippingMode != "courier" {
		h.DB.Model(&models.Port{}).Where("id = ?", req.PortLoadingID).Count(&refs.PortL)
		h.DB.Model(&models.Port{}).Where("id = ?", req.PortDischargeID).Count(&refs.PortD)
		if refs.PortL == 0 || refs.PortD == 0 {
			return c.Status(400).JSON(fiber.Map{"error": "data referensi pelabuhan tidak valid"})
		}
	}
	currency := req.Currency
	if currency == "" {
		currency = "USD"
	}

	orderNo, err := utils.OrderNo(h.DB)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal membuat nomor pesanan"})
	}

	var plID, pdID *uint
	if req.ShippingMode != "courier" {
		plID, pdID = &req.PortLoadingID, &req.PortDischargeID
	}
	o := models.Order{
		OrderNo:         orderNo,
		ShippingMode:    req.ShippingMode,
		BuyerID:         req.BuyerID,
		IncotermID:      req.IncotermID,
		PortLoadingID:   plID,
		PortDischargeID: pdID,
		Currency:        currency,
		PaymentTerms:    req.PaymentTerms,
		Notes:           req.Notes,
		Status:          "draft",
		CreatedBy:       middleware.CurrentUserID(c),
	}
	if err := h.DB.Create(&o).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menyimpan pesanan"})
	}
	LogAudit(h.DB, o.CreatedBy, "create", "order", strconv.FormatUint(uint64(o.ID), 10), orderNo)
	return c.Status(201).JSON(o)
}

func (h *OrderHandler) Get(c fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id tidak valid"})
	}
	o, err := h.fullOrder(id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.Status(404).JSON(fiber.Map{"error": "pesanan tidak ditemukan"})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal memuat pesanan"})
	}
	return c.JSON(o)
}

// computeOrderTotals menghitung LineTotal, FOB, berat, CBM, dan kebutuhan PEB.
func computeOrderTotals(o *models.Order) {
	o.TotalFOB, o.TotalNetKG, o.TotalGrossKG, o.TotalCBM = 0, 0, 0, 0
	for j := range o.Items {
		it := &o.Items[j]
		it.LineTotal = it.UnitPriceUSD * float64(it.Quantity)
		o.TotalFOB += it.LineTotal
		p := it.Product
		o.TotalNetKG += p.NetWeightG * float64(it.Quantity) / 1000
		o.TotalGrossKG += p.GrossWeightG * float64(it.Quantity) / 1000
		o.TotalCBM += p.LengthCm * p.WidthCm * p.HeightCm * float64(it.Quantity) / 1e6
	}
	// PEB wajib kecuali kiriman kurir di bawah ambang USD 100 / 30 kg (PMK 60/2016)
	o.PEBRequired = !(o.ShippingMode == "courier" && o.TotalFOB < 100 && o.TotalGrossKG < 30)
}

// fullOrder memuat order lengkap dengan relasi (Buyer, Incoterm, pelabuhan, items+produk, shipment)
// + total terhitung (FOB/berat/CBM/PEB). Dipakai Get dan semua mutasi yang mereturn order.
func (h *OrderHandler) fullOrder(id uint) (models.Order, error) {
	var o models.Order
	err := h.DB.Preload("Buyer").Preload("Incoterm").Preload("PortLoading").Preload("PortDischarge").Preload("Items.Product").Preload("Shipment").First(&o, id).Error
	if err == nil {
		computeOrderTotals(&o)
	}
	return o, err
}

type updateOrderReq struct {
	ShippingMode    string `json:"shipping_mode"`
	IncotermID      uint   `json:"incoterm_id"`
	PortLoadingID   uint   `json:"port_loading_id"`
	PortDischargeID uint   `json:"port_discharge_id"`
	Currency        string `json:"currency"`
	PaymentTerms    string `json:"payment_terms"`
	Notes           string `json:"notes"`
}

func (h *OrderHandler) Update(c fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id tidak valid"})
	}
	var o models.Order
	if err := h.DB.First(&o, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "pesanan tidak ditemukan"})
	}
	var req updateOrderReq
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "payload tidak valid"})
	}
	o.IncotermID = req.IncotermID
	if req.ShippingMode != "" {
		o.ShippingMode = req.ShippingMode
	}
	if o.ShippingMode != "courier" {
		if req.PortLoadingID == 0 || req.PortDischargeID == 0 {
			return c.Status(400).JSON(fiber.Map{"error": "pelabuhan wajib diisi untuk mode laut (LCL/FCL)"})
		}
		pl, pd := req.PortLoadingID, req.PortDischargeID
		o.PortLoadingID, o.PortDischargeID = &pl, &pd
	} else {
		o.PortLoadingID, o.PortDischargeID = nil, nil
	}
	if req.Currency != "" {
		o.Currency = req.Currency
	}
	o.PaymentTerms = req.PaymentTerms
	o.Notes = req.Notes
	if err := h.DB.Save(&o).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menyimpan pesanan"})
	}
	LogAudit(h.DB, middleware.CurrentUserID(c), "update", "order", strconv.FormatUint(uint64(id), 10), o.OrderNo)
	o2, err := h.fullOrder(id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal memuat pesanan"})
	}
	return c.JSON(o2)
}

func (h *OrderHandler) Delete(c fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id tidak valid"})
	}
	var o models.Order
	if err := h.DB.First(&o, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "pesanan tidak ditemukan"})
	}
	if o.Status != "draft" {
		return c.Status(400).JSON(fiber.Map{"error": "hanya pesanan draft yang bisa dihapus"})
	}
	if err := h.DB.Delete(&o).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menghapus pesanan"})
	}
	LogAudit(h.DB, middleware.CurrentUserID(c), "delete", "order", strconv.FormatUint(uint64(id), 10), o.OrderNo)
	return c.JSON(fiber.Map{"ok": true})
}

func (h *OrderHandler) SetStatus(c fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id tidak valid"})
	}
	var req struct {
		Status string `json:"status"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "payload tidak valid"})
	}
	valid := false
	for _, s := range validStatus {
		if s == req.Status {
			valid = true
			break
		}
	}
	if !valid {
		return c.Status(400).JSON(fiber.Map{"error": "status tidak dikenal"})
	}
	var o models.Order
	if err := h.DB.First(&o, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "pesanan tidak ditemukan"})
	}
	if req.Status == o.Status {
		o2, err := h.fullOrder(id)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "gagal memuat pesanan"})
		}
		return c.JSON(o2)
	}
	allowed, ok := statusFlow[o.Status]
	if !ok || !containsStr(allowed, req.Status) {
		return c.Status(400).JSON(fiber.Map{"error": "transisi status tidak diizinkan: " + o.Status + " → " + req.Status})
	}
	o.Status = req.Status
	if err := h.DB.Save(&o).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal mengubah status"})
	}
	LogAudit(h.DB, middleware.CurrentUserID(c), "status", "order", strconv.FormatUint(uint64(id), 10), o.OrderNo+" → "+req.Status)
	o2, err := h.fullOrder(id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal memuat pesanan"})
	}
	return c.JSON(o2)
}

// UpdatePayment — ubah status pembayaran order (unpaid | dp | paid) + catatan.
// PUT /api/orders/:id/payment
func (h *OrderHandler) UpdatePayment(c fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id tidak valid"})
	}
	var req struct {
		Status string `json:"status"`
		Note   string `json:"note"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "payload tidak valid"})
	}
	switch req.Status {
	case "unpaid", "dp", "paid":
	default:
		return c.Status(400).JSON(fiber.Map{"error": "status pembayaran harus unpaid/dp/paid"})
	}
	var o models.Order
	if err := h.DB.First(&o, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "pesanan tidak ditemukan"})
	}
	o.PaymentStatus = req.Status
	o.PaymentNote = req.Note
	if req.Status == "paid" && o.PaidAt == nil {
		now := time.Now()
		o.PaidAt = &now
	} else if req.Status != "paid" {
		o.PaidAt = nil
	}
	if err := h.DB.Save(&o).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menyimpan pembayaran"})
	}
	LogAudit(h.DB, middleware.CurrentUserID(c), "payment", "order", strconv.FormatUint(uint64(id), 10), o.OrderNo+" → "+req.Status)
	o2, err := h.fullOrder(id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal memuat pesanan"})
	}
	return c.JSON(o2)
}

// ---- Items ----

func (h *OrderHandler) AddItem(c fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id tidak valid"})
	}
	var o models.Order
	if err := h.DB.First(&o, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "pesanan tidak ditemukan"})
	}
	if o.Status != "draft" {
		return c.Status(400).JSON(fiber.Map{"error": "item hanya bisa diubah saat draft"})
	}
	var req struct {
		ProductID    uint    `json:"product_id"`
		Quantity     int     `json:"quantity"`
		UnitPriceUSD float64 `json:"unit_price_usd"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "payload tidak valid"})
	}
	var p models.Product
	if err := h.DB.First(&p, req.ProductID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "produk tidak ditemukan"})
	}
	price := req.UnitPriceUSD
	if price == 0 {
		price = p.UnitPriceUSD
	}
	if req.Quantity <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "kuantitas harus > 0"})
	}
	item := models.OrderItem{
		OrderID:      id,
		ProductID:    req.ProductID,
		Quantity:     req.Quantity,
		UnitPriceUSD: price,
		LineTotal:    price * float64(req.Quantity),
	}
	if err := h.DB.Create(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menambah item"})
	}
	LogAudit(h.DB, middleware.CurrentUserID(c), "item_add", "order", strconv.FormatUint(uint64(id), 10), p.SKU+" x"+strconv.Itoa(req.Quantity))
	return c.Status(201).JSON(item)
}

func (h *OrderHandler) UpdateItem(c fiber.Ctx) error {
	orderID, err := idParam(c)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id tidak valid"})
	}
	itemID, err := strconv.ParseUint(c.Params("itemId"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "item id tidak valid"})
	}
	var o models.Order
	if err := h.DB.First(&o, orderID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "pesanan tidak ditemukan"})
	}
	if o.Status != "draft" {
		return c.Status(400).JSON(fiber.Map{"error": "item hanya bisa diubah saat draft"})
	}
	var item models.OrderItem
	if err := h.DB.Where("id = ? AND order_id = ?", itemID, orderID).First(&item).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "item tidak ditemukan"})
	}
	var req struct {
		Quantity     int     `json:"quantity"`
		UnitPriceUSD float64 `json:"unit_price_usd"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "payload tidak valid"})
	}
	if req.Quantity > 0 {
		item.Quantity = req.Quantity
	}
	if req.UnitPriceUSD > 0 {
		item.UnitPriceUSD = req.UnitPriceUSD
	}
	item.LineTotal = item.UnitPriceUSD * float64(item.Quantity)
	if err := h.DB.Save(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menyimpan item"})
	}
	LogAudit(h.DB, middleware.CurrentUserID(c), "item_update", "order", strconv.FormatUint(uint64(orderID), 10), "")
	return c.JSON(item)
}

func (h *OrderHandler) RemoveItem(c fiber.Ctx) error {
	orderID, err := idParam(c)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id tidak valid"})
	}
	itemID, err := strconv.ParseUint(c.Params("itemId"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "item id tidak valid"})
	}
	var o models.Order
	if err := h.DB.First(&o, orderID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "pesanan tidak ditemukan"})
	}
	if o.Status != "draft" {
		return c.Status(400).JSON(fiber.Map{"error": "item hanya bisa diubah saat draft"})
	}
	res := h.DB.Where("id = ? AND order_id = ?", itemID, orderID).Delete(&models.OrderItem{})
	if res.RowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "item tidak ditemukan"})
	}
	LogAudit(h.DB, middleware.CurrentUserID(c), "item_delete", "order", strconv.FormatUint(uint64(orderID), 10), "")
	return c.JSON(fiber.Map{"ok": true})
}

func containsStr(list []string, s string) bool {
	for _, v := range list {
		if v == s {
			return true
		}
	}
	return false
}
