package utils

import (
	"os"
	"path/filepath"
	"testing"

	"logikraf-export/backend/models"
)

// Sample data dengan alamat panjang, NIB/NPWP, dan deskripsi item panjang —
// untuk memastikan wrap text, header tabel, dan label identitas tampil benar.
func sampleDocData(docType string) DocData {
	return DocData{
		DocNo: docType + "-2026-0001-001",
		Company: models.CompanySetting{
			CompanyName:    "PT Logika Kreatif Indonesia",
			Address:        "Jl. Raya Kebayoran Lama No. 12, Kel. Palmerah, Kec. Kebayoran Lama, Jakarta Selatan, DKI Jakarta, Gedung Menara Lt. 5 Suite 502, Kav. 33",
			City:           "Jakarta, Indonesia",
			Email:          "export@logikraf.id",
			Phone:          "+62 21 1234 5678",
			Website:        "logikraf.id",
			NIB:            "812345678901234",
			NPWP:           "012345678901234",
			SignerName:     "Nova Nurachman",
			SignerTitle:    "Direktur",
			SignatureImage: "storage/signatures/tidak-ada.png", // file hilang ≠ gagal render
		},
		Order: models.Order{
			OrderNo:      "ORD-2026-0001",
			ShippingMode: "lcl",
			Currency:     "USD",
			PaymentTerms: "50% deposit by bank transfer, balance due 7 days after Bill of Lading date (TT/TT)",
			Notes:        "This is a long note that should also wrap gracefully inside the document layout when it exceeds the available width.",
			Buyer: models.Buyer{
				CompanyName:  "Global Trade Solutions Pte. Ltd.",
				Address:      "80 Robinson Road, #20-01, Singapore 068898, One Raffles Place Tower 2, Suite 1204",
				City:         "Singapore",
				Country:      "Singapore",
				ContactName:  "James Tan",
				ContactEmail: "james.tan@gtrade.sg",
			},
			Incoterm: models.Incoterm{
				Code:        "FOB",
				Description: "Free on Board — penyerahan barang di atas kapal di pelabuhan muat, risiko beralih setelah melewati rel kapal",
			},
			PortLoading: models.Port{
				Code:    "IDTPP",
				Name:    "Tanjung Priok",
				Country: "Indonesia",
			},
			PortDischarge: models.Port{
				Code:    "SGSIN",
				Name:    "Singapore",
				Country: "Singapore",
			},
			Items: []models.OrderItem{
				{
					Quantity:     500,
					UnitPriceUSD: 8.5,
					Product: models.Product{
						SKU:          "MP-DESK-01",
						Name:         "Deskmat non-slip dengan permukaan microweave, tepi dijahit ganda untuk ketahanan pemakaian harian",
						HSCode:       "4016.99",
						Description:  "Rubber deskmat 90x40cm, 3mm thickness, non-slip base, stitched edges, custom printed",
						NetWeightG:   150,
						GrossWeightG: 180,
						LengthCm:     90,
						WidthCm:      40,
						HeightCm:     0.3,
						UnitPriceUSD: 8.5,
					},
				},
				{
					Quantity:     300,
					UnitPriceUSD: 12.0,
					Product: models.Product{
						SKU:          "MB-XL-02",
						Name:         "Extended mousepad dengan wrist rest memory foam",
						HSCode:       "4016.99",
						NetWeightG:   220,
						GrossWeightG: 260,
						LengthCm:     80,
						WidthCm:      30,
						HeightCm:     1,
						UnitPriceUSD: 12.0,
					},
				},
			},
		},
	}
}

// TestBuildDocumentRender memastikan semua tipe dokumen bisa dirender tanpa
// error dan menghasilkan file PDF yang valid (bukan kosong).
func TestBuildDocumentRender(t *testing.T) {
	if err := os.Chdir(".."); err != nil { // fontPath relatif ke root backend
		t.Fatal(err)
	}
	out := filepath.Join(os.TempDir(), "lx-docgen")
	if err := os.MkdirAll(out, 0o755); err != nil {
		t.Fatal(err)
	}
	for _, typ := range []string{"PI", "CI", "PL", "SI", "PEB"} {
		buf, err := BuildDocument(sampleDocData(typ))
		if err != nil {
			t.Fatalf("%s: render gagal: %v", typ, err)
		}
		if len(buf) < 5000 {
			t.Fatalf("%s: hasil PDF terlalu kecil (%d bytes)", typ, len(buf))
		}
		p := filepath.Join(out, typ+".pdf")
		if err := os.WriteFile(p, buf, 0o644); err != nil {
			t.Fatal(err)
		}
		t.Logf("%s OK -> %s (%d bytes)", typ, p, len(buf))
	}
}

func TestMoneyInWords(t *testing.T) {
	cases := []struct {
		in   float64
		want string
	}{
		{0, "SAY: Zero USD AND 00/100"},
		{19, "SAY: Nineteen USD AND 00/100"},
		{21, "SAY: Twenty One USD AND 00/100"},
		{100, "SAY: One Hundred USD AND 00/100"},
		{850, "SAY: Eight Hundred Fifty USD AND 00/100"},
		{1234567.89, "SAY: One Million Two Hundred Thirty Four Thousand Five Hundred Sixty Seven USD AND 89/100"},
	}
	for _, c := range cases {
		if got := moneyInWords(c.in, "USD"); got != c.want {
			t.Errorf("moneyInWords(%v) = %q, want %q", c.in, got, c.want)
		}
	}
}
