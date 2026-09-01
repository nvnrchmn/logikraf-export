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
	products := &handlers.ProductHandler{DB: db}
	buyers := &handlers.BuyerHandler{DB: db}
	ports := &handlers.PortHandler{DB: db}
	incoterms := &handlers.IncotermHandler{DB: db}

	api := app.Group("/api")

	// Auth
	api.Post("/auth/login", auth.Login)
	authed := api.Group("", middleware.RequireAuth(cfg))
	authed.Get("/auth/me", auth.Me)

	// Master Data — produk & buyer (admin + ops)
	authed.Get("/products", products.List)
	authed.Get("/products/:id", products.Get)
	authed.Post("/products", products.Create)
	authed.Put("/products/:id", products.Update)
	authed.Delete("/products/:id", products.Delete)

	authed.Get("/buyers", buyers.List)
	authed.Get("/buyers/:id", buyers.Get)
	authed.Post("/buyers", buyers.Create)
	authed.Put("/buyers/:id", buyers.Update)
	authed.Delete("/buyers/:id", buyers.Delete)

	// Master Data — read-only (seed)
	authed.Get("/ports", ports.List)
	authed.Get("/incoterms", incoterms.List)
}
