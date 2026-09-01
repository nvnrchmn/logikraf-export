package routes

import (
	"logikraf-export/backend/config"
	"logikraf-export/backend/handlers"
	"logikraf-export/backend/middleware"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

// Setup mendaftarkan seluruh route API.
func Setup(app *fiber.App, db *gorm.DB, cfg *config.Config) {
	api := app.Group("/api")

	// ---- Public ----
	authH := &handlers.AuthHandler{DB: db, Cfg: cfg}
	api.Post("/auth/login", authH.Login)

	// ---- Protected ----
	authed := api.Group("", middleware.RequireAuth(cfg))

	authed.Get("/auth/me", authH.Me)

	// Master data
	prodH := &handlers.ProductHandler{DB: db}
	buyerH := &handlers.BuyerHandler{DB: db}
	portH := &handlers.PortHandler{DB: db}
	incH := &handlers.IncotermHandler{DB: db}

	authed.Get("/products", prodH.List)
	authed.Get("/products/:id", prodH.Get)
	authed.Post("/products", prodH.Create)
	authed.Put("/products/:id", prodH.Update)
	authed.Delete("/products/:id", prodH.Delete)

	authed.Get("/buyers", buyerH.List)
	authed.Get("/buyers/:id", buyerH.Get)
	authed.Post("/buyers", buyerH.Create)
	authed.Put("/buyers/:id", buyerH.Update)
	authed.Delete("/buyers/:id", buyerH.Delete)

	authed.Get("/ports", portH.List)
	authed.Get("/incoterms", incH.List)

	// Orders
	orderH := &handlers.OrderHandler{DB: db}
	authed.Get("/orders", orderH.List)
	authed.Get("/orders/:id", orderH.Get)
	authed.Post("/orders", orderH.Create)
	authed.Put("/orders/:id", orderH.Update)
	authed.Delete("/orders/:id", orderH.Delete)
	authed.Patch("/orders/:id/status", orderH.SetStatus)
	authed.Post("/orders/:id/items", orderH.AddItem)
	authed.Put("/orders/:id/items/:itemId", orderH.UpdateItem)
	authed.Delete("/orders/:id/items/:itemId", orderH.RemoveItem)

	// Audit (admin)
	auditH := &handlers.AuditHandler{DB: db}
	authed.Get("/audit-logs", middleware.RequireRole("admin"), auditH.List)
}
