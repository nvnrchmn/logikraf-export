package handlers

import (
	"time"

	"logikraf-export/backend/models"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

type DashboardHandler struct {
	DB *gorm.DB
}

// Stats — ringkasan dashboard.
func (h *DashboardHandler) Stats(c fiber.Ctx) error {
	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	var ordersTotal, ordersMonth int64
	h.DB.Model(&models.Order{}).Count(&ordersTotal)
	h.DB.Model(&models.Order{}).Where("created_at >= ?", startOfMonth).Count(&ordersMonth)

	var fobMonth float64
	h.DB.Model(&models.OrderItem{}).
		Select("COALESCE(SUM(order_items.quantity * order_items.unit_price_usd), 0)").
		Joins("JOIN orders ON orders.id = order_items.order_id").
		Where("orders.created_at >= ? AND orders.status <> ?", startOfMonth, "cancelled").
		Scan(&fobMonth)

	byStatus := map[string]int64{}
	var statusRows []struct {
		Status string
		Cnt    int64
	}
	h.DB.Model(&models.Order{}).Select("status, COUNT(*) as cnt").Group("status").Scan(&statusRows)
	for _, r := range statusRows {
		byStatus[r.Status] = r.Cnt
	}

	var activeShipments []models.Order
	h.DB.Preload("Buyer").Preload("Shipment").
		Where("status IN ?", []string{"packed", "shipped"}).
		Order("id DESC").Limit(5).Find(&activeShipments)

	var recentDocs []models.Document
	h.DB.Preload("Order").Order("id DESC").Limit(5).Find(&recentDocs)

	var recentOrders []models.Order
	h.DB.Preload("Buyer").Preload("Items").Order("id DESC").Limit(5).Find(&recentOrders)

	// hitung total_fob untuk list
	type shipItem struct {
		ID        uint    `json:"id"`
		OrderNo   string  `json:"order_no"`
		BuyerName string  `json:"buyer_name"`
		Status    string  `json:"status"`
		ETD       *string `json:"etd"`
		Vessel    string  `json:"vessel"`
		TotalFOB  float64 `json:"total_fob"`
	}
	ships := make([]shipItem, 0, len(activeShipments))
	for _, o := range activeShipments {
		fob := 0.0
		for _, it := range o.Items {
			fob += it.UnitPriceUSD * float64(it.Quantity)
		}
		var etdStr *string
		if o.Shipment != nil && o.Shipment.ETD != nil {
			s := o.Shipment.ETD.Format("2006-01-02")
			etdStr = &s
		}
		vessel := ""
		if o.Shipment != nil {
			vessel = o.Shipment.VesselName
		}
		ships = append(ships, shipItem{o.ID, o.OrderNo, o.Buyer.CompanyName, o.Status, etdStr, vessel, fob})
	}

	type docItem struct {
		ID        uint   `json:"id"`
		DocNo     string `json:"doc_no"`
		DocType   string `json:"doc_type"`
		OrderID   uint   `json:"order_id"`
		OrderNo   string `json:"order_no"`
		CreatedAt string `json:"created_at"`
	}
	docs := make([]docItem, 0, len(recentDocs))
	for _, d := range recentDocs {
		orderNo := ""
		if d.Order.OrderNo != "" {
			orderNo = d.Order.OrderNo
		}
		docs = append(docs, docItem{d.ID, d.DocNo, d.DocType, d.OrderID, orderNo, d.CreatedAt.Format("2006-01-02 15:04")})
	}

	type ordItem struct {
		ID        uint    `json:"id"`
		OrderNo   string  `json:"order_no"`
		BuyerName string  `json:"buyer_name"`
		Status    string  `json:"status"`
		TotalFOB  float64 `json:"total_fob"`
		CreatedAt string  `json:"created_at"`
	}
	ords := make([]ordItem, 0, len(recentOrders))
	for _, o := range recentOrders {
		fob := 0.0
		for _, it := range o.Items {
			fob += it.UnitPriceUSD * float64(it.Quantity)
		}
		ords = append(ords, ordItem{o.ID, o.OrderNo, o.Buyer.CompanyName, o.Status, fob, o.CreatedAt.Format("2006-01-02 15:04")})
	}

	return c.JSON(fiber.Map{
		"orders_total":      ordersTotal,
		"orders_this_month": ordersMonth,
		"fob_this_month":    fobMonth,
		"by_status":         byStatus,
		"active_shipments":  ships,
		"recent_docs":       docs,
		"recent_orders":     ords,
	})
}
