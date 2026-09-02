package handlers

import (
	"os"
	"path/filepath"

	"logikraf-export/backend/middleware"
	"logikraf-export/backend/models"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

type CompanyHandler struct {
	DB *gorm.DB
}

// Get — profil perusahaan (1 baris).
func (h *CompanyHandler) Get(c fiber.Ctx) error {
	var cs models.CompanySetting
	if err := h.DB.First(&cs, 1).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal memuat profil perusahaan"})
	}
	return c.JSON(cs)
}

type companyReq struct {
	CompanyName string `json:"company_name"`
	Address     string `json:"address"`
	City        string `json:"city"`
	Country     string `json:"country"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
	Website     string `json:"website"`
	NIB         string `json:"nib"`
	NPWP        string `json:"npwp"`
	SignerName  string `json:"signer_name"`
	SignerTitle string `json:"signer_title"`
}

// Update — admin: ubah profil perusahaan.
func (h *CompanyHandler) Update(c fiber.Ctx) error {
	var req companyReq
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "payload tidak valid"})
	}
	if req.CompanyName == "" {
		return c.Status(400).JSON(fiber.Map{"error": "nama perusahaan wajib diisi"})
	}
	var cs models.CompanySetting
	if err := h.DB.First(&cs, 1).Error; err != nil {
		cs = models.CompanySetting{ID: 1}
	}
	cs.CompanyName = req.CompanyName
	cs.Address = req.Address
	cs.City = req.City
	cs.Country = req.Country
	cs.Email = req.Email
	cs.Phone = req.Phone
	cs.Website = req.Website
	cs.NIB = req.NIB
	cs.NPWP = req.NPWP
	cs.SignerName = req.SignerName
	cs.SignerTitle = req.SignerTitle
	cs.UpdatedBy = middleware.CurrentUserID(c)
	if err := h.DB.Save(&cs).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menyimpan profil"})
	}
	LogAudit(h.DB, cs.UpdatedBy, "update", "company", "1", req.CompanyName)
	return c.JSON(cs)
}

// SignatureImage — kirim gambar tanda tangan tersimpan
func (h *CompanyHandler) SignatureImage(c fiber.Ctx) error {
	var cs models.CompanySetting
	if err := h.DB.First(&cs, 1).Error; err != nil || cs.SignatureImage == "" {
		return c.Status(404).JSON(fiber.Map{"error": "tanda tangan belum ada"})
	}
	if _, err := os.Stat(cs.SignatureImage); err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "tanda tangan belum ada"})
	}
	return c.SendFile(cs.SignatureImage)
}

// UploadSignature — admin: upload gambar tanda tangan (PNG/JPG, maks 2MB).
func (h *CompanyHandler) UploadSignature(c fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "file tidak ditemukan (field 'file')"})
	}
	if file.Size > 2*1024*1024 {
		return c.Status(400).JSON(fiber.Map{"error": "file maksimal 2MB"})
	}
	// fpdf hanya support PNG/JPEG (bukan WEBP) — batasi format
	ext := filepath.Ext(file.Filename)
	switch ext {
	case ".png", ".jpg", ".jpeg":
	default:
		return c.Status(400).JSON(fiber.Map{"error": "format harus PNG/JPG"})
	}

	dir := filepath.Join("storage", "signatures")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menyiapkan folder"})
	}
	// buang file lama (ekstensi apa pun) supaya tidak numpuk & path DB selalu valid
	for _, old := range []string{".png", ".jpg", ".jpeg"} {
		os.Remove(filepath.Join(dir, "signature"+old))
	}
	path := filepath.Join(dir, "signature"+ext)
	if err := c.SaveFile(file, path); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menyimpan file"})
	}

	var cs models.CompanySetting
	if err := h.DB.First(&cs, 1).Error; err != nil {
		cs = models.CompanySetting{ID: 1}
	}
	cs.SignatureImage = path
	cs.UpdatedBy = middleware.CurrentUserID(c)
	h.DB.Save(&cs)
	LogAudit(h.DB, cs.UpdatedBy, "update", "company", "1", "tanda tangan: "+path)
	return c.JSON(cs)
}

// LogoImage — kirim gambar logo perusahaan tersimpan.
func (h *CompanyHandler) LogoImage(c fiber.Ctx) error {
	var cs models.CompanySetting
	if err := h.DB.First(&cs, 1).Error; err != nil || cs.LogoImage == "" {
		return c.Status(404).JSON(fiber.Map{"error": "logo belum ada"})
	}
	if _, err := os.Stat(cs.LogoImage); err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "logo belum ada"})
	}
	return c.SendFile(cs.LogoImage)
}

// UploadLogo — admin: upload logo perusahaan (PNG/JPG, maks 2MB). Satu file: storage/logos/logo.<ext>.
func (h *CompanyHandler) UploadLogo(c fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "file tidak ditemukan (field 'file')"})
	}
	if file.Size > 2*1024*1024 {
		return c.Status(400).JSON(fiber.Map{"error": "file maksimal 2MB"})
	}
	ext := filepath.Ext(file.Filename)
	switch ext {
	case ".png", ".jpg", ".jpeg":
	default:
		return c.Status(400).JSON(fiber.Map{"error": "format harus PNG/JPG"})
	}

	dir := filepath.Join("storage", "logos")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menyiapkan folder"})
	}
	for _, old := range []string{".png", ".jpg", ".jpeg"} {
		os.Remove(filepath.Join(dir, "logo"+old))
	}
	path := filepath.Join(dir, "logo"+ext)
	if err := c.SaveFile(file, path); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "gagal menyimpan file"})
	}

	var cs models.CompanySetting
	if err := h.DB.First(&cs, 1).Error; err != nil {
		cs = models.CompanySetting{ID: 1}
	}
	cs.LogoImage = path
	cs.UpdatedBy = middleware.CurrentUserID(c)
	h.DB.Save(&cs)
	LogAudit(h.DB, cs.UpdatedBy, "update", "company", "1", "logo: "+path)
	return c.JSON(cs)
}
