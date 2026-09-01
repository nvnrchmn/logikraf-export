package handlers

import (
	"strconv"

	"logikraf-export/backend/middleware"
	"logikraf-export/backend/models"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

type BuyerHandler struct {
	DB *gorm.DB
}

// List — daftar buyer, filter q (company/country/city).
func (h *BuyerHandler) List(c fiber.Ctx) error {
	q := c.Query("q")
	query := h.DB.Model(&models.Buyer{})
	if q != "" {
		like := "%" + q + "%"
		query = query.Where("company_name LIKE ? OR country LIKE ? OR city LIKE ?", like, like, like)
	}

	var items []models.Buyer
	if err := query.Order("id DESC").Find(&items).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "gagal mengambil data"})
	}
	return c.JSON(items)
}

// Get — detail buyer by id.
func (h *BuyerHandler) Get(c fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id tidak valid"})
	}
	var b models.Buyer
	if err := h.DB.First(&b, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "buyer tidak ditemukan"})
	}
	return c.JSON(b)
}

// Create — buyer baru.
func (h *BuyerHandler) Create(c fiber.Ctx) error {
	var b models.Buyer
	if err := c.Bind().Body(&b); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "request tidak valid"})
	}
	if b.CompanyName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "nama perusahaan wajib diisi"})
	}

	if err := h.DB.Create(&b).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "gagal menyimpan buyer"})
	}
	LogAudit(h.DB, middleware.CurrentUserID(c), "create", "buyer", strconv.FormatUint(uint64(b.ID), 10), b.CompanyName)
	return c.Status(fiber.StatusCreated).JSON(b)
}

// Update — ubah buyer.
func (h *BuyerHandler) Update(c fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id tidak valid"})
	}
	var existing models.Buyer
	if err := h.DB.First(&existing, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "buyer tidak ditemukan"})
	}

	var b models.Buyer
	if err := c.Bind().Body(&b); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "request tidak valid"})
	}
	b.ID = existing.ID
	b.CreatedAt = existing.CreatedAt
	if b.CompanyName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "nama perusahaan wajib diisi"})
	}

	if err := h.DB.Save(&b).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "gagal menyimpan buyer"})
	}
	LogAudit(h.DB, middleware.CurrentUserID(c), "update", "buyer", strconv.FormatUint(uint64(b.ID), 10), b.CompanyName)
	return c.JSON(b)
}

// Delete — hapus buyer.
func (h *BuyerHandler) Delete(c fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id tidak valid"})
	}
	res := h.DB.Delete(&models.Buyer{}, id)
	if res.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "gagal menghapus buyer"})
	}
	if res.RowsAffected == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "buyer tidak ditemukan"})
	}
	LogAudit(h.DB, middleware.CurrentUserID(c), "delete", "buyer", strconv.FormatUint(uint64(id), 10), "")
	return c.JSON(fiber.Map{"ok": true})
}
