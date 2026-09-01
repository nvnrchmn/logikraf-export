package handlers

import (
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"logikraf-export/backend/middleware"
	"logikraf-export/backend/models"
	"logikraf-export/backend/utils"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

type DocumentHandler struct {
	DB *gorm.DB
}

var docTypes = map[string]bool{"PI": true, "CI": true, "PL": true, "SI": true, "PEB": true}

// status yang mengizinkan CI/PL/SI
var confirmedStatuses = map[string]bool{"confirmed": true, "packed": true, "shipped": true, "completed": true}

// status yang mengizinkan PEB Data Sheet
var packedStatuses = map[string]bool{"packed": true, "shipped": true, "completed": true}

// Generate — membuat PDF dokumen untuk order.
// POST /api/orders/:id/documents/:type
func (h *DocumentHandler) Generate(c fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id tidak valid"})
	}
	docType := strings.ToUpper(c.Params("type"))
	if !docTypes[docType] {
		return c.Status(400).JSON(fiber.Map{"error": "tipe dokumen tidak dikenal (PI|CI|PL|SI|PEB)"})
	}

	var o models.Order
	err = h.DB.Preload("Buyer").Preload("Incoterm").Preload("PortLoading").Preload("PortDischarge").Preload("Items.Product").First(&o, id).Error
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "pesanan tidak ditemukan"})
	}
	if len(o.Items) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "pesanan belum punya item"})
	}

	// Gate status per tipe
	switch docType {
	case "PI":
		// boleh kapan saja selama bukan cancelled
		if o.Status == "cancelled" {
			return c.Status(400).JSON(fiber.Map{"error": "pesanan dibatalkan, dokumen tidak bisa dibuat"})
		}
	case "CI", "PL", "SI":
		if !confirmedStatuses[o.Status] {
			return c.Status(400).JSON(fiber.Map{"error": "dokumen hanya bisa dibuat setelah order confirmed"})
		}
		if docType == "SI" && o.ShippingMode == "courier" {
			return c.Status(400).JSON(fiber.Map{"error": "SI hanya untuk pengiriman laut (LCL/FCL) — mode kurir pakai AWB courier"})
		}
	case "PEB":
		if !packedStatuses[o.Status] {
			return c.Status(400).JSON(fiber.Map{"error": "PEB Data Sheet hanya bisa dibuat setelah order packed"})
		}
	}

	docNo, err := utils.DocNo(h.DB, docType)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal membuat nomor dokumen"})
	}

	// Muat profil perusahaan untuk header & tanda tangan
	var cs models.CompanySetting
	if err := h.DB.First(&cs, 1).Error; err != nil {
		cs = models.CompanySetting{ID: 1}
	}

	pdfBytes, err := utils.BuildDocument(utils.DocData{DocNo: docNo, Order: o, Company: cs})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal membuat dokumen: " + err.Error()})
	}

	dir := filepath.Join("storage", "documents")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menyiapkan folder dokumen"})
	}
	filePath := filepath.Join(dir, docNo+".pdf")
	if err := os.WriteFile(filePath, pdfBytes, 0o644); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menyimpan dokumen"})
	}

	doc := models.Document{
		DocNo:       docNo,
		OrderID:     id,
		DocType:     docType,
		FilePath:    filePath,
		GeneratedBy: middleware.CurrentUserID(c),
	}
	if err := h.DB.Create(&doc).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal mencatat dokumen"})
	}
	LogAudit(h.DB, doc.GeneratedBy, "doc_generate", "document", strconv.FormatUint(uint64(doc.ID), 10), docNo)

	return c.Status(201).JSON(doc)
}

// List — dokumen milik satu order.
// GET /api/orders/:id/documents
func (h *DocumentHandler) List(c fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id tidak valid"})
	}
	var docs []models.Document
	if err := h.DB.Where("order_id = ?", id).Order("id ASC").Find(&docs).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal memuat dokumen"})
	}
	return c.JSON(docs)
}

// File — mengunduh PDF.
// GET /api/documents/:id/file
func (h *DocumentHandler) File(c fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id tidak valid"})
	}
	var doc models.Document
	if err := h.DB.First(&doc, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "dokumen tidak ditemukan"})
	}
	if _, err := os.Stat(doc.FilePath); err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "file dokumen tidak ada"})
	}
	c.Set("Content-Disposition", `inline; filename="`+doc.DocNo+`.pdf"`)
	return c.SendFile(doc.FilePath)
}
