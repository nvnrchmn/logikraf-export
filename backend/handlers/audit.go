package handlers

import (
	"log"
	"strconv"
	"strings"

	"logikraf-export/backend/models"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

// LogAudit mencatat jejak perubahan ke audit_logs (light, non-blocking).
func LogAudit(db *gorm.DB, userID uint, action, entity, entityID, detail string) {
	if err := db.Create(&models.AuditLog{
		UserID:   userID,
		Action:   action,
		Entity:   entity,
		EntityID: entityID,
		Detail:   detail,
	}).Error; err != nil {
		log.Printf("[audit] gagal mencatat %s %s#%s: %v", action, entity, entityID, err)
	}
}

// isDuplicateError mendeteksi error MySQL duplicate key (1062).
func isDuplicateError(err error) bool {
	return err != nil && strings.Contains(err.Error(), "1062")
}

// idParam membaca :id dari path sebagai uint.
func idParam(c fiber.Ctx) (uint, error) {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return 0, err
	}
	return uint(id), nil
}
