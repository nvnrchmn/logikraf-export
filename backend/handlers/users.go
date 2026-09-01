package handlers

import (
	"strconv"
	"strings"

	"logikraf-export/backend/middleware"
	"logikraf-export/backend/models"
	"logikraf-export/backend/utils"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

type UserHandler struct {
	DB *gorm.DB
}

// List — semua user (admin only).
func (h *UserHandler) List(c fiber.Ctx) error {
	var users []models.User
	if err := h.DB.Order("id ASC").Find(&users).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal memuat user"})
	}
	return c.JSON(users)
}

// Create — tambah user (admin only); role ops | admin.
func (h *UserHandler) Create(c fiber.Ctx) error {
	var req struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "payload tidak valid"})
	}
	if req.Name == "" || req.Email == "" || req.Password == "" {
		return c.Status(400).JSON(fiber.Map{"error": "nama, email, dan password wajib diisi"})
	}
	if req.Role != "admin" && req.Role != "ops" {
		req.Role = "ops"
	}
	if len(req.Password) < 6 {
		return c.Status(400).JSON(fiber.Map{"error": "password minimal 6 karakter"})
	}
	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal hash password"})
	}
	u := models.User{Name: req.Name, Email: req.Email, PasswordHash: hash, Role: req.Role}
	if err := h.DB.Create(&u).Error; err != nil {
		if isDuplicateKey(err) {
			return c.Status(409).JSON(fiber.Map{"error": "email sudah dipakai"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "gagal menyimpan user"})
	}
	LogAudit(h.DB, middleware.CurrentUserID(c), "create", "user", strconv.FormatUint(uint64(u.ID), 10), u.Email+" ("+u.Role+")")
	u.PasswordHash = ""
	return c.Status(201).JSON(u)
}

// ResetPassword — ganti password user (admin only).
func (h *UserHandler) ResetPassword(c fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id tidak valid"})
	}
	var req struct {
		Password string `json:"password"`
	}
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "payload tidak valid"})
	}
	if len(req.Password) < 6 {
		return c.Status(400).JSON(fiber.Map{"error": "password minimal 6 karakter"})
	}
	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal hash password"})
	}
	res := h.DB.Model(&models.User{}).Where("id = ?", id).Update("password_hash", hash)
	if res.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menyimpan password"})
	}
	if res.RowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "user tidak ditemukan"})
	}
	LogAudit(h.DB, middleware.CurrentUserID(c), "reset_password", "user", strconv.FormatUint(uint64(id), 10), "")
	return c.JSON(fiber.Map{"ok": true})
}

// Deactivate — nonaktifkan user (admin only); tidak bisa nonaktifkan diri sendiri.
func (h *UserHandler) Deactivate(c fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id tidak valid"})
	}
	if id == middleware.CurrentUserID(c) {
		return c.Status(400).JSON(fiber.Map{"error": "tidak bisa menonaktifkan akun sendiri"})
	}
	res := h.DB.Model(&models.User{}).Where("id = ?", id).Update("active", false)
	if res.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menonaktifkan user"})
	}
	if res.RowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "user tidak ditemukan"})
	}
	LogAudit(h.DB, middleware.CurrentUserID(c), "deactivate", "user", strconv.FormatUint(uint64(id), 10), "")
	return c.JSON(fiber.Map{"ok": true})
}

// Activate — aktifkan kembali user.
func (h *UserHandler) Activate(c fiber.Ctx) error {
	id, err := idParam(c)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "id tidak valid"})
	}
	res := h.DB.Model(&models.User{}).Where("id = ?", id).Update("active", true)
	if res.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal mengaktifkan user"})
	}
	if res.RowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "user tidak ditemukan"})
	}
	LogAudit(h.DB, middleware.CurrentUserID(c), "activate", "user", strconv.FormatUint(uint64(id), 10), "")
	return c.JSON(fiber.Map{"ok": true})
}

func isDuplicateKey(err error) bool {
	return err != nil && strings.Contains(err.Error(), "1062")
}
