package database

import (
	"fmt"
	"log"
	"time"

	"logikraf-export/backend/config"
	"logikraf-export/backend/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Connect membuka koneksi MySQL + AutoMigrate semua model.
func Connect(cfg *config.Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName,
	)

	gormLogLevel := logger.Warn
	if cfg.Env == "development" {
		gormLogLevel = logger.Info
	}

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(gormLogLevel),
	})
	if err != nil {
		return nil, fmt.Errorf("gagal konek MySQL: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}
	sqlDB.SetMaxOpenConns(20)
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetConnMaxLifetime(time.Hour)

	if err := db.AutoMigrate(
		&models.User{},
		&models.Product{},
		&models.Buyer{},
		&models.Port{},
		&models.Incoterm{},
		&models.Order{},
		&models.OrderItem{},
		&models.Shipment{},
		&models.Document{},
		&models.DocSequence{},
		&models.AuditLog{},
	); err != nil {
		return nil, fmt.Errorf("AutoMigrate gagal: %w", err)
	}

	log.Printf("[db] terhubung ke MySQL %s/%s", cfg.DBHost, cfg.DBName)
	return db, nil
}
