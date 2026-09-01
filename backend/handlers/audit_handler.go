package handlers

import (
	"logikraf-export/backend/models"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

type AuditHandler struct {
	DB *gorm.DB
}

// List — audit log (admin only), terbaru dulu.
func (h *AuditHandler) List(c fiber.Ctx) error {
	var logs []models.AuditLog
	if err := h.DB.Order("id DESC").Limit(100).Find(&logs).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "gagal mengambil audit log"})
	}
	return c.JSON(logs)
}
