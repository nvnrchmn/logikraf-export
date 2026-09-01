package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config menyimpan konfigurasi aplikasi dari environment.
type Config struct {
	Port          string
	DBHost        string
	DBPort        string
	DBUser        string
	DBPassword    string
	DBName        string
	JWTSecret     string
	AdminEmail    string
	AdminPassword string
	Env           string
}

// Load membaca .env (jika ada) + environment variables.
func Load() *Config {
	// .env hanya untuk dev lokal; di produksi pakai EnvironmentFile systemd
	if _, err := os.Stat(".env"); err == nil {
		if err := godotenv.Load(); err != nil {
			log.Printf("[config] warning: gagal load .env: %v", err)
		}
	}

	env := getEnv("ENV", "development")
	return &Config{
		Port:          getEnv("PORT", "8091"),
		DBHost:        getEnv("DB_HOST", "127.0.0.1"),
		DBPort:        getEnv("DB_PORT", "3306"),
		DBUser:        getEnv("DB_USER", "logikraf_export"),
		DBPassword:    getEnv("DB_PASSWORD", ""),
		DBName:        getEnv("DB_NAME", "logikraf_export"),
		JWTSecret:     getEnv("JWT_SECRET", "dev-secret-change-me"),
		AdminEmail:    getEnv("ADMIN_EMAIL", "admin@logikraf.id"),
		AdminPassword: getEnv("ADMIN_PASSWORD", "admin123"),
		Env:           env,
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
