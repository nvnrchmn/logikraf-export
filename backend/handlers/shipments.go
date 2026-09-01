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

type ShipmentHandler struct {
	DB *gorm.DB
}

type shipmentReq struct {
	PEBNo         string  `json:"peb_no"`
	NPENo         string  `json:"npe_no"`
	VesselName    string  `json:"vessel_name"`
	VoyageNo      string  `json:"voyage_no"`
	StuffingDate  *string `json:"stuffing_date"`
	GateInDate    *string `json:"gate_in_date"`
	ETD           *string `json:"etd"`
	OnboardDate   *string `json:"onboard_date"`
	PODDate       *string `json:"pod_date"`
	Courier       string  `json:"courier"`
	AWBNo         string  `json:"awb_no"`
	PickupDate    *string `json:"pickup_date"`
	DeliveredDate *string `json:"delivered_date"`
	Notes         string  `json:"notes"`
}

// Update — upsert data shipment order + auto-advance status.
func (h *ShipmentHandler) Update(c fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id tidak valid"})
	}
	var o models.Order
	err = h.DB.Preload("Shipment").First(&o, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.Status(404).JSON(fiber.Map{"error": "pesanan tidak ditemukan"})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal memuat pesanan"})
	}
	if o.Status == "cancelled" {
		return c.Status(400).JSON(fiber.Map{"error": "order dibatalkan, shipment tidak bisa diubah"})
	}
	if o.Status == "completed" {
		return c.Status(400).JSON(fiber.Map{"error": "order selesai, shipment terkunci"})
	}
	if o.Status == "draft" {
		return c.Status(400).JSON(fiber.Map{"error": "order harus confirmed sebelum input shipment"})
	}

	var req shipmentReq
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "payload tidak valid"})
	}

	parse := func(s *string) (*time.Time, error) {
		if s == nil {
			return nil, nil
		}
		return utils.ParseFlexDate(*s)
	}

	// Bangun shipment baru / update field yang dikirim
	s := o.Shipment
	if s == nil {
		s = &models.Shipment{OrderID: id}
	}
	if req.PEBNo != "" || s.PEBNo != "" {
		s.PEBNo = req.PEBNo
	}
	if req.NPENo != "" || s.NPENo != "" {
		s.NPENo = req.NPENo
	}
	if req.VesselName != "" || s.VesselName != "" {
		s.VesselName = req.VesselName
	}
	if req.VoyageNo != "" || s.VoyageNo != "" {
		s.VoyageNo = req.VoyageNo
	}
	if req.Courier != "" || s.Courier != "" {
		s.Courier = req.Courier
	}
	if req.AWBNo != "" || s.AWBNo != "" {
		s.AWBNo = req.AWBNo
	}
	if req.Notes != "" || s.Notes != "" {
		s.Notes = req.Notes
	}
	for _, f := range []struct {
		src *string
		dst **time.Time
	}{
		{req.StuffingDate, &s.StuffingDate},
		{req.GateInDate, &s.GateInDate},
		{req.ETD, &s.ETD},
		{req.OnboardDate, &s.OnboardDate},
		{req.PODDate, &s.PODDate},
		{req.PickupDate, &s.PickupDate},
		{req.DeliveredDate, &s.DeliveredDate},
	} {
		if f.src != nil {
			t, perr := parse(f.src)
			if perr != nil {
				return c.Status(400).JSON(fiber.Map{"error": perr.Error()})
			}
			*f.dst = t
		}
	}

	if err := h.DB.Save(s).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menyimpan shipment"})
	}

	// Auto-advance status (courier: pickup->shipped, delivered->completed; laut: ETD/onboard->shipped, POD->completed)
	prev := o.Status
	switch {
	case (s.DeliveredDate != nil || s.PODDate != nil) && (o.Status == "confirmed" || o.Status == "packed" || o.Status == "shipped"):
		o.Status = "completed"
	case (s.PickupDate != nil || s.ETD != nil || s.OnboardDate != nil) && (o.Status == "confirmed" || o.Status == "packed"):
		o.Status = "shipped"
	}
	if o.Status != prev {
		if err := h.DB.Model(&o).Update("status", o.Status).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "gagal memperbarui status"})
		}
		LogAudit(h.DB, middleware.CurrentUserID(c), "status", "order", strconv.FormatUint(uint64(o.ID), 10), prev+" -> "+o.Status+" (auto dari shipment)")
	}
	LogAudit(h.DB, middleware.CurrentUserID(c), "shipment_update", "order", strconv.FormatUint(uint64(o.ID), 10), "PEB: "+s.PEBNo)

	// Muat ulang order lengkap
	if err := h.DB.Preload("Buyer").Preload("Incoterm").Preload("PortLoading").Preload("PortDischarge").Preload("Items.Product").Preload("Shipment").First(&o, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal memuat pesanan"})
	}
	computeOrderTotals(&o)
	return c.JSON(o)
}
