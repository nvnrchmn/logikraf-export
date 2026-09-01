package handlers

import (
	"errors"

	"logikraf-export/backend/config"
	"logikraf-export/backend/middleware"
	"logikraf-export/backend/models"
	"logikraf-export/backend/utils"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

type AuthHandler struct {
	DB  *gorm.DB
	Cfg *config.Config
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Login memverifikasi kredensial dan mengembalikan JWT.
func (h *AuthHandler) Login(c fiber.Ctx) error {
	var req loginRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "request tidak valid"})
	}
	if req.Email == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "email dan password wajib diisi"})
	}

	var user models.User
	err := h.DB.Where("email = ?", req.Email).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(401).JSON(fiber.Map{"error": "email atau password salah"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "gagal memuat user"})
	}
	if !user.Active {
		return c.Status(401).JSON(fiber.Map{"error": "akun dinonaktifkan, hubungi admin"})
	}
	if !utils.CheckPassword(user.PasswordHash, req.Password) {
		return c.Status(401).JSON(fiber.Map{"error": "email atau password salah"})
	}

	token, err := utils.GenerateToken(h.Cfg.JWTSecret, user.ID, user.Role)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "gagal membuat token"})
	}

	return c.JSON(fiber.Map{
		"token": token,
		"user":  user,
	})
}

// Me mengembalikan data user yang sedang login.
func (h *AuthHandler) Me(c fiber.Ctx) error {
	userID := middleware.CurrentUserID(c)

	var user models.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "user tidak ditemukan"})
	}
	return c.JSON(user)
}
