package utils

import (
	"bytes"
	"fmt"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"logikraf-export/backend/models"

	"github.com/go-pdf/fpdf"
)

// Informasi seller (logikraf.id) — muncul di semua dokumen export.
const (
	SellerName    = "PT Logika Kreatif Indonesia"
	SellerAddress = "Jakarta, Indonesia"
	SellerTaxID   = "NIB / NPWP: per data perusahaan"
)

// Data dokumen yang diteruskan ke generator.
type DocData struct {
	DocNo   string
	Order   models.Order
	Company models.CompanySetting
}

// BuildDocument menghasilkan PDF byte sesuai tipe dokumen.
// Tipe: PI | CI | PL | SI | PEB
func BuildDocument(d DocData) ([]byte, error) {
	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(15, 15, 15)
	pdf.AddUTF8Font("DVS", "", fontPath(""))
	pdf.AddUTF8Font("DVS-B", "", fontPath("B"))
	pdf.AddPage()
	pdf.SetFont("DVS", "", 9)

	if d.DocType() == "PEB" {
		pebSheet(pdf, d)
	} else {
		header(pdf, d, docTitle(d.DocType()))
		buyerBlock(pdf, d.Order)
		termsBlock(pdf, d.Order)
		itemsTable(pdf, d.Order)
		totalsBlock(pdf, d.Order, d.DocType())
		notesBlock(pdf, d.Order)
		signatureBlock(pdf, d)
	}
	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("gagal render pdf: %w", err)
	}
	return buf.Bytes(), nil
}

func docTitle(docType string) string {
	switch docType {
	case "PI":
		return "PROFORMA INVOICE"
	case "CI":
		return "COMMERCIAL INVOICE"
	case "PL":
		return "PACKING LIST"
	case "SI":
		return "SHIPPING INSTRUCTION"
	}
	return strings.ToUpper(docType)
}

// DocType mengembalikan tipe dokumen dari nomor dokumen (prefix sebelum '-').
func (d DocData) DocType() string {
	parts := strings.SplitN(d.DocNo, "-", 2)
	if len(parts) == 0 {
		return ""
	}
	return parts[0]
}

func fontPath(style string) string {
	f := "DejaVuSans.ttf"
	if style == "B" {
		f = "DejaVuSans-Bold.ttf"
	}
	return filepath.Join("assets", "fonts", f)
}

// ---------- Blok UI ----------

func header(pdf *fpdf.Fpdf, d DocData, title string) {
	c := d.Company
	pdf.SetFont("DVS-B", "", 13)
	pdf.SetTextColor(30, 41, 59)
	pdf.CellFormat(90, 8, c.CompanyName, "", 0, "L", false, 0, "")
	pdf.SetFont("DVS-B", "", 12)
	pdf.CellFormat(90, 8, title, "", 1, "R", false, 0, "")
	pdf.SetFont("DVS", "", 8)
	pdf.SetTextColor(100, 116, 139)
	addr := strings.TrimSpace(c.Address + ", " + c.City)
	if addr != "" {
		pdf.CellFormat(90, 5, addr, "", 0, "L", false, 0, "")
		pdf.CellFormat(90, 5, "No. "+d.DocNo, "", 1, "R", false, 0, "")
	}
	contact := strings.TrimSpace(c.Email + "  |  " + c.Phone)
	if contact != "" {
		pdf.CellFormat(90, 5, contact, "", 0, "L", false, 0, "")
		pdf.CellFormat(90, 5, "Date: "+fmtDate(time.Now()), "", 1, "R", false, 0, "")
	} else {
		pdf.CellFormat(90, 5, "", "", 0, "L", false, 0, "")
		pdf.CellFormat(90, 5, "Date: "+fmtDate(time.Now()), "", 1, "R", false, 0, "")
	}
	if c.NIB != "" || c.NPWP != "" {
		pdf.CellFormat(0, 5, "NIB: "+c.NIB+"   NPWP: "+c.NPWP, "", 1, "L", false, 0, "")
	}
	pdf.SetTextColor(0, 0, 0)
	pdf.Ln(4)
	line(pdf)
}

