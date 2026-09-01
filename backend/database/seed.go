package database

import (
	"log"

	"logikraf-export/backend/config"
	"logikraf-export/backend/models"
	"logikraf-export/backend/utils"

	"gorm.io/gorm"
)

// Seed mengisi data awal: pelabuhan, incoterms, admin.
func Seed(db *gorm.DB, cfg *config.Config) {
	seedPorts(db)
	seedIncoterms(db)
	seedAdmin(db, cfg)
}

func seedPorts(db *gorm.DB) {
	var count int64
	db.Model(&models.Port{}).Count(&count)
	if count > 0 {
		return
	}

	ports := []models.Port{
		{Code: "IDTPP", Name: "Tanjung Priok", Country: "Indonesia"},
		{Code: "IDSUB", Name: "Tanjung Perak (Surabaya)", Country: "Indonesia"},
		{Code: "IDBLW", Name: "Belawan", Country: "Indonesia"},
		{Code: "IDUPG", Name: "Makassar", Country: "Indonesia"},
		{Code: "IDSRG", Name: "Tanjung Emas (Semarang)", Country: "Indonesia"},
		{Code: "IDPNJ", Name: "Panjang (Lampung)", Country: "Indonesia"},
		{Code: "IDBPN", Name: "Balikpapan", Country: "Indonesia"},
		{Code: "IDBTU", Name: "Bitung", Country: "Indonesia"},
		{Code: "SGSIN", Name: "Singapore", Country: "Singapore"},
		{Code: "MYPKG", Name: "Port Klang", Country: "Malaysia"},
		{Code: "MYTPP", Name: "Tanjung Pelepas", Country: "Malaysia"},
		{Code: "HKHKG", Name: "Hong Kong", Country: "Hong Kong"},
		{Code: "CNSZX", Name: "Shenzhen", Country: "China"},
		{Code: "CNSHA", Name: "Shanghai", Country: "China"},
		{Code: "CNNGB", Name: "Ningbo", Country: "China"},
		{Code: "CNCAN", Name: "Guangzhou", Country: "China"},
		{Code: "KRBUS", Name: "Busan", Country: "South Korea"},
		{Code: "JPTYO", Name: "Tokyo", Country: "Japan"},
		{Code: "JPYOK", Name: "Yokohama", Country: "Japan"},
		{Code: "THLCH", Name: "Laem Chabang", Country: "Thailand"},
		{Code: "VNSGN", Name: "Ho Chi Minh", Country: "Vietnam"},
		{Code: "PHMNL", Name: "Manila", Country: "Philippines"},
		{Code: "INNSA", Name: "Nhava Sheva", Country: "India"},
		{Code: "AUSYD", Name: "Sydney", Country: "Australia"},
		{Code: "AUMEL", Name: "Melbourne", Country: "Australia"},
		{Code: "USLAX", Name: "Los Angeles", Country: "United States"},
		{Code: "USNYC", Name: "New York / Newark", Country: "United States"},
		{Code: "NLRTM", Name: "Rotterdam", Country: "Netherlands"},
		{Code: "DEHAM", Name: "Hamburg", Country: "Germany"},
		{Code: "AEDXB", Name: "Jebel Ali (Dubai)", Country: "UAE"},
	}
	if err := db.Create(&ports).Error; err != nil {
		log.Printf("[seed] ports gagal: %v", err)
	} else {
		log.Printf("[seed] %d pelabuhan dibuat", len(ports))
	}
}

func seedIncoterms(db *gorm.DB) {
	var count int64
	db.Model(&models.Incoterm{}).Count(&count)
	if count > 0 {
		return
	}

	terms := []models.Incoterm{
		{Code: "EXW", Description: "Ex Works — barang diambil di gudang penjual"},
		{Code: "FCA", Description: "Free Carrier — diserahkan ke carrier di tempat penjual"},
		{Code: "FAS", Description: "Free Alongside Ship — diserahkan di samping kapal"},
		{Code: "FOB", Description: "Free On Board — diserahkan di atas kapal; buyer tanggung freight"},
		{Code: "CFR", Description: "Cost and Freight — harga + ongkos angkut laut"},
		{Code: "CIF", Description: "Cost, Insurance and Freight — harga + angkut + asuransi"},
		{Code: "CPT", Description: "Carriage Paid To — angkut dibayar sampai tujuan tertentu"},
		{Code: "CIP", Description: "Carriage and Insurance Paid To — angkut + asuransi sampai tujuan"},
		{Code: "DAP", Description: "Delivered at Place — dikirim sampai tempat tujuan"},
		{Code: "DPU", Description: "Delivered at Place Unloaded — dikirim sampai tujuan, dibongkar"},
		{Code: "DDP", Description: "Delivered Duty Paid — sampai tujuan, bea dibayar penjual"},
	}
	if err := db.Create(&terms).Error; err != nil {
		log.Printf("[seed] incoterms gagal: %v", err)
	} else {
		log.Printf("[seed] %d incoterms dibuat", len(terms))
	}
}

func seedAdmin(db *gorm.DB, cfg *config.Config) {
	var count int64
	db.Model(&models.User{}).Where("role = ?", "admin").Count(&count)
	if count > 0 {
		return
	}

	hash, err := utils.HashPassword(cfg.AdminPassword)
	if err != nil {
		log.Printf("[seed] hash admin gagal: %v", err)
		return
	}

	admin := models.User{
		Name:         "Admin",
		Email:        cfg.AdminEmail,
		PasswordHash: hash,
		Role:         "admin",
	}
	if err := db.Create(&admin).Error; err != nil {
		log.Printf("[seed] admin gagal: %v", err)
	} else {
		log.Printf("[seed] admin dibuat: %s", admin.Email)
	}
}
