import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Search, Loader2, Package } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { api } from '../lib/api'
import type { Buyer, Incoterm, Order, Port, ShippingMode } from '../lib/types'
import { allStatuses, fmtDate, fmtMoney, statusMeta } from '../lib/status'
import { Button, EmptyState, Field, Modal, inputCls, SkeletonList } from '../components/UI'
import Breadcrumbs from '../components/Breadcrumbs'

const emptyForm = {
  shipping_mode: 'courier' as ShippingMode,
  buyer_id: 0,
  incoterm_id: 0,
  port_loading_id: 0,
  port_discharge_id: 0,
  payment_terms: '',
  notes: '',
}

const modeMeta: Record<ShippingMode, { label: string; desc: string }> = {
  courier: { label: 'Kurir / Parcel', desc: 'DHL/FedEx/JNE — kiriman kecil (<$100 / 30kg), tanpa PEB' },
  lcl: { label: 'LCL', desc: 'Kontainer sebagian — kiriman menengah, PEB via PPJK' },
  fcl: { label: 'FCL', desc: 'Kontainer penuh — kiriman besar, PEB via PPJK' },
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [ports, setPorts] = useState<Port[]>([])
  const [incoterms, setIncoterms] = useState<Incoterm[]>([])
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const load = async (st = status, query = q) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (st) params.set('status', st)
      if (query) params.set('q', query)
      setOrders(await api<Order[]>(`/orders?${params.toString()}`))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load('', '')
    Promise.all([api<Buyer[]>('/buyers'), api<Port[]>('/ports'), api<Incoterm[]>('/incoterms')])
      .then(([b, p, i]) => {
        setBuyers(b.filter((x) => x.active))
        setPorts(p)
        setIncoterms(i)
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const created = await api<Order>('/orders', { method: 'POST', body: form })
      setModalOpen(false)
      setForm(emptyForm)
      navigate(`/orders/${created.id}`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const set = (k: keyof typeof emptyForm, v: number | string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="anim-fade-up mx-auto max-w-5xl px-4 py-6">
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Pesanan' }]} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Pesanan</h1>
          <p className="text-sm text-zinc-500">Order ekspor — dari proforma sampai dokumen</p>
        </div>
        <Button onClick={() => { setError(''); setModalOpen(true) }}>
          <Plus size={16} /> Pesanan Baru
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
          <Search size={16} className="text-zinc-500" />
          <input
            className="w-full bg-transparent text-sm outline-none placeholder-zinc-500"
            placeholder="Cari nomor pesanan atau buyer…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(status, q)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => { setStatus(''); load('', q) }}
            className={`rounded-full px-3 py-1 text-xs ${status === '' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
          >
            Semua
          </button>
          {allStatuses.map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); load(s, q) }}
              className={`rounded-full px-3 py-1 text-xs ${status === s ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
            >
              {statusMeta[s].label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-600/15 px-3 py-2 text-sm text-red-400">{error}</div>}

      {loading ? (
        <SkeletonList rows={4} />
      ) : orders.length === 0 ? (
        <EmptyState message="Belum ada pesanan. Klik 'Pesanan Baru' untuk mulai." />
      ) : (
        <div className="stagger space-y-2">
          {orders.map((o) => (
            <Link
              key={o.id}
              to={`/orders/${o.id}`}
              className="card-lift block rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Package size={15} className="text-zinc-500" />
                  <span className="font-mono text-sm font-semibold">{o.order_no}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${statusMeta[o.status].cls}`}>
                    {statusMeta[o.status].label}
                  </span>
                  <span className={`hidden rounded-full px-2 py-0.5 text-[11px] sm:inline ${o.payment_status === 'paid' ? 'bg-emerald-600/15 text-emerald-300' : o.payment_status === 'dp' ? 'bg-amber-600/15 text-amber-300' : 'bg-rose-600/15 text-rose-300'}`}>
                    {o.payment_status === 'paid' ? '✓ Lunas' : o.payment_status === 'dp' ? 'DP' : 'Belum'}
                  </span>
                </div>
                <span className="font-mono text-sm text-zinc-300">{fmtMoney(o.total_fob)}</span>
              </div>
              <div className="mt-1.5 text-xs text-zinc-500">
                {o.buyer?.company_name} · {o.incoterm?.code} ·{' '}
                {o.shipping_mode === 'courier' ? (
                  <span className="text-indigo-400/80">Kurir</span>
                ) : (
                  <>{o.port_loading?.code} → {o.port_discharge?.code}</>
                )}{' '}
                · {fmtDate(o.created_at)}
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal open={modalOpen} title="Pesanan Baru" onClose={() => setModalOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Buyer *">
            <select className={inputCls} value={form.buyer_id} onChange={(e) => set('buyer_id', Number(e.target.value))} required>
              <option value={0}>— pilih buyer —</option>
              {buyers.map((b) => (
                <option key={b.id} value={b.id}>{b.company_name} ({b.country})</option>
              ))}
            </select>
          </Field>
          <Field label="Mode Pengiriman *">
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(modeMeta) as ShippingMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, shipping_mode: m, port_loading_id: 0, port_discharge_id: 0 }))}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                    form.shipping_mode === m
                      ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                      : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  {modeMeta[m].label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-zinc-500">{modeMeta[form.shipping_mode].desc}</p>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Incoterm *">
              <select className={inputCls} value={form.incoterm_id} onChange={(e) => set('incoterm_id', Number(e.target.value))} required>
                <option value={0}>— pilih —</option>
                {incoterms.map((i) => (
                  <option key={i.id} value={i.id}>{i.code}</option>
                ))}
              </select>
            </Field>
            <Field label="Mata Uang">
              <input className={inputCls} value="USD" disabled />
            </Field>
            {form.shipping_mode !== 'courier' && (
              <>
                <Field label="Pelabuhan Muat *">
                  <select className={inputCls} value={form.port_loading_id} onChange={(e) => set('port_loading_id', Number(e.target.value))} required>
                    <option value={0}>— pilih —</option>
                    {ports.map((p) => (
                      <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Pelabuhan Bongkar *">
                  <select className={inputCls} value={form.port_discharge_id} onChange={(e) => set('port_discharge_id', Number(e.target.value))} required>
                    <option value={0}>— pilih —</option>
                    {ports.map((p) => (
                      <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                    ))}
                  </select>
                </Field>
              </>
            )}
          </div>
          <Field label="Syarat Pembayaran" hint="mis. T/T 30% deposit, 70% before shipment">
            <input className={inputCls} value={form.payment_terms} onChange={(e) => set('payment_terms', e.target.value)} />
          </Field>
          <Field label="Catatan">
            <textarea className={inputCls} rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />} Buat Pesanan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