func buyerBlock(pdf *fpdf.Fpdf, o models.Order) {
	pdf.SetFont("DVS-B", "", 9)
	pdf.CellFormat(0, 6, "Consignee / Buyer", "", 1, "L", false, 0, "")
	pdf.SetFont("DVS", "", 9)
	pdf.CellFormat(0, 5, o.Buyer.CompanyName, "", 1, "L", false, 0, "")
	if o.Buyer.Address != "" {
		pdf.CellFormat(0, 5, o.Buyer.Address, "", 1, "L", false, 0, "")
	}
	city := strings.TrimSpace(o.Buyer.City + ", " + o.Buyer.Country)
	if city != "" {
		pdf.CellFormat(0, 5, city, "", 1, "L", false, 0, "")
	}
	if o.Buyer.ContactName != "" {
		pdf.CellFormat(0, 5, "Attn: "+o.Buyer.ContactName, "", 1, "L", false, 0, "")
	}
	if o.Buyer.TaxID != "" {
		pdf.CellFormat(0, 5, "Tax/VAT ID: "+o.Buyer.TaxID, "", 1, "L", false, 0, "")
	}
	pdf.Ln(3)
}

func termsBlock(pdf *fpdf.Fpdf, o models.Order) {
	terms := [][2]string{
		{"Incoterm", o.Incoterm.Code + " — " + o.Incoterm.Description},
		{"Payment Terms", o.PaymentTerms},
	}
	if o.ShippingMode == "courier" {
		terms = append(terms, [2]string{"Shipping", "Courier / parcel ekspres (AWB)"})
	} else {
		terms = append([][2]string{
			{"Port of Loading", o.PortLoading.Name + " (" + o.PortLoading.Code + ")"},
			{"Port of Discharge", o.PortDischarge.Name + " (" + o.PortDischarge.Code + ")"},
		}, terms...)
	}
	for _, t := range terms {
		pdf.SetFont("DVS", "", 8)
		pdf.SetTextColor(100, 116, 139)
		pdf.CellFormat(35, 5, t[0]+":", "", 0, "L", false, 0, "")
		pdf.SetTextColor(0, 0, 0)
		pdf.CellFormat(0, 5, t[1], "", 1, "L", false, 0, "")
	}
	pdf.Ln(3)
}

