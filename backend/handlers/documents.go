package handlers

import (
	"errors"
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

	// Reuse nomor dokumen yang sudah pernah dibuat untuk (order, tipe) — regenerasi
	// karena perubahan data TIDAK boleh mengganti nomor (nomor sudah jadi referensi buyer).
	// Yang dipertahankan = nomor PERTAMA (record tertua); duplikat hasil regenerate lama dibersihkan.
	var existing models.Document
	err = h.DB.Where("order_id = ? AND doc_type = ?", id, docType).Order("id ASC").First(&existing).Error
	regenerating := err == nil
	var docNo string
	if regenerating {
		docNo = existing.DocNo
	} else if errors.Is(err, gorm.ErrRecordNotFound) {
		docNo, err = utils.DocNo(h.DB, docType)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "gagal membuat nomor dokumen"})
		}
	} else {
		return c.Status(500).JSON(fiber.Map{"error": "gagal memeriksa dokumen yang ada"})
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

	if regenerating {
		// Update record lama (file ditulis ulang ke path yang sama — nomor sama → path sama).
		existing.GeneratedBy = middleware.CurrentUserID(c)
		if err := h.DB.Save(&existing).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "gagal memperbarui dokumen"})
		}
		// Bersihkan duplikat lain hasil regenerasi lama (nomor beda, isi usang) —
		// sisakan hanya record pertama (nomor asli).
		var stale []models.Document
		h.DB.Where("order_id = ? AND doc_type = ? AND id > ?", id, docType, existing.ID).Find(&stale)
		for _, s := range stale {
			if err := os.Remove(s.FilePath); err != nil && !os.IsNotExist(err) {
				continue
			}
			h.DB.Delete(&s)
		}
		LogAudit(h.DB, existing.GeneratedBy, "doc_generate", "document", strconv.FormatUint(uint64(existing.ID), 10), docNo+" (regenerate)")
		return c.JSON(existing)
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

// Delete — menghapus dokumen (file fisik + record). Aman: bisa di-generate ulang dari data order.
// DELETE /api/documents/:id
func (h *DocumentHandler) Delete(c fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id tidak valid"})
	}
	var doc models.Document
	if err := h.DB.First(&doc, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "dokumen tidak ditemukan"})
	}
	// hapus file fisik; abaikan bila sudah tidak ada (idempoten)
	if err := os.Remove(doc.FilePath); err != nil && !os.IsNotExist(err) {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menghapus file dokumen"})
	}
	if err := h.DB.Delete(&doc).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menghapus dokumen"})
	}
	userID, _ := c.Locals(middleware.CtxUserID).(uint)
	LogAudit(h.DB, userID, "delete", "document", strconv.FormatUint(uint64(doc.ID), 10), doc.DocNo+" ("+doc.DocType+")")
	return c.JSON(fiber.Map{"ok": true})
}
