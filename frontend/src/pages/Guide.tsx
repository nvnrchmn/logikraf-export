import {
  FileText,
  Truck,
  Ship,
  Info,
  AlertTriangle,
  BookOpen,
  Boxes,
  Scale,
  CheckCircle2,
} from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'

// ===== Mode pengiriman =====
const modes = [
  {
    id: 'courier',
    icon: Truck,
    title: 'Mode Kurir / Parcel',
    badge: 'bg-indigo-600/15 text-indigo-300',
    desc: 'Kiriman kecil (5–50 pcs) lewat DHL/FedEx/UPS/JNE Intl. Nilai < $100 & berat < 30 kg.',
    dokumen: 'PI, CI, PL',
    incoterm: 'DAP / DDP',
    aturan: 'Tanpa PEB — kurir handle bea cukai',
    flow: [
      'Buyer pesan via WhatsApp/email/marketplace (qty kecil)',
      'Buat order di sistem: mode Kurir, incoterm DAP/DDP',
      'Kirim Proforma Invoice (PI) ke buyer',
      'Terima pembayaran: T/T 100% / PayPal / Wise',
      'Packing 1 karton — generate Commercial Invoice (CI) + Packing List (PL)',
      'Jadwalkan pickup kurir (DHL/FedEx/JNE)',
      'Input kurir + no. AWB + tanggal pickup di sistem → status otomatis "Dikirim"',
      'Buyer terima → input tanggal delivered → status otomatis "Selesai"',
    ],
  },
  {
    id: 'lcl',
    icon: Boxes,
    title: 'Mode LCL',
    badge: 'bg-emerald-600/15 text-emerald-300',
    desc: 'Kiriman menengah (ratusan–ribuan pcs) — kontainer sebagian, bareng eksportir lain.',
    dokumen: 'PI, CI, PL, SI, PEB',
    incoterm: 'FOB / CIF',
    aturan: 'PEB wajib via PPJK',
    flow: [
      'Buyer kirim PO resmi (qty 500–2.000 pcs)',
      'Buat order: mode LCL, isi pelabuhan muat/bongkar, incoterm FOB/CIF',
      'PI → konfirmasi → produksi/persiapan barang jadi',
      'Packing & hitung CBM/berat (pakai kalkulator di sistem)',
      'Generate CI + PL + SI (Shipping Instruction)',
      'Hubungi PPJK/forwarder untuk booking LCL',
      'Generate PEB Data Sheet → serahkan ke PPJK untuk submit PEB',
      'Stuffing → gate-in → vessel berangkat (ETD) → onboard',
      'Input data vessel/PEB/NPE di sistem → status "Dikirim"',
      'Barang sampai → POD → status "Selesai"',
    ],
  },
  {
    id: 'fcl',
    icon: Ship,
    title: 'Mode FCL',
    badge: 'bg-amber-600/15 text-amber-300',
    desc: 'Kiriman besar — kontainer penuh (20/40ft) untuk distributor.',
    dokumen: 'PI, CI, PL, SI, PEB',
    incoterm: 'FOB / CIF / CFR',
    aturan: 'PEB wajib via PPJK',
    flow: [
      'PO besar dari distributor (qty ribuan)',
      'Buat order: mode FCL, pelabuhan, incoterm',
      'PI → konfirmasi → produksi',
      'Packing mengikuti kontainer (kalkulator CBM untuk cek muat)',
      'Generate CI + PL + SI',
      'PPJK booking kontainer + submit PEB',
      'Stuffing di gudang → gate-in → loading → berangkat',
      'Input vessel/voyage/PEB/NPE → "Dikirim"',
      'POD → "Selesai"',
    ],
  },
]

// ===== Dokumen =====
const docs = [
  { code: 'PI', name: 'Proforma Invoice', need: 'Semua mode', desc: 'Penawaran resmi sebelum bayar — dipakai sebagai dasar pembayaran buyer.' },
  { code: 'CI', name: 'Commercial Invoice', need: 'Semua mode', desc: 'Faktur final untuk bea cukai — wajib di setiap pengiriman, termasuk kurir.' },
  { code: 'PL', name: 'Packing List', need: 'Semua mode', desc: 'Rincian isi: qty, berat neto/kotor, CBM — dipakai kurir & PPJK.' },
  { code: 'SI', name: 'Shipping Instruction', need: 'LCL / FCL', desc: 'Instruksi ke forwarder untuk booking & muat kontainer. Tidak berlaku di mode kurir.' },
  { code: 'PEB', name: 'PEB Data Sheet', need: 'LCL / FCL (wajib), Kurir (opsional)', desc: 'Rangkuman data untuk Pemberitahuan Ekspor Barang — diserahkan ke PPJK untuk submit.' },
]