func itemsTable(pdf *fpdf.Fpdf, o models.Order) {
	// Kolom: No | Description | HS Code | Qty | Unit Price | Amount
	widths := []float64{8, 70, 22, 20, 25, 35}
	headers := []string{"No", "Description", "HS Code", "Qty", "Unit Price", "Amount"}
	pdf.SetFont("DVS-B", "", 8)
	for i, h := range headers {
		pdf.CellFormat(widths[i], 7, h, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)
	pdf.SetFont("DVS", "", 8)
	for i, it := range o.Items {
		desc := it.Product.Name
		if it.Product.Description != "" {
			desc = it.Product.Description
		}
		desc = truncate(desc, 60)
		pdf.CellFormat(widths[0], 6, fmt.Sprintf("%d", i+1), "1", 0, "C", false, 0, "")
		pdf.CellFormat(widths[1], 6, desc, "1", 0, "L", false, 0, "")
		pdf.CellFormat(widths[2], 6, it.Product.HSCode, "1", 0, "C", false, 0, "")
		pdf.CellFormat(widths[3], 6, fmt.Sprintf("%d", it.Quantity), "1", 0, "R", false, 0, "")
		pdf.CellFormat(widths[4], 6, formatMoney(it.UnitPriceUSD), "1", 0, "R", false, 0, "")
		pdf.CellFormat(widths[5], 6, formatMoney(it.UnitPriceUSD*float64(it.Quantity)), "1", 0, "R", false, 0, "")
		pdf.Ln(-1)
	}
}

func totalsBlock(pdf *fpdf.Fpdf, o models.Order, docType string) {
	totalFOB := 0.0
	for _, it := range o.Items {
		totalFOB += it.UnitPriceUSD * float64(it.Quantity)
	}
	pdf.Ln(2)
	if docType == "PL" || docType == "SI" {
		netKG, grossKG, cbm := weightSummary(o)
		pdf.SetFont("DVS", "", 9)
		pdf.CellFormat(0, 6, "Total Net Weight: "+formatWeight(netKG)+" kg", "", 1, "L", false, 0, "")
		pdf.CellFormat(0, 6, "Total Gross Weight: "+formatWeight(grossKG)+" kg", "", 1, "L", false, 0, "")
		pdf.CellFormat(0, 6, "Total Volume: "+formatWeight(cbm)+" m³", "", 1, "L", false, 0, "")
	}
	pdf.SetFont("DVS-B", "", 10)
	pdf.CellFormat(0, 8, "Total FOB Value ("+o.Currency+"): "+formatMoney(totalFOB), "", 1, "R", false, 0, "")
}

func notesBlock(pdf *fpdf.Fpdf, o models.Order) {
	if strings.TrimSpace(o.Notes) == "" {
		return
	}
	pdf.Ln(2)
	pdf.SetFont("DVS-B", "", 8)
	pdf.CellFormat(0, 5, "Notes:", "", 1, "L", false, 0, "")
	pdf.SetFont("DVS", "", 8)
	pdf.MultiCell(0, 5, o.Notes, "", "L", false)
}

func signatureBlock(pdf *fpdf.Fpdf, d DocData) {
	c := d.Company
	pdf.Ln(12)
	pdf.SetFont("DVS", "", 8)
	pdf.SetTextColor(100, 116, 139)
	pdf.CellFormat(0, 5, "For and on behalf of "+c.CompanyName, "", 1, "R", false, 0, "")
	pdf.Ln(2)
	// Gambar tanda tangan (jika ada)
	if c.SignatureImage != "" {
		if info := pdf.RegisterImage(c.SignatureImage, ""); info != nil {
			w := 45.0
			h := w * info.Height() / info.Width()
			if h > 20 {
				h = 20
				w = h * info.Width() / info.Height()
			}
			pdf.ImageOptions(c.SignatureImage, 210-15-w, pdf.GetY(), w, h, false, fpdf.ImageOptions{ImageType: "", ReadDpi: true}, 0, "")
			pdf.SetY(pdf.GetY() + h + 1)
		}
	}
	pdf.SetTextColor(0, 0, 0)
	pdf.SetFont("DVS", "", 9)
	pdf.CellFormat(0, 5, "_________________________", "", 1, "R", false, 0, "")
	signer := strings.TrimSpace(c.SignerName + " — " + c.SignerTitle)
	if signer != "" {
		pdf.CellFormat(0, 5, signer, "", 1, "R", false, 0, "")
	} else {
		pdf.CellFormat(0, 5, "Authorized Signature", "", 1, "R", false, 0, "")
	}
}

// ---------- PEB Data Sheet (untuk PPJK / isi CEISA, label Indonesia) ----------

func pebSheet(pdf *fpdf.Fpdf, d DocData) {
	o := d.Order
	pdf.SetFont("DVS-B", "", 13)
	pdf.CellFormat(0, 8, "PEB DATA SHEET", "", 1, "C", false, 0, "")
	pdf.SetFont("DVS", "", 8)
	pdf.CellFormat(0, 5, "Order: "+o.OrderNo+"  |  Tanggal: "+fmtDate(time.Now()), "", 1, "C", false, 0, "")
	pdf.Ln(3)

	eksportir := d.Company.CompanyName + " — " + strings.TrimSpace(d.Company.Address+", "+d.Company.City)
	if d.Company.NIB != "" {
		eksportir += " | NIB: " + d.Company.NIB
	}
	if d.Company.NPWP != "" {
		eksportir += " | NPWP: " + d.Company.NPWP
	}
	rows := [][2]string{
		{"Eksportir", eksportir},
		{"Consignee / Buyer", o.Buyer.CompanyName + " — " + o.Buyer.City + ", " + o.Buyer.Country},
		{"Incoterm", o.Incoterm.Code + " — " + o.Incoterm.Description},
		{"Mata Uang", o.Currency},
	}
	if o.ShippingMode == "courier" {
		rows = append(rows, [2]string{"Pengiriman", "Kurir ekspres (AWB) — PEB tidak wajib di bawah $100/30kg"})
	} else {
		rows = append(rows,
			[2]string{"Pelabuhan Muat", o.PortLoading.Name + " (" + o.PortLoading.Code + ")"},
			[2]string{"Pelabuhan Bongkar", o.PortDischarge.Name + " (" + o.PortDischarge.Code + ")"},
		)
	}
	for _, r := range rows {
		pdf.SetFont("DVS-B", "", 8)
		pdf.SetTextColor(100, 116, 139)
		pdf.CellFormat(35, 6, r[0]+":", "", 0, "L", false, 0, "")
		pdf.SetTextColor(0, 0, 0)
		pdf.SetFont("DVS", "", 8)
		pdf.CellFormat(0, 6, r[1], "", 1, "L", false, 0, "")
	}
	pdf.Ln(3)

	// Tabel item dengan kolom PEB: HS Code, Uraian, Jumlah, Nilai FOB, Neto, Kotor
	widths := []float64{22, 52, 18, 25, 22, 22}
	headers := []string{"HS Code", "Uraian Barang", "Jumlah", "Nilai FOB (USD)", "Berat Neto (kg)", "Berat Kotor (kg)"}
	pdf.SetFont("DVS-B", "", 8)
	for i, h := range headers {
		pdf.CellFormat(widths[i], 7, h, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)
	pdf.SetFont("DVS", "", 8)
	netTotal, grossTotal, fobTotal := 0.0, 0.0, 0.0
	for _, it := range o.Items {
		net := it.Product.NetWeightG * float64(it.Quantity) / 1000
		gross := it.Product.GrossWeightG * float64(it.Quantity) / 1000
		fob := it.UnitPriceUSD * float64(it.Quantity)
		netTotal += net
		grossTotal += gross
		fobTotal += fob
		cells := []string{
			it.Product.HSCode,
			truncate(it.Product.Name, 40),
			fmt.Sprintf("%d pcs", it.Quantity),
			formatMoney(fob),
			formatWeight(net),
			formatWeight(gross),
		}
		for i, v := range cells {
			pdf.CellFormat(widths[i], 6, v, "1", 0, "C", false, 0, "")
		}
		pdf.Ln(-1)
	}
	pdf.SetFont("DVS-B", "", 8)
	totals := []string{"", "TOTAL", "", formatMoney(fobTotal), formatWeight(netTotal), formatWeight(grossTotal)}
	for i, v := range totals {
		pdf.CellFormat(widths[i], 6, v, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)

	pdf.Ln(4)
	pdf.SetFont("DVS", "", 8)
	pdf.SetTextColor(180, 83, 9)
	pdf.MultiCell(0, 5,
		"Catatan: Dokumen ini adalah rangkuman data untuk penyusunan PEB (Pemberitahuan Ekspor Barang). "+
			"Verifikasi HS Code & nilai FOB dengan PPJK/DJBC sebelum disubmit ke CEISA. "+
			"Nomor PEB/NPE diisi setelah ada konfirmasi dari PPJK atau sistem CEISA.", "", "L", false)
}

// ---------- Helper ----------

func line(pdf *fpdf.Fpdf) {
	pdf.SetDrawColor(203, 213, 225)
	pdf.Line(15, pdf.GetY(), 195, pdf.GetY())
	pdf.Ln(4)
}

func weightSummary(o models.Order) (netKG, grossKG, cbm float64) {
	for _, it := range o.Items {
		q := float64(it.Quantity)
		netKG += it.Product.NetWeightG * q / 1000
		grossKG += it.Product.GrossWeightG * q / 1000
		cbm += it.Product.LengthCm * it.Product.WidthCm * it.Product.HeightCm * q / 1e6
	}
	return
}

func fmtDate(t time.Time) string {
	return t.Format("02 Jan 2006")
}

func truncate(s string, n int) string {
	r := []rune(s)
	if len(r) <= n {
		return s
	}
	return string(r[:n-1]) + "…"
}

func formatMoney(v float64) string {
	s := strconv.FormatFloat(v, 'f', 2, 64)
	neg := strings.HasPrefix(s, "-")
	if neg {
		s = s[1:]
	}
	parts := strings.Split(s, ".")
	intPart := parts[0]
	var b strings.Builder
	for i, c := range intPart {
		if i > 0 && (len(intPart)-i)%3 == 0 {
			b.WriteByte(',')
		}
		b.WriteRune(c)
	}
	res := b.String()
	if len(parts) > 1 {
		res += "." + parts[1]
	}
	if neg {
		res = "-" + res
	}
	return res
}

func formatWeight(v float64) string {
	return strconv.FormatFloat(v, 'f', 2, 64)
}
