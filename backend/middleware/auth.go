package middleware

import (
	"strings"

	"logikraf-export/backend/config"
	"logikraf-export/backend/utils"

	"github.com/gofiber/fiber/v3"
)

const (
	CtxUserID = "auth_user_id"
	CtxRole   = "auth_role"
)

// RequireAuth — memvalidasi Bearer token JWT.
func RequireAuth(cfg *config.Config) fiber.Handler {
	return func(c fiber.Ctx) error {
		header := c.Get("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "token tidak ditemukan"})
		}

		claims, err := utils.ParseToken(cfg.JWTSecret, strings.TrimPrefix(header, "Bearer "))
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "token tidak valid atau kedaluwarsa"})
		}

		c.Locals(CtxUserID, claims.UserID)
		c.Locals(CtxRole, claims.Role)
		return c.Next()
	}
}

// RequireRole — membatasi akses ke role tertentu.
func RequireRole(roles ...string) fiber.Handler {
	return func(c fiber.Ctx) error {
		role, _ := c.Locals(CtxRole).(string)
		for _, r := range roles {
			if role == r {
				return c.Next()
			}
		}
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "tidak punya akses"})
	}
}

// CurrentUserID helper untuk membaca user id dari context.
func CurrentUserID(c fiber.Ctx) uint {
	id, _ := c.Locals(CtxUserID).(uint)
	return id
}

// CurrentRole helper untuk membaca role dari context.
func CurrentRole(c fiber.Ctx) string {
	role, _ := c.Locals(CtxRole).(string)
	return role
}