// ===== Aturan PEB =====
const pebRule = [
  'Nilai FOB ≥ USD 100 ATAU berat ≥ 30 kg → PEB WAJIB (lewat PPJK atau CEISA mandiri)',
  'Nilai FOB < USD 100 DAN berat < 30 kg → PEB TIDAK wajib (kiriman kurir/parcel)',
  'Sistem menghitung ini otomatis per order — lihat badge hijau "PEB tidak wajib" di halaman order',
  'HS Code produk wajib benar & terverifikasi PPJK/DJBC sebelum kiriman laut pertama',
]

// ===== Istilah =====
const terms = [
  { t: 'FOB', d: 'Free On Board — barang diserahkan di atas kapal; buyer tanggung freight & asuransi' },
  { t: 'CIF', d: 'Cost, Insurance, Freight — harga termasuk ongkir & asuransi sampai pelabuhan tujuan' },
  { t: 'DAP / DDP', d: 'Delivered At Place / Delivered Duty Paid — kurir antar sampai tujuan; DDP termasuk bea masuk' },
  { t: 'AWB', d: 'Air Waybill — nomor resi pengiriman kurir (DHL/FedEx/UPS)' },
  { t: 'PEB', d: 'Pemberitahuan Ekspor Barang — dokumen bea cukai untuk ekspor laut' },
  { t: 'NPE', d: 'Nota Pemberitahuan Ekspor — bukti PEB diterima bea cukai' },
  { t: 'ETD', d: 'Estimated Time of Departure — perkiraan kapal berangkat' },
  { t: 'POD', d: 'Proof of Delivery — bukti barang diterima pembeli' },
  { t: 'HS Code', d: 'Kode klasifikasi barang internasional (6–10 digit) untuk bea cukai' },
  { t: 'PPJK', d: 'Pengusaha Pengurusan Jasa Kepabeanan — forwarder yang urus PEB & bea cukai' },
  { t: 'LCL / FCL', d: 'Less/Full Container Load — kontainer sebagian / kontainer penuh' },
  { t: 'CBM', d: 'Cubic Meter — satuan volume muatan (panjang × lebar × tinggi)' },
]

