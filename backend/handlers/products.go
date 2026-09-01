package handlers

import (
	"strconv"

	"logikraf-export/backend/middleware"
	"logikraf-export/backend/models"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

type ProductHandler struct {
	DB *gorm.DB
}

// List — daftar produk, filter q (sku/name/hs_code).
func (h *ProductHandler) List(c fiber.Ctx) error {
	q := c.Query("q")
	query := h.DB.Model(&models.Product{})
	if q != "" {
		like := "%" + q + "%"
		query = query.Where("sku LIKE ? OR name LIKE ? OR hs_code LIKE ?", like, like, like)
	}
	if v := c.Query("active"); v == "true" {
		query = query.Where("active = ?", true)
	} else if v == "false" {
		query = query.Where("active = ?", false)
	}

	var items []models.Product
	if err := query.Order("id DESC").Find(&items).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "gagal mengambil data"})
	}
	return c.JSON(items)
}

// Get — detail produk by id.
func (h *ProductHandler) Get(c fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id tidak valid"})
	}
	var p models.Product
	if err := h.DB.First(&p, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "produk tidak ditemukan"})
	}
	return c.JSON(p)
}

// Create — produk baru.
func (h *ProductHandler) Create(c fiber.Ctx) error {
	var p models.Product
	if err := c.Bind().Body(&p); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "request tidak valid"})
	}
	if p.SKU == "" || p.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "SKU dan nama wajib diisi"})
	}

	if err := h.DB.Create(&p).Error; err != nil {
		if isDuplicateError(err) {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "SKU sudah dipakai"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "gagal menyimpan produk"})
	}
	LogAudit(h.DB, middleware.CurrentUserID(c), "create", "product", strconv.FormatUint(uint64(p.ID), 10), p.SKU)
	return c.Status(fiber.StatusCreated).JSON(p)
}

// Update — ubah produk (full replace semua field).
func (h *ProductHandler) Update(c fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id tidak valid"})
	}
	var existing models.Product
	if err := h.DB.First(&existing, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "produk tidak ditemukan"})
	}

	var p models.Product
	if err := c.Bind().Body(&p); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "request tidak valid"})
	}
	p.ID = existing.ID
	p.CreatedAt = existing.CreatedAt
	if p.SKU == "" || p.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "SKU dan nama wajib diisi"})
	}

	if err := h.DB.Save(&p).Error; err != nil {
		if isDuplicateError(err) {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "SKU sudah dipakai"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "gagal menyimpan produk"})
	}
	LogAudit(h.DB, middleware.CurrentUserID(c), "update", "product", strconv.FormatUint(uint64(p.ID), 10), p.SKU)
	return c.JSON(p)
}

// Delete — hapus produk (admin & ops).
func (h *ProductHandler) Delete(c fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id tidak valid"})
	}
	res := h.DB.Delete(&models.Product{}, id)
	if res.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "gagal menghapus produk"})
	}
	if res.RowsAffected == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "produk tidak ditemukan"})
	}
	LogAudit(h.DB, middleware.CurrentUserID(c), "delete", "product", strconv.FormatUint(uint64(id), 10), "")
	return c.JSON(fiber.Map{"ok": true})
}
