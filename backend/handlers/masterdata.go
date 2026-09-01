package handlers

import (
	"logikraf-export/backend/models"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

type PortHandler struct {
	DB *gorm.DB
}

// List — daftar pelabuhan (read-only, seed).
func (h *PortHandler) List(c fiber.Ctx) error {
	var items []models.Port
	if err := h.DB.Order("code ASC").Find(&items).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "gagal mengambil data"})
	}
	return c.JSON(items)
}

type IncotermHandler struct {
	DB *gorm.DB
}

// List — daftar incoterms (read-only, seed).
func (h *IncotermHandler) List(c fiber.Ctx) error {
	var items []models.Incoterm
	if err := h.DB.Order("code ASC").Find(&items).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "gagal mengambil data"})
	}
	return c.JSON(items)
}