export default function Guide() {
  return (
    <div className="anim-fade-up mx-auto max-w-4xl px-4 py-6">
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Panduan Ekspor' }]} />
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/15 text-indigo-400">
          <BookOpen size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Panduan Ekspor</h1>
          <p className="text-sm text-zinc-500">Alur lengkap dari order sampai barang sampai — untuk ekspor pertama kali</p>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-indigo-500/25 bg-indigo-600/10 p-4 text-sm text-indigo-200">
        <div className="mb-1 flex items-center gap-2 font-semibold">
          <Info size={15} /> Pilih mode di awal
        </div>
        Saat membuat order, tentukan dulu mode pengirimannya. Semua dokumen, form shipment, dan aturan PEB menyesuaikan otomatis. Mulai dari mode <b>Kurir</b> untuk pesanan kecil — paling sederhana dan tanpa PEB.
      </div>

      {/* Ringkasan mode */}
      <h2 className="mb-3 text-sm font-semibold text-zinc-400">Tiga mode pengiriman</h2>
      <div className="stagger mb-8 grid gap-3 md:grid-cols-3">
        {modes.map((m) => (
          <div key={m.id} className="card-lift rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${m.badge}`}>
              <m.icon size={16} />
            </div>
            <div className="text-sm font-semibold">{m.title}</div>
            <p className="mt-1 text-xs text-zinc-400">{m.desc}</p>
            <div className="mt-3 space-y-1 text-[11px] text-zinc-500">
              <div>📄 {m.dokumen}</div>
              <div>🏷️ {m.incoterm}</div>
              <div>⚖️ {m.aturan}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Flow detail per mode */}
      <h2 className="mb-3 text-sm font-semibold text-zinc-400">Alur langkah demi langkah</h2>
      <div className="stagger mb-8 space-y-5">
        {modes.map((m) => (
          <div key={m.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="mb-3 flex items-center gap-2">
              <m.icon size={16} className={m.id === 'courier' ? 'text-indigo-400' : m.id === 'lcl' ? 'text-emerald-400' : 'text-amber-400'} />
              <span className="text-sm font-semibold">{m.title}</span>
            </div>
            <ol className="space-y-2">
              {m.flow.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-zinc-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      {/* Aturan PEB */}
      <div className="stagger mb-8 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-300">
          <Scale size={15} /> Kapan PEB wajib? (aturan: PMK 60/2016)
        </h2>
        <ul className="space-y-1.5 text-sm text-emerald-200/90">
          {pebRule.map((r, i) => (
            <li key={i} className="flex gap-2">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> {r}
            </li>
          ))}
        </ul>
      </div>

      {/* Dokumen */}
      <h2 className="mb-3 text-sm font-semibold text-zinc-400">Dokumen yang wajib & penting</h2>
      <div className="stagger mb-8 grid gap-2 sm:grid-cols-2">
        {docs.map((d) => (
          <div key={d.code} className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <FileText size={15} className="mt-0.5 shrink-0 text-indigo-400" />
            <div>
              <div className="text-sm font-semibold">{d.name} <span className="font-mono text-[10px] text-zinc-500">({d.code})</span></div>
              <div className="text-[11px] text-zinc-500">{d.need}</div>
              <p className="mt-1 text-xs text-zinc-400">{d.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Aturan & dokumen pemerintah */}
      <h2 className="mb-3 text-sm font-semibold text-zinc-400">Aturan & dokumen pemerintah (kepabeanan)</h2>
      <div className="stagger mb-8 grid gap-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
            <FileText size={15} /> COO — Certificate of Origin (bila buyer minta)
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
            COO = surat keterangan asal barang, biasanya diminta buyer agar dikenai bea masuk lebih rendah
            (perjanjian FTA, mis. ACFTA/AJCEP). <b>Tidak dibuat otomatis di sistem</b> — diterbitkan oleh
            instansi/PPJK sesuai negara tujuan. Yang perlu disiapkan:
          </p>
          <div className="mt-2 rounded-lg border border-dashed border-zinc-700 bg-zinc-800/40 p-3 font-mono text-[11px] leading-relaxed text-zinc-300">
            HS Code: (isi HS item, contoh 4016.99)<br />
            Deskripsi barang: Mouse pad dari karet (rubber)<br />
            Negara tujuan: (contoh SG / MY / JP ...)<br />
            Nilai FOB & mata uang: (dari total order)<br />
            Qty & berat bersih: (dari packing list)<br />
            Eksportir: PT Logika Kreatif Indonesia (NIB, NPWP, alamat)<br />
            Keterangan asal: &quot;Produk diproduksi seluruhnya di Indonesia&quot;
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
            <CheckCircle2 size={15} /> DHE — Devisa Hasil Ekspor: tidak wajib untuk mousepad
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
            Aturan DHE (PP 36/2023) mewajibkan penempatan 30% hasil ekspor di rekening devisa — tetapi
            <b> hanya untuk eksportir komoditas sumber daya alam</b> (pertambangan, perkebunan, kehutanan,
            perikanan). Barang <b>manufaktur</b> seperti mousepad <b>dikecualikan</b>. Jadi saat ini tidak ada
            kewajiban DHE untuk Logikraf. Kalau suatu saat ekspor komoditas SDA, konsultasikan ke bank devisa
            (BRI/Mandiri/BNI) untuk pembukaan rekening &amp; pelaporan.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-sky-300">
            <Info size={15} /> Lartas — larangan & pembatasan
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
            Mousepad umumnya <b>bukan barang lartas</b> untuk ekspor — tidak butuh izin khusus. Yang wajib
            dijaga: <b>HS Code benar</b> (sistem memakai kode 8 digit; BTKI diperbarui tiap tahun, cek saat
            awal tahun). Kalau ragu dengan HS atau negara tujuan tertentu, verifikasi ke PPJK atau cek
            INATRADE (eservice.insw.go.id) sebelum kiriman laut pertama.
          </p>
        </div>
      </div>

      {/* Istilah */}
      <h2 className="mb-3 text-sm font-semibold text-zinc-400">Istilah yang perlu dipahami</h2>
      <div className="stagger mb-8 grid gap-2 sm:grid-cols-2">
        {terms.map((t) => (
          <div key={t.t} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <div className="text-sm font-semibold text-indigo-300">{t.t}</div>
            <p className="mt-0.5 text-xs text-zinc-400">{t.d}</p>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-200">
        <h2 className="mb-2 flex items-center gap-2 font-semibold">
          <AlertTriangle size={15} /> Tips ekspor pertama kali
        </h2>
        <ul className="list-disc space-y-1.5 pl-5 text-amber-200/90">
          <li>Mulai dari mode Kurir untuk pesanan kecil — proses tercepat, tanpa PEB, tanpa PPJK</li>
          <li>Verifikasi HS Code produk ke PPJK/DJBC sebelum kiriman laut pertama</li>
          <li>Untuk FCL/LCL, siapkan data PEB dari sistem (PEB Data Sheet) dan serahkan ke PPJK — mereka yang submit</li>
          <li>Pastikan nilai & berat di CI sesuai isi karton — bea cukai negara tujuan cek ini</li>
          <li>Pakai incoterm DAP/DDP untuk kurir, FOB/CIF untuk kontainer</li>
        </ul>
      </div>
    </div>
  )
}
