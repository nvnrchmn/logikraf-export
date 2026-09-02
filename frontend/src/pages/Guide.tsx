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
  BadgeCheck,
  ArrowRight,
} from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'

// ===== Mode pengiriman =====
const modes = [
  {
    id: 'courier',
    icon: Truck,
    title: 'Mode Kurir / Parcel',
    badge: 'bg-indigo-600/15 text-indigo-300',
    main: true,
    desc: 'Kiriman ringan sampai ±30 kg per kiriman lewat DHL/FedEx/UPS/JNE Intl. Ini jalur utama Logikraf.',
    dokumen: 'PI, CI, PL',
    incoterm: 'DAP / DDP',
    aturan: 'Tanpa PEB — kurir yang urus bea cukai',
    note: 'PEB? Bukan urusan Logikraf di jalur ini: parcel kecil (nilai di bawah ambang) bebas PEB, parcel lain sampai 30 kg ditampung PEB Konsol oleh ekspedisi. Kamu tidak perlu login CEISA sama sekali.',
    flow: [
      'Buyer pesan via WhatsApp/email/marketplace (qty kecil)',
      'Buat order di sistem: mode Kurir, incoterm DAP/DDP',
      'Kirim Proforma Invoice (PI) ke buyer',
      'Terima pembayaran: T/T 100% / PayPal / Wise',
      'Packing 1 karton — generate Commercial Invoice (CI) + Packing List (PL)',
      'Booking kurir online (DHL/FedEx/JNE): isi data dari CI, HS code, nilai & berat',
      'Jadwalkan pickup — input kurir + no. AWB + tanggal pickup di sistem → status otomatis "Dikirim"',
      'Buyer terima → input tanggal delivered → status otomatis "Selesai"',
    ],
  },
  {
    id: 'lcl',
    icon: Boxes,
    title: 'Mode LCL / Cargo Udara',
    badge: 'bg-emerald-600/15 text-emerald-300',
    main: false,
    desc: 'Kiriman > 30 kg (ratusan–ribuan pcs) — kontainer sebagian bareng eksportir lain, atau cargo udara.',
    dokumen: 'PI, CI, PL, SI, PEB Data Sheet',
    incoterm: 'FOB / CIF',
    aturan: 'PEB Single wajib — CEISA mandiri atau PPJK',
    note: '',
    flow: [
      'Buyer kirim PO resmi (qty ratusan–ribuan pcs, berat > 30 kg)',
      'Buat order: mode LCL, isi pelabuhan muat/bongkar, incoterm FOB/CIF',
      'PI → konfirmasi → produksi/persiapan barang jadi',
      'Packing & hitung CBM/berat (pakai kalkulator di sistem)',
      'Generate CI + PL + SI (Shipping Instruction)',
      'Generate PEB Data Sheet sebagai bahan isian PEB',
      'Pilih jalur PEB: submit sendiri di CEISA 4.0, atau serahkan PEB Data Sheet ke PPJK untuk disubmit sebagai kuasa',
      'Hubungi PPJK/forwarder untuk booking LCL (atau cargo udara)',
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
    main: false,
    desc: 'Kiriman besar — kontainer penuh (20/40ft) untuk distributor. Paling jarang, butuh forwarder sejak awal.',
    dokumen: 'PI, CI, PL, SI, PEB Data Sheet',
    incoterm: 'FOB / CIF / CFR',
    aturan: 'PEB via PPJK',
    note: '',
    flow: [
      'PO besar dari distributor (qty ribuan)',
      'Buat order: mode FCL, pelabuhan, incoterm',
      'PI → konfirmasi → produksi',
      'Packing mengikuti kontainer (kalkulator CBM untuk cek muat)',
      'Generate CI + PL + SI',
      'Serahkan PEB Data Sheet ke PPJK — PPJK booking kontainer + submit PEB',
      'Stuffing di gudang → gate-in → loading → berangkat',
      'Input vessel/voyage/PEB/NPE → "Dikirim"',
      'POD → "Selesai"',
    ],
  },
]

// ===== Dokumen =====
const docs = [
  { code: 'PI', name: 'Proforma Invoice', need: 'Semua mode', desc: 'Penawaran resmi sebelum bayar — dipakai sebagai dasar pembayaran buyer.' },
  { code: 'CI', name: 'Commercial Invoice', need: 'Semua mode', desc: 'Faktur final untuk bea cukai — wajib di setiap pengiriman, termasuk kurir. Datanya dipakai kurir saat booking.' },
  { code: 'PL', name: 'Packing List', need: 'Semua mode', desc: 'Rincian isi: qty, berat neto/kotor, CBM — dipakai kurir & PPJK.' },
  { code: 'SI', name: 'Shipping Instruction', need: 'LCL / FCL', desc: 'Instruksi ke forwarder untuk booking & muat kontainer. Tidak berlaku di mode kurir.' },
  { code: 'PEB', name: 'PEB Data Sheet', need: 'Wajib: kiriman > 30 kg (udara/laut). Kurir: tidak dipakai', desc: 'Rangkuman data untuk PEB Single — bahan isian saat submit mandiri di CEISA 4.0 atau diserahkan ke PPJK. Bukan file submit resmi.' },
]

// ===== Aturan PEB =====
const pebRule = [
  'Kiriman ≤ 30 kg via kurir → PEB Single TIDAK diperlukan Logikraf: parcel kecil (nilai di bawah ambang) bebas PEB — PMK 60/2016; parcel lain sampai 30 kg ditampung PEB Konsol oleh ekspedisi. Tidak perlu buka CEISA.',
  'Kiriman > 30 kg → PEB Single WAJIB atas nama Logikraf. Dua jalur: (a) submit sendiri di CEISA 4.0 — registrasi perusahaan sudah dibuat, atau (b) serahkan ke PPJK — mereka submit sebagai kuasa.',
  'Jangan pecah kiriman besar jadi parcel-parcel kecil demi menghindari PEB — DJBC bisa menggabungkan kiriman terpecah ke penerima yang sama.',
  'Ambang & mekanisme PEB Konsol dapat berubah — konfirmasi angka pasti ke kurir/PPJK. Badge otomatis di order memakai aturan konservatif (nilai & berat); kalau ragu, tanya kurir dulu.',
]

// ===== Istilah =====
const terms = [
  { t: 'FOB', d: 'Free On Board — barang diserahkan di atas kapal; buyer tanggung freight & asuransi' },
  { t: 'CIF', d: 'Cost, Insurance, Freight — harga termasuk ongkir & asuransi sampai pelabuhan tujuan' },
  { t: 'DAP / DDP', d: 'Delivered At Place / Delivered Duty Paid — kurir antar sampai tujuan; DDP termasuk bea masuk' },
  { t: 'AWB', d: 'Air Waybill — nomor resi pengiriman kurir (DHL/FedEx/UPS)' },
  { t: 'PEB', d: 'Pemberitahuan Ekspor Barang — deklarasi ekspor atas nama eksportir; wajib untuk kiriman > 30 kg, disubmit lewat CEISA 4.0 (mandiri) atau PPJK' },
  { t: 'PEB Konsol', d: 'PEB gabungan yang diajukan ekspedisi/kurir untuk banyak parcel kecil (< 30 kg) — Logikraf tidak mengurus apa-apa' },
  { t: 'NPE', d: 'Nota Pemberitahuan Ekspor — bukti PEB diterima bea cukai' },
  { t: 'ETD', d: 'Estimated Time of Departure — perkiraan kapal berangkat' },
  { t: 'POD', d: 'Proof of Delivery — bukti barang diterima pembeli' },
  { t: 'HS Code', d: 'Kode klasifikasi barang internasional (6–10 digit) untuk bea cukai' },
  { t: 'PPJK', d: 'Pengusaha Pengurusan Jasa Kepabeanan — kuasa eksportir yang submit PEB & urus bea cukai (umumnya juga forwarder)' },
  { t: 'CEISA 4.0', d: 'Portal kepabeanan DJBC — tempat submit PEB/PIB. Akun perusahaan Logikraf sudah didaftarkan (email @logikraf.id)' },
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
          <p className="text-sm text-zinc-500">Jalur utama = Kurir. PEB/CEISA hanya muncul saat kiriman &gt; 30 kg</p>
        </div>
      </div>

      {/* Aturan praktis: berat menentukan jalur */}
      <div className="stagger mb-8 space-y-3">
        <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/10 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Truck size={16} className="text-indigo-400" />
            <span className="text-sm font-semibold text-indigo-300">Kiriman ≤ 30 kg → jalur KURIR</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
              <BadgeCheck size={11} /> JALUR UTAMA LOGIKRAF
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-indigo-200/90">
            Kamu cuma isi order + generate CI/PL + booking — sisanya dipegang kurir.{' '}
            <b>Tanpa PEB & tanpa CEISA:</b> parcel kecil bebas PEB (PMK 60/2016), parcel lain sampai
            30 kg ditampung <b>PEB Konsol</b> ekspedisi. Konfirmasi angka pasti ke kurirmu sekali,
            habis itu jalur ini jalan terus.
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Scale size={16} className="text-amber-400" />
            <span className="text-sm font-semibold text-amber-300">Kiriman &gt; 30 kg → wajib PEB Single atas nama Logikraf</span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-amber-200/90">
            Pilih salah satu: <b>(a) mandiri</b> — submit PEB di CEISA 4.0 pakai data PEB Data Sheet
            (registrasi perusahaan sudah dibuat), atau <b>(b) PPJK</b> — serahkan PEB Data Sheet,
            mereka yang submit sebagai kuasa. Barang tetap bisa lewat kurir cargo/udara atau LCL.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-zinc-400">
          <Ship size={15} className="shrink-0 text-zinc-500" />
          Muatan kontainer penuh → <b className="text-zinc-300">FCL</b> — libatkan forwarder/PPJK sejak awal (lihat mode FCL di bawah).
          <ArrowRight size={13} className="ml-auto shrink-0 text-zinc-600" />
        </div>
      </div>

      {/* Ringkasan mode */}
      <h2 className="mb-3 text-sm font-semibold text-zinc-400">Mode pengiriman &amp; dokumennya</h2>
      <div className="stagger mb-8 grid gap-3 md:grid-cols-3">
        {modes.map((m) => (
          <div
            key={m.id}
            className={`card-lift rounded-xl border bg-zinc-900/60 p-4 ${
              m.main ? 'border-indigo-500/40 ring-1 ring-indigo-500/30' : 'border-zinc-800'
            }`}
          >
            <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${m.badge}`}>
              <m.icon size={16} />
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
              {m.title}
              {m.main && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                  <BadgeCheck size={11} /> Jalur utama
                </span>
              )}
            </div>
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
            {m.note && (
              <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs leading-relaxed text-emerald-200/80">
                <CheckCircle2 size={13} className="mb-1" /> {m.note}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Aturan PEB */}
      <div className="stagger mb-8 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-300">
          <Scale size={15} /> Kapan PEB wajib &amp; siapa yang mengurus? (PMK 60/2016)
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
      <h2 className="mb-3 text-sm font-semibold text-zinc-400">Dokumen yang wajib &amp; penting</h2>
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
      <h2 className="mb-3 text-sm font-semibold text-zinc-400">Aturan &amp; dokumen pemerintah (kepabeanan)</h2>
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
            Nilai FOB &amp; mata uang: (dari total order)<br />
            Qty &amp; berat bersih: (dari packing list)<br />
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
            <Info size={15} /> Lartas — larangan &amp; pembatasan
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
            Mousepad umumnya <b>bukan barang lartas</b> untuk ekspor — tidak butuh izin khusus. Yang wajib
            dijaga: <b>HS Code benar</b> (sistem memakai kode 8 digit; BTKI diperbarui tiap tahun, cek saat
            awal tahun). Kalau ragu dengan HS atau negara tujuan tertentu, verifikasi ke PPJK atau cek
            INATRADE (eservice.insw.go.id) sebelum kiriman besar pertama.
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
          <li>Kurir = jalur utama: kiriman ≤ 30 kg dikirim tanpa PEB &amp; tanpa CEISA — paling cepat &amp; tanpa birokrasi</li>
          <li>Registrasi CEISA 4.0 perusahaan (email @logikraf.id) sudah dibuat — baru kepakai saat kiriman &gt; 30 kg</li>
          <li>Kiriman &gt; 30 kg: submit PEB mandiri pakai PEB Data Sheet, atau serahkan ke PPJK — jangan menunda booking</li>
          <li>Verifikasi HS Code produk ke PPJK/DJBC sebelum kiriman besar pertama</li>
          <li>Pastikan nilai &amp; berat di CI sesuai isi karton — bea cukai negara tujuan cek ini</li>
          <li>Jangan pecah kiriman besar jadi parcel kecil demi menghindari PEB — itu pelanggaran</li>
        </ul>
      </div>
    </div>
  )
}
