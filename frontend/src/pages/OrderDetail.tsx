import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  FileText,
  Download,
  Eye,
  Pencil,
  Check,
  X,
  Truck,
  Save,
  Wallet,
} from 'lucide-react'
import { api, getToken } from '../lib/api'
import type { Document, Order, Product, Shipment } from '../lib/types'
import { fmtMoney, statusFlow, statusMeta } from '../lib/status'
import { Button, inputCls } from '../components/UI'
import Breadcrumbs from '../components/Breadcrumbs'

const docDefs = [
  { type: 'PI', label: 'Proforma Invoice', min: 'draft' },
  { type: 'CI', label: 'Commercial Invoice', min: 'confirmed' },
  { type: 'PL', label: 'Packing List', min: 'confirmed' },
  { type: 'SI', label: 'Shipping Instruction', min: 'confirmed' },
  { type: 'PEB', label: 'PEB Data Sheet', min: 'packed' },
] as const

const level = { draft: 0, confirmed: 1, packed: 2, shipped: 3, completed: 4, cancelled: 99 }

const minLabel = { draft: 'sejak order dibuat', confirmed: 'sejak order dikonfirmasi', packed: 'sejak order di-packing' } as const

export default function OrderDetail() {
  const { id } = useParams()
  const oid = Number(id)
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [docs, setDocs] = useState<Document[]>([])
  const [delDoc, setDelDoc] = useState<Document | null>(null)
  const [payNote, setPayNote] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // item form
  const [prodId, setProdId] = useState(0)
  const [qty, setQty] = useState('')
  const [price, setPrice] = useState('')
  const [busy, setBusy] = useState(false)

  // shipment form
  const emptySh: Shipment = {
    id: 0, order_id: 0, peb_no: '', npe_no: '', vessel_name: '', voyage_no: '',
    stuffing_date: null, gate_in_date: null, etd: null, onboard_date: null, pod_date: null,
    courier: '', awb_no: '', pickup_date: null, delivered_date: null, notes: '',
  }
  const [sh, setSh] = useState<Shipment>(emptySh)

  useEffect(() => {
    if (order?.shipment) setSh({ ...emptySh, ...order.shipment })
  }, [order?.shipment])

  useEffect(() => {
    if (order) setPayNote(order.payment_note ?? '')
  }, [order?.payment_note])

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

  const previewDoc = async (docId: number) => {
    try {
      const res = await fetch(`/api/documents/${docId}/file`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const url = URL.createObjectURL(await res.blob())
      window.open(url, '_blank')
      // revoke terlambat supaya tab baru sempat render PDF
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const deleteDoc = async () => {
    if (!delDoc) return
    setBusy(true)
    setError('')
    try {
      await api(`/documents/${delDoc.id}`, { method: 'DELETE' })
      setDelDoc(null)
      await load()
    } catch (err) {
      setError((err as Error).message)
      setDelDoc(null)
    } finally {
      setBusy(false)
    }
  }

  const saveShipment = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api(`/orders/${oid}/shipment`, { method: 'PUT', body: sh })
      await load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const setShField = (k: keyof Shipment, v: string | null) => setSh((s) => ({ ...s, [k]: v }))

  const savePayment = async (s: string) => {
    if (!order) return
    setBusy(true)
    setError('')
    try {
      const updated = await api<Order>(`/orders/${oid}/payment`, { method: 'PUT', body: { status: s, note: payNote } })
      setOrder(updated)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const canEdit = order.status === 'draft'
  const shipLocked = order.status === 'draft' || order.status === 'completed' || order.status === 'cancelled'
  const sm = statusMeta[order.status]

  return (
    <div className="anim-fade-up mx-auto max-w-5xl px-4 py-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', to: '/' },
          { label: 'Pesanan', to: '/orders' },
          { label: order.order_no },
        ]}
      />
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
          <div className="stagger space-y-2">
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

      {/* Pengiriman */}
      <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Truck size={15} className="text-indigo-400" /> Pengiriman
            <span className={`rounded-full px-2 py-0.5 text-[10px] ${order.shipping_mode === 'courier' ? 'bg-indigo-600/15 text-indigo-300' : 'bg-emerald-600/15 text-emerald-300'}`}>
              {order.shipping_mode === 'courier' ? 'Kurir' : order.shipping_mode.toUpperCase()}
            </span>
          </h2>
          {!shipLocked && (
            <span className="text-[11px] text-zinc-500">
              {order.shipping_mode === 'courier' ? 'Isi pickup → shipped · delivered → completed' : 'Isi ETD → shipped · POD → completed'}
            </span>
          )}
        </div>
        <form onSubmit={saveShipment} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {order.shipping_mode === 'courier' ? (
            <>
              <div>
                <label className="mb-1 block text-[11px] text-zinc-500">Kurir</label>
                <input className={inputCls} placeholder="DHL / FedEx / JNE" value={sh.courier} disabled={shipLocked} onChange={(e) => setShField('courier', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-zinc-500">No. AWB</label>
                <input className={inputCls} placeholder="e.g. 1234-5678-9012" value={sh.awb_no} disabled={shipLocked} onChange={(e) => setShField('awb_no', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-zinc-500">Tanggal Pickup</label>
                <input type="date" className={inputCls} value={sh.pickup_date?.slice(0, 10) ?? ''} disabled={shipLocked} onChange={(e) => setShField('pickup_date', e.target.value || null)} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-zinc-500">Tanggal Diterima (Delivered)</label>
                <input type="date" className={inputCls} value={sh.delivered_date?.slice(0, 10) ?? ''} disabled={shipLocked} onChange={(e) => setShField('delivered_date', e.target.value || null)} />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-[11px] text-zinc-500">PEB No</label>
                <input className={inputCls} placeholder="e.g. 003456" value={sh.peb_no} disabled={shipLocked} onChange={(e) => setShField('peb_no', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-zinc-500">NPE No</label>
                <input className={inputCls} placeholder="e.g. 004321" value={sh.npe_no} disabled={shipLocked} onChange={(e) => setShField('npe_no', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-zinc-500">Vessel</label>
                <input className={inputCls} placeholder="Kapal" value={sh.vessel_name} disabled={shipLocked} onChange={(e) => setShField('vessel_name', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-zinc-500">Voyage</label>
                <input className={inputCls} placeholder="e.g. 018E" value={sh.voyage_no} disabled={shipLocked} onChange={(e) => setShField('voyage_no', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-zinc-500">Stuffing Date</label>
                <input type="date" className={inputCls} value={sh.stuffing_date?.slice(0, 10) ?? ''} disabled={shipLocked} onChange={(e) => setShField('stuffing_date', e.target.value || null)} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-zinc-500">Gate-In Date</label>
                <input type="date" className={inputCls} value={sh.gate_in_date?.slice(0, 10) ?? ''} disabled={shipLocked} onChange={(e) => setShField('gate_in_date', e.target.value || null)} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-zinc-500">ETD</label>
                <input type="date" className={inputCls} value={sh.etd?.slice(0, 10) ?? ''} disabled={shipLocked} onChange={(e) => setShField('etd', e.target.value || null)} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-zinc-500">Onboard Date</label>
                <input type="date" className={inputCls} value={sh.onboard_date?.slice(0, 10) ?? ''} disabled={shipLocked} onChange={(e) => setShField('onboard_date', e.target.value || null)} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-zinc-500">POD Date</label>
                <input type="date" className={inputCls} value={sh.pod_date?.slice(0, 10) ?? ''} disabled={shipLocked} onChange={(e) => setShField('pod_date', e.target.value || null)} />
              </div>
            </>
          )}
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="mb-1 block text-[11px] text-zinc-500">Catatan Pengiriman</label>
            <input className={inputCls} placeholder="opsional" value={sh.notes} disabled={shipLocked} onChange={(e) => setShField('notes', e.target.value)} />
          </div>
          <div className="flex items-end">
            {shipLocked ? (
              <div className="w-full rounded-lg bg-zinc-800/50 px-3 py-2 text-[11px] text-zinc-500">
                {order.status === 'completed' ? 'Pengiriman selesai — terkunci' : 'Pengiriman bisa diisi setelah order confirmed'}
              </div>
            ) : (
              <Button type="submit" disabled={busy} className="w-full">
                <Save size={14} /> Simpan Pengiriman
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Pembayaran */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
          <Wallet size={15} className="text-amber-400" /> Pembayaran
        </h2>
        <p className="mb-3 text-xs text-zinc-500">Status pembayaran buyer — tidak mengubah status order</p>
        <div className="flex flex-wrap gap-2">
          {(['unpaid', 'dp', 'paid'] as const).map((s) => {
            const active = order.payment_status === s
            const cls = active
              ? s === 'paid'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                : s === 'dp'
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40'
                  : 'bg-rose-600/15 text-rose-300 border border-rose-500/40'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            return (
              <button key={s} onClick={() => savePayment(s)} disabled={busy}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${cls}`}>
                {s === 'paid' ? '✓ Lunas' : s === 'dp' ? 'DP (Sebagian)' : 'Belum Dibayar'}
              </button>
            )
          })}
        </div>
        <input
          value={payNote}
          onChange={(e) => setPayNote(e.target.value)}
          onBlur={() => order.payment_note !== payNote && savePayment(order.payment_status)}
          placeholder="Catatan pembayaran (opsional) — mis. T/T 50% DP, sisanya sebelum kirim"
          className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-500 focus:border-indigo-500"
        />
        {order.paid_at && <p className="mt-2 text-[11px] text-emerald-400">✓ Lunas sejak {order.paid_at.slice(0, 10)}</p>}
      </div>

      {/* Dokumen */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <h2 className="mb-1 text-sm font-semibold">Dokumen Export</h2>
        <p className="mb-3 text-xs text-zinc-500">Dibuat otomatis dari data order — bahasa English</p>
        <div className="stagger space-y-2">
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
              <div className="flex items-center gap-1.5">
                <button onClick={() => previewDoc(d.id)} title="Preview" className="flex items-center gap-1.5 rounded-lg bg-zinc-800/70 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700">
                  <Eye size={13} /> Preview
                </button>
                <button onClick={() => downloadDoc(d.id)} className="flex items-center gap-1.5 rounded-lg bg-indigo-600/15 px-3 py-1.5 text-xs text-indigo-400 hover:bg-indigo-600/25">
                  <Download size={13} /> Unduh
                </button>
                <button onClick={() => setDelDoc(d)} title="Hapus" className="flex items-center gap-1.5 rounded-lg bg-rose-600/10 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-600/20">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {delDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setDelDoc(null)}>
            <div className="anim-pop w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-5" onClick={(e) => e.stopPropagation()}>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <Trash2 size={16} className="text-rose-400" /> Hapus dokumen?
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                <span className="font-mono text-zinc-300">{delDoc.doc_no}</span> ({delDoc.doc_type}) akan dihapus
                permanen dari server. Dokumen tetap bisa dibuat ulang dari data order ini.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setDelDoc(null)} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700">
                  Batal
                </button>
                <button onClick={deleteDoc} disabled={busy} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-500 disabled:opacity-50">
                  {busy ? 'Menghapus…' : 'Ya, hapus'}
                </button>
              </div>
            </div>
          </div>
        )}

        {order.status !== 'cancelled' && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {docDefs
              .filter((d) => !(d.type === 'SI' && order.shipping_mode === 'courier'))
              .filter((d) => level[order.status] >= level[d.min])
              .map((d) => {
                const exists = docs.some((x) => x.doc_type === d.type)
                return (
                  <div key={d.type} className="flex flex-col rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-indigo-400" />
                        <span className="text-sm font-medium text-zinc-100">{d.label}</span>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${exists ? 'bg-emerald-500/15 text-emerald-300' : 'bg-zinc-800 text-zinc-500'}`}>
                        {exists ? '✓ Ada' : 'Belum ada'}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-500">
                      {d.type} · {minLabel[d.min]}
                    </div>
                    <Button variant={exists ? 'ghost' : 'primary'} className="mt-2 w-full !px-3 !py-1.5 text-xs" disabled={busy} onClick={() => generateDoc(d.type)}>
                      {exists ? <Pencil size={13} /> : <Plus size={13} />} {exists ? 'Generate ulang' : 'Buat dokumen'}
                    </Button>
                  </div>
                );
              })}
          </div>
        )}
        {!order.peb_required && order.status !== 'cancelled' && (
          <div className="mt-3 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-300">
            ✓ Mode kurir di bawah ambang PEB (FOB &lt; $100 dan berat &lt; 30 kg) — PEB tidak wajib. Data sheet tetap bisa dibuat sebagai arsip.
          </div>
        )}
        {order.shipping_mode === 'courier' && order.status !== 'cancelled' && (
          <div className="mt-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-[11px] text-zinc-500">
            SI tidak berlaku untuk mode kurir — gunakan no. AWB courier sebagai referensi pengiriman.
          </div>
        )}
        {order.status === 'cancelled' && (
          <div className="mt-4 text-xs text-zinc-500">Order dibatalkan — dokumen tidak bisa dibuat.</div>
        )}
      </div>
    </div>
  )
}
