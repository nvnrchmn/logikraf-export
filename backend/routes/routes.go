package routes

import (
	"logikraf-export/backend/config"
	"logikraf-export/backend/handlers"
	"logikraf-export/backend/middleware"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

// Setup mendaftarkan semua route API.
func Setup(app *fiber.App, db *gorm.DB, cfg *config.Config) {
	auth := &handlers.AuthHandler{DB: db, Cfg: cfg}

	api := app.Group("/api")

	// Auth
	api.Post("/auth/login", auth.Login)
	authed := api.Group("", middleware.RequireAuth(cfg))
	authed.Get("/auth/me", auth.Me)
}
