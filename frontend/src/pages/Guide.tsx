import {
  Handshake,
  FileText,
  Package,
  Truck,
  Ship,
  CreditCard,
  Info,
  AlertTriangle,
  BookOpen,
} from 'lucide-react'

const steps = [
  {
    icon: Handshake,
    title: '1. Penawaran & PO Buyer',
    desc: 'Kirim penawaran (quote) ke buyer. Setelah buyer setuju, terima Purchase Order (PO) — pastikan harga, Incoterm, dan jadwal jelas.',
  },
  {
    icon: FileText,
    title: '2. Proforma Invoice (PI)',
    desc: 'Buat PI dari order di sistem ini. PI dikirim ke buyer sebagai konfirmasi harga & syarat sebelum pembayaran.',
  },
  {
    icon: Package,
    title: '3. Barang Jadi & Packing',
    desc: 'Supplier mengirim barang jadi ke gudang. Cek kualitas, timbang, ukur, dan catat jumlah koli untuk Packing List.',
  },
  {
    icon: FileText,
    title: '4. Dokumen Export (CI, PL, SI)',
    desc: 'Setelah order dikonfirmasi, generate Commercial Invoice, Packing List, dan Shipping Instruction dari sistem — semua dari satu data.',
  },
  {
    icon: Ship,
    title: '5. PEB & Pengiriman',
    desc: 'Siapkan PEB Data Sheet dari sistem, verifikasi HS Code dengan PPJK/DJBC, lalu submit PEB (lewat PPJK atau CEISA). Setelah itu: stuffing, gate-in, dan kapal berangkat (ETD).',
  },
  {
    icon: Truck,
    title: '6. Bill of Lading (B/L)',
    desc: 'Terima B/L dari shipping line via forwarder setelah barang dimuat. B/L adalah bukti kepemilikan barang — simpan baik-baik.',
  },
  {
    icon: CreditCard,
    title: '7. Pembayaran & DHE',
    desc: 'Buyer membayar sesuai syarat di PI (T/T, L/C, dsb). Terima dana devisa ekspor, laporkan via bank. Barang sampai (POD) → tutup pesanan.',
  },
]

const docs = [
  { code: 'PI', name: 'Proforma Invoice', ket: 'Konfirmasi harga & syarat sebelum pembayaran' },
  { code: 'CI', name: 'Commercial Invoice', ket: 'Invoice resmi untuk customs & pembayaran' },
  { code: 'PL', name: 'Packing List', ket: 'Rincian isi kemasan: jumlah, berat, volume' },
  { code: 'PEB', name: 'Pemberitahuan Ekspor Barang', ket: 'Dokumen wajib ke bea cukai — submit via PPJK/CEISA' },
  { code: 'NPE', name: 'NPPB / Nota Pelayanan Ekspor', ket: 'Bukti PEB diproses — nomor tracking ekspor' },
  { code: 'B/L', name: 'Bill of Lading', ket: 'Bukti muat & kepemilikan barang dari shipping line' },
  { code: 'SI', name: 'Shipping Instruction', ket: 'Instruksi pengiriman ke forwarder/shpping line' },
  { code: 'COO', name: 'Certificate of Origin', ket: 'Opsional — untuk bea masuk lebih rendah di negara tujuan' },
]

const terms = [
  { t: 'HS Code', d: 'Kode klasifikasi barang (BTKI) — menentukan tarif & aturan. Verifikasi sebelum ekspor pertama.' },
  { t: 'Incoterms', d: 'Aturan siapa tanggung jawab apa. FOB: seller serah barang di kapal pelabuhan muat. CIF: seller bayar asuransi + freight.' },
  { t: 'FOB Value', d: 'Nilai barang di atas kapal pelabuhan muat — basis nilai PEB dan DHE.' },
  { t: 'ETD / ETA / POD', d: 'Estimated Time of Departure / Arrival / Port of Discharge.' },
  { t: 'PEB', d: 'Pemberitahuan Ekspor Barang — dokumen wajib ke DJBC untuk setiap ekspor.' },
  { t: 'PPJK', d: 'Pengusaha Pengurusan Jasa Kepabeanan (forwarder resmi) — bisa mengurus PEB atas nama kita.' },
  { t: 'DHE', d: 'Devisa Hasil Ekspor — dana dari ekspor wajib masuk sistem keuangan Indonesia sesuai aturan.' },
  { t: 'Lartas', d: 'Larangan & Pembatasan — sebagian barang butuh izin khusus. Mousepad umumnya tidak termasuk.' },
]

export default function Guide() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/15 text-indigo-400">
          <BookOpen size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Panduan Ekspor</h1>
          <p className="text-sm text-zinc-500">Alur lengkap ekspor pertama kali — dari penawaran sampai pembayaran</p>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
        <div className="flex gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <p>
            <b>Penting:</b> sebelum ekspor pertama, pastikan perusahaan punya <b>NIB aktif</b> (dari OSS, gratis) dan
            verifikasi <b>HS Code</b> produk ke PPJK/DJBC. Aturan bisa berubah — selalu cek versi terbaru.
          </p>
        </div>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-zinc-400">Alur langkah demi langkah</h2>
      <div className="mb-8 space-y-3">
        {steps.map((s) => (
          <div key={s.title} className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600/15 text-indigo-400">
              <s.icon size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold">{s.title}</div>
              <div className="mt-1 text-sm text-zinc-400">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-zinc-400">Dokumen yang wajib & penting</h2>
      <div className="mb-8 grid gap-2 sm:grid-cols-2">
        {docs.map((d) => (
          <div key={d.code} className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <FileText size={15} className="mt-0.5 shrink-0 text-indigo-400" />
            <div>
              <div className="text-sm font-semibold font-mono">{d.code}</div>
              <div className="text-xs text-zinc-300">{d.name}</div>
              <div className="text-[11px] text-zinc-500">{d.ket}</div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-zinc-400">Istilah yang perlu dipahami</h2>
      <div className="mb-8 grid gap-2 sm:grid-cols-2">
        {terms.map((t) => (
          <div key={t.t} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <div className="text-sm font-semibold text-indigo-300">{t.t}</div>
            <div className="mt-0.5 text-xs text-zinc-400">{t.d}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-xs text-zinc-500">
        <div className="flex gap-2">
          <Info size={14} className="mt-0.5 shrink-0" />
          <p>
            Panduan ini disusun dari standar umum ekspor Indonesia (DJBC, Kementerian Perdagangan, Bank Indonesia) dan
            disesuaikan untuk kebutuhan logikraf. Untuk kasus spesifik (nilai besar, negara tertentu, barang khusus),
            konsultasikan dengan PPJK atau konsultan ekspor.
          </p>
        </div>
      </div>
    </div>
  )
}
