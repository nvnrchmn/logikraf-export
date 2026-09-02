import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Check, ClipboardCopy, PackageOpen } from 'lucide-react'
import { api } from '../lib/api'
import type { CompanySetting, Order } from '../lib/types'
import { fmtMoney } from '../lib/status'

interface Props {
  order: Order
}

/** Data pack siap salin-tempel untuk form booking kurir (DHL/FedEx/UPS/JNE dst). */
export default function CourierPack({ order }: Props) {
  const [company, setCompany] = useState<CompanySetting | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api<CompanySetting>('/company')
      .then(setCompany)
      .catch(() => setCompany(null))
  }, [])

  const build = useCallback(() => {
    const L: string[] = []
    L.push(`DATA KIRIM KURIR — ${order.order_no}`)
    L.push('')
    L.push('PENGIRIM')
    if (company) {
      L.push(company.company_name)
      L.push(company.address)
      L.push(`${company.city}, ${company.country}`)
      const idLine = [company.nib && `NIB ${company.nib}`, company.npwp && `NPWP ${company.npwp}`]
        .filter(Boolean)
        .join(' | ')
      if (idLine) L.push(idLine)
      const ctLine = [company.phone && `Tel ${company.phone}`, company.email && company.email].filter(Boolean).join(' | ')
      if (ctLine) L.push(ctLine)
    } else {
      L.push('(Data pengirim belum terisi — lengkapi dulu di menu Settings)')
    }
    L.push('')
    L.push('PENERIMA')
    if (order.buyer) {
      L.push(order.buyer.company_name)
      if (order.buyer.contact_name) L.push(`Attn: ${order.buyer.contact_name}`)
      L.push(order.buyer.address)
      L.push(`${order.buyer.city}, ${order.buyer.country}`)
      if (order.buyer.tax_id) L.push(`Tax ID / EORI: ${order.buyer.tax_id}`)
      const bc = [order.buyer.contact_phone && `Tel ${order.buyer.contact_phone}`, order.buyer.contact_email && order.buyer.contact_email].filter(Boolean).join(' | ')
      if (bc) L.push(bc)
    }
    L.push('')
    L.push('ISI KIRIMAN')
    order.items.forEach((it, i) => {
      const p = it.product
      const hs = p?.hs_code ? ` — HS ${p.hs_code}` : ''
      const unit = fmtMoney(it.unit_price_usd || (it.line_total && it.quantity ? it.line_total / it.quantity : 0))
      L.push(
        `${i + 1}. ${p?.name ?? `Produk #${it.product_id}`}${p?.sku ? ` (${p.sku})` : ''}${hs} — ${it.quantity} pcs × ${unit} = ${fmtMoney(it.line_total)}`
      )
    })
    L.push('')
    L.push('RINGKASAN')
    L.push(`Total nilai (FOB): ${fmtMoney(order.total_fob)} ${order.currency || 'USD'}`)
    L.push(`Berat kotor: ${(order.total_gross_kg ?? 0).toFixed(2)} kg`)
    L.push(`Volume: ${(order.total_cbm ?? 0).toFixed(3)} m3`)
    L.push(`Referensi order: ${order.order_no}`)
    L.push(`Incoterm: ${order.incoterm?.code ?? '-'}`)
    if (order.payment_terms) L.push(`Pembayaran: ${order.payment_terms}`)
    L.push('Kategori: barang dagangan (merchandise), bukan gift/sample')
    return L.join('\n')
  }, [order, company])

  const text = build()

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard tidak tersedia (http/non-secure) — fallback seleksi manual tetap bisa via pre
      setCopied(false)
    }
  }

  return (
    <div className="mb-5 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <PackageOpen size={15} className="text-indigo-400" /> Data Kirim Kurir
        </h2>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 active:scale-95"
        >
          {copied ? <Check size={13} /> : <ClipboardCopy size={13} />}
          {copied ? 'Tersalin' : 'Salin semua'}
        </button>
      </div>
      <p className="mb-3 text-[11px] leading-relaxed text-zinc-400">
        Tempel ke form booking DHL/FedEx/UPS/JNE. Isi manual saat booking: dimensi &amp; berat tiap karton
        (data di sistem per pcs), lalu pilih layanan. Berat kotor di bawah ini estimasi dari master produk.
      </p>
      {!company && (
        <div className="mb-3 flex items-start gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-300">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          Data pengirim belum bisa dimuat dari Settings — lengkapi profil perusahaan agar pack ini lengkap.
        </div>
      )}
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-950/70 p-3 font-mono text-[11px] leading-relaxed text-zinc-300">
        {text}
      </pre>
    </div>
  )
}
