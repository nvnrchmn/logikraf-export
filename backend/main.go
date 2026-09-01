package main

import (
	"log"
	"os"
	"path/filepath"

	"logikraf-export/backend/config"
	"logikraf-export/backend/database"
	"logikraf-export/backend/routes"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/logger"
	"github.com/gofiber/fiber/v3/middleware/recover"
)

func main() {
	// Kerjakan dari folder binary — path relatif (assets/, storage/, .env)
	// tetap valid apa pun cwd (systemd, supervisor, manual).
	if exe, err := os.Executable(); err == nil {
		if dir := filepath.Dir(exe); dir != "" {
			_ = os.Chdir(dir)
		}
	}
	cfg := config.Load()

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("[main] %v", err)
	}
	database.Seed(db, cfg)

	app := fiber.New(fiber.Config{
		AppName: "logikraf-export",
	})
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
	}))

	app.Get("/api/health", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": "logikraf-export"})
	})

	routes.Setup(app, db, cfg)

	log.Printf("[main] logikraf-export listen di :%s", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("[main] listen gagal: %v", err)
	}
}
