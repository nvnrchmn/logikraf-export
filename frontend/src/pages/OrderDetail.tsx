import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  FileText,
  Download,
  Pencil,
  Check,
  X,
} from 'lucide-react'
import { api, getToken } from '../lib/api'
import type { Document, Order, Product } from '../lib/types'
import { fmtMoney, statusFlow, statusMeta } from '../lib/status'
import { Button, inputCls } from '../components/UI'

const docDefs = [
  { type: 'PI', label: 'Proforma Invoice', min: 'draft' },
  { type: 'CI', label: 'Commercial Invoice', min: 'confirmed' },
  { type: 'PL', label: 'Packing List', min: 'confirmed' },
  { type: 'SI', label: 'Shipping Instruction', min: 'confirmed' },
  { type: 'PEB', label: 'PEB Data Sheet', min: 'packed' },
] as const

const level = { draft: 0, confirmed: 1, packed: 2, shipped: 3, completed: 4, cancelled: 99 }

export default function OrderDetail() {
  const { id } = useParams()
  const oid = Number(id)
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [docs, setDocs] = useState<Document[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // item form
  const [prodId, setProdId] = useState(0)
  const [qty, setQty] = useState('')
  const [price, setPrice] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const [o, d, p] = await Promise.all([
        api<Order>(`/orders/${oid}`),
        api<Document[]>(`/orders/${oid}/documents`),
        api<Product[]>('/products?q='),
      ])
      setOrder(o)
      setDocs(d)
      setProducts(p.filter((x) => x.active))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [oid])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-zinc-500">
        <Loader2 className="animate-spin" size={24} />
      </div>
    )
  }
  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-xl bg-red-600/15 px-4 py-3 text-sm text-red-400">{error || 'Pesanan tidak ditemukan'}</div>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/orders')}>
          <ArrowLeft size={15} /> Kembali
        </Button>
      </div>
    )
  }

  const addItem = async (e: FormEvent) => {
    e.preventDefault()
    if (!prodId) return
    setBusy(true)
    setError('')
    try {
      await api(`/orders/${oid}/items`, {
        method: 'POST',
        body: {
          product_id: prodId,
          quantity: Number(qty) || 1,
          unit_price_usd: price ? Number(price) : 0,
        },
      })
      setProdId(0)
      setQty('')
      setPrice('')
      await load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const changeStatus = async (next: string) => {
    setBusy(true)
    setError('')
    try {
      await api(`/orders/${oid}/status`, { method: 'PATCH', body: { status: next } })
      await load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const removeItem = async (itemId: number) => {
    if (!confirm('Hapus item ini?')) return
    await api(`/orders/${oid}/items/${itemId}`, { method: 'DELETE' })
    await load()
  }

  const generateDoc = async (type: string) => {
    setBusy(true)
    setError('')
    try {
      await api(`/orders/${oid}/documents/${type}`, { method: 'POST' })
      await load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const downloadDoc = async (docId: number) => {
    try {
      const res = await fetch(`/api/documents/${docId}/file`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dokumen-${docId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const canEdit = order.status === 'draft'
  const sm = statusMeta[order.status]

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <button onClick={() => navigate('/orders')} className="mb-4 flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200">
        <ArrowLeft size={15} /> Daftar Pesanan
      </button>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold font-mono">{order.order_no}</h1>
            <span className={`rounded-full px-2 py-0.5 text-[11px] ${sm.cls}`}>{sm.label}</span>
          </div>
          <p className="text-sm text-zinc-500">
            {order.buyer?.company_name} · {order.buyer?.city}, {order.buyer?.country}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {statusFlow[order.status].map((next) => (
            <Button key={next} onClick={() => changeStatus(next)} disabled={busy}>
              <Check size={14} /> {statusMeta[next].label}
            </Button>
          ))}
          {canEdit && (
            <Button variant="danger" onClick={() => confirm('Batalkan pesanan ini?') && changeStatus('cancelled')}>
              <X size={14} /> Batalkan
            </Button>
          )}
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-600/15 px-3 py-2 text-sm text-red-400">{error}</div>}

      {/* Info order */}
      <div className="mb-5 grid gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="text-xs text-zinc-500">Incoterm</div>
          <div className="text-sm font-medium">{order.incoterm?.code}</div>
          <div className="text-[11px] text-zinc-600">{order.incoterm?.description}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">Rute</div>
          <div className="text-sm font-medium">
            {order.port_loading?.code} → {order.port_discharge?.code}
          </div>
          <div className="text-[11px] text-zinc-600">
            {order.port_loading?.name} → {order.port_discharge?.name}
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">Pembayaran</div>
          <div className="text-sm font-medium">{order.payment_terms || '—'}</div>
          <div className="text-[11px] text-zinc-600">{order.currency}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">Total FOB</div>
          <div className="text-lg font-semibold text-indigo-400">{fmtMoney(order.total_fob)}</div>
        </div>
        {order.notes && (
          <div className="sm:col-span-2 lg:col-span-4">
            <div className="text-xs text-zinc-500">Catatan</div>
            <div className="text-sm text-zinc-300">{order.notes}</div>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <h2 className="mb-3 text-sm font-semibold">Item</h2>
        {order.items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-800 py-8 text-center text-sm text-zinc-500">
            Belum ada item. Tambahkan di bawah.
          </div>
        ) : (
          <div className="space-y-2">
            {order.items.map((it) => (
              <div key={it.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-zinc-950/60 px-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{it.product?.name || `Produk #${it.product_id}`}</div>
                  <div className="text-[11px] text-zinc-500">
                    {it.product?.sku} · HS {it.product?.hs_code || '—'}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-zinc-400">{it.quantity} pcs</span>
                  <span className="text-zinc-500">× {fmtMoney(it.unit_price_usd)}</span>
                  <span className="font-medium text-zinc-100">{fmtMoney(it.line_total)}</span>
                  {canEdit && (
                    <button onClick={() => removeItem(it.id)} className="rounded p-1 text-zinc-500 hover:bg-red-600/15 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-1 text-sm">
              <span className="text-zinc-400">Total: </span>
              <span className="ml-2 font-semibold text-indigo-400">{fmtMoney(order.total_fob)}</span>
            </div>
          </div>
        )}

        {canEdit && (
          <form onSubmit={addItem} className="mt-4 grid gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 sm:grid-cols-[1fr_90px_110px_auto]">
            <select className={inputCls} value={prodId} onChange={(e) => setProdId(Number(e.target.value))} required>
              <option value={0}>— pilih produk —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name} (${p.unit_price_usd.toFixed(2)})
                </option>
              ))}
            </select>
            <input type="number" min={1} className={inputCls} placeholder="Qty" value={qty} onChange={(e) => setQty(e.target.value)} />
            <input type="number" step="0.01" min={0} className={inputCls} placeholder="Harga (kosong=default)" value={price} onChange={(e) => setPrice(e.target.value)} />
            <Button type="submit" disabled={busy || !prodId}>
              <Plus size={14} /> Tambah
            </Button>
          </form>
        )}
      </div>

      {/* Dokumen */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <h2 className="mb-1 text-sm font-semibold">Dokumen Export</h2>
        <p className="mb-3 text-xs text-zinc-500">Dibuat otomatis dari data order — bahasa English</p>
        <div className="space-y-2">
          {docs.length === 0 && (
            <div className="rounded-lg border border-dashed border-zinc-800 py-6 text-center text-sm text-zinc-500">
              Belum ada dokumen.
            </div>
          )}
          {docs.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-zinc-950/60 px-3 py-2">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-indigo-400" />
                <span className="font-mono text-sm">{d.doc_no}</span>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">{d.doc_type}</span>
              </div>
              <button onClick={() => downloadDoc(d.id)} className="flex items-center gap-1.5 rounded-lg bg-indigo-600/15 px-3 py-1.5 text-xs text-indigo-400 hover:bg-indigo-600/25">
                <Download size={13} /> Unduh
              </button>
            </div>
          ))}
        </div>

        {order.status !== 'cancelled' && (
          <div className="mt-4 flex flex-wrap gap-2">
            {docDefs
              .filter((d) => level[order.status] >= level[d.min])
              .map((d) => {
                const exists = docs.some((x) => x.doc_type === d.type)
                return (
                  <Button key={d.type} variant={exists ? 'ghost' : 'primary'} className="!px-3 !py-1.5 text-xs" disabled={busy} onClick={() => generateDoc(d.type)}>
                    {exists ? <Pencil size={13} /> : <Plus size={13} />} {exists ? 'Generate ulang' : d.label}
                  </Button>
                );
              })}
          </div>
        )}
        {order.status === 'cancelled' && (
          <div className="mt-4 text-xs text-zinc-500">Order dibatalkan — dokumen tidak bisa dibuat.</div>
        )}
      </div>
    </div>
  )
}
