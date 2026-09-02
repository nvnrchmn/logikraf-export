package models

import "time"

// User — akun internal, role: admin | ops
type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Name         string    `gorm:"size:191" json:"name"`
	Email        string    `gorm:"uniqueIndex;size:191" json:"email"`
	PasswordHash string    `json:"-"`
	Role         string    `gorm:"size:20;default:ops" json:"role"`
	Active       bool      `gorm:"default:true" json:"active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// Product — barang jadi di gudang (mousepad & sejenisnya), punya HS Code
type Product struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	SKU          string    `gorm:"uniqueIndex;size:64" json:"sku"`
	Name         string    `gorm:"size:191" json:"name"`
	HSCode       string    `gorm:"size:20" json:"hs_code"`
	Description  string    `json:"description"`
	LengthCm     float64   `json:"length_cm"`
	WidthCm      float64   `json:"width_cm"`
	HeightCm     float64   `json:"height_cm"`
	NetWeightG   float64   `json:"net_weight_g"`
	GrossWeightG float64   `json:"gross_weight_g"`
	UnitPriceUSD float64   `gorm:"type:decimal(14,4)" json:"unit_price_usd"`
	Active       bool      `gorm:"default:true" json:"active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// Buyer — consignee / customer luar negeri
type Buyer struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	CompanyName  string    `gorm:"size:191" json:"company_name"`
	Country      string    `gorm:"size:64" json:"country"`
	Address      string    `json:"address"`
	City         string    `gorm:"size:128" json:"city"`
	PostalCode   string    `gorm:"size:32" json:"postal_code"`
	ContactName  string    `gorm:"size:128" json:"contact_name"`
	ContactPhone string    `gorm:"size:64" json:"contact_phone"`
	ContactEmail string    `gorm:"size:128" json:"contact_email"`
	TaxID        string    `gorm:"size:64" json:"tax_id"`
	Active       bool      `gorm:"default:true" json:"active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// Port — pelabuhan dengan kode UN/LOCODE
type Port struct {
	ID      uint   `gorm:"primaryKey" json:"id"`
	Code    string `gorm:"uniqueIndex;size:8" json:"code"` // UN/LOCODE, mis. IDTPP
	Name    string `gorm:"size:191" json:"name"`
	Country string `gorm:"size:64" json:"country"`
}

// Incoterm — Incoterms 2020
type Incoterm struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Code        string `gorm:"uniqueIndex;size:8" json:"code"`
	Description string `gorm:"size:255" json:"description"`
}

// Order status flow: draft → confirmed → packed → shipped → completed | cancelled
// ShippingMode: courier (parcel/ekspres) | lcl | fcl
type Order struct {
	ID              uint        `gorm:"primaryKey" json:"id"`
	OrderNo         string      `gorm:"uniqueIndex;size:32" json:"order_no"`
	ShippingMode    string      `gorm:"size:10;default:courier;index" json:"shipping_mode"`
	BuyerID         uint        `json:"buyer_id"`
	Buyer           Buyer       `gorm:"foreignKey:BuyerID" json:"buyer"`
	IncotermID      uint        `json:"incoterm_id"`
	Incoterm        Incoterm    `gorm:"foreignKey:IncotermID" json:"incoterm"`
	PortLoadingID   *uint       `json:"port_loading_id"`
	PortLoading     Port        `gorm:"foreignKey:PortLoadingID" json:"port_loading"`
	PortDischargeID *uint       `json:"port_discharge_id"`
	PortDischarge   Port        `gorm:"foreignKey:PortDischargeID" json:"port_discharge"`
	Currency        string      `gorm:"size:8;default:USD" json:"currency"`
	PaymentTerms    string      `gorm:"size:255" json:"payment_terms"`
	Status          string      `gorm:"size:20;default:draft;index" json:"status"`
	PaymentStatus   string      `gorm:"size:12;default:unpaid" json:"payment_status"` // unpaid | dp | paid
	PaymentNote     string      `gorm:"size:255" json:"payment_note"`
	PaidAt          *time.Time  `json:"paid_at"`
	Notes           string      `json:"notes"`
	CreatedBy       uint        `json:"created_by"`
	Items           []OrderItem `gorm:"foreignKey:OrderID" json:"items"`
	Shipment        *Shipment   `gorm:"foreignKey:OrderID" json:"shipment,omitempty"`
	TotalFOB        float64     `gorm:"-" json:"total_fob"`
	TotalNetKG      float64     `gorm:"-" json:"total_net_kg"`
	TotalGrossKG    float64     `gorm:"-" json:"total_gross_kg"`
	TotalCBM        float64     `gorm:"-" json:"total_cbm"`
	PEBRequired     bool        `gorm:"-" json:"peb_required"`
	CreatedAt       time.Time   `json:"created_at"`
	UpdatedAt       time.Time   `json:"updated_at"`
}

type OrderItem struct {
	ID           uint    `gorm:"primaryKey" json:"id"`
	OrderID      uint    `json:"order_id"`
	ProductID    uint    `json:"product_id"`
	Product      Product `gorm:"foreignKey:ProductID" json:"product"`
	Quantity     int     `json:"quantity"`
	UnitPriceUSD float64 `gorm:"type:decimal(14,4)" json:"unit_price_usd"`
	LineTotal    float64 `gorm:"-" json:"line_total"`
}

// Shipment — 1:1 dengan Order; field courier untuk mode parcel, field laut untuk LCL/FCL
type Shipment struct {
	ID            uint       `gorm:"primaryKey" json:"id"`
	OrderID       uint       `gorm:"uniqueIndex" json:"order_id"`
	PEBNo         string     `gorm:"size:64" json:"peb_no"`
	NPENo         string     `gorm:"size:64" json:"npe_no"`
	VesselName    string     `gorm:"size:191" json:"vessel_name"`
	VoyageNo      string     `gorm:"size:64" json:"voyage_no"`
	StuffingDate  *time.Time `json:"stuffing_date"`
	GateInDate    *time.Time `json:"gate_in_date"`
	ETD           *time.Time `json:"etd"`
	OnboardDate   *time.Time `json:"onboard_date"`
	PODDate       *time.Time `json:"pod_date"`
	Courier       string     `gorm:"size:64" json:"courier"`
	AWBNo         string     `gorm:"size:64" json:"awb_no"`
	PickupDate    *time.Time `json:"pickup_date"`
	DeliveredDate *time.Time `json:"delivered_date"`
	Notes         string     `json:"notes"`
}

// Document — artefak PDF hasil generate (PI/CI/PL/SI/PEB)
type Document struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	DocNo       string    `gorm:"uniqueIndex;size:32" json:"doc_no"`
	OrderID     uint      `json:"order_id"`
	Order       Order     `gorm:"foreignKey:OrderID" json:"-"`
	DocType     string    `gorm:"size:8" json:"doc_type"` // PI | CI | PL | SI | PEB
	FilePath    string    `gorm:"size:255" json:"file_path"`
	GeneratedBy uint      `json:"generated_by"`
	CreatedAt   time.Time `json:"created_at"`
}

// DocSequence — counter nomor dokumen per tipe per periode YYYYMM
type DocSequence struct {
	Type   string `gorm:"primaryKey;size:8"`
	Period string `gorm:"primaryKey;size:6"` // YYYYMM
	LastNo uint
}

// CompanySetting — profil perusahaan (1 baris, id=1) untuk header dokumen & PEB
type CompanySetting struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	CompanyName    string    `gorm:"size:191" json:"company_name"`
	Address        string    `json:"address"`
	City           string    `gorm:"size:100" json:"city"`
	Country        string    `gorm:"size:64" json:"country"`
	Email          string    `gorm:"size:100" json:"email"`
	Phone          string    `gorm:"size:32" json:"phone"`
	Website        string    `gorm:"size:100" json:"website"`
	NIB            string    `gorm:"size:64" json:"nib"`
	NPWP           string    `gorm:"size:32" json:"npwp"`
	SignerName     string    `gorm:"size:100" json:"signer_name"`
	SignerTitle    string    `gorm:"size:100" json:"signer_title"`
	SignatureImage string    `gorm:"size:255" json:"signature_image"`
	UpdatedBy      uint      `json:"updated_by"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// AuditLog — jejak perubahan ringan
type AuditLog struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Action    string    `gorm:"size:32" json:"action"`
	Entity    string    `gorm:"size:32" json:"entity"`
	EntityID  string    `gorm:"size:32" json:"entity_id"`
	Detail    string    `json:"detail"`
	CreatedAt time.Time `json:"created_at"`
}
