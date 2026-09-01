import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import type { Product } from '../lib/types'
import Breadcrumbs from '../components/Breadcrumbs'
import { Button, EmptyState, Field, Modal, inputCls } from '../components/UI'

const empty: Omit<Product, 'id' | 'created_at' | 'updated_at'> = {
  sku: '',
  name: '',
  hs_code: '',
  description: '',
  length_cm: 0,
  width_cm: 0,
  height_cm: 0,
  net_weight_g: 0,
  gross_weight_g: 0,
  unit_price_usd: 0,
  active: true,
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async (query = '') => {
    setLoading(true)
    try {
      setProducts(await api<Product[]>(`/products?q=${encodeURIComponent(query)}`))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(empty)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      sku: p.sku,
      name: p.name,
      hs_code: p.hs_code,
      description: p.description,
      length_cm: p.length_cm,
      width_cm: p.width_cm,
      height_cm: p.height_cm,
      net_weight_g: p.net_weight_g,
      gross_weight_g: p.gross_weight_g,
      unit_price_usd: p.unit_price_usd,
      active: p.active,
    })
    setError('')
    setModalOpen(true)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await api(`/products/${editing.id}`, { method: 'PUT', body: form })
      } else {
        await api('/products', { method: 'POST', body: form })
      }
      setModalOpen(false)
      await load(q)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (p: Product) => {
    if (!confirm(`Hapus produk ${p.sku}?`)) return
    await api(`/products/${p.id}`, { method: 'DELETE' })
    await load(q)
  }

  const set = (k: keyof typeof empty, v: string | number | boolean) =>
    setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="anim-fade-up mx-auto max-w-5xl px-4 py-6">
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Produk' }]} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Produk</h1>
          <p className="text-sm text-zinc-500">Master data produk ekspor — SKU, HS Code, dimensi & berat</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Tambah Produk
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
        <Search size={16} className="text-zinc-500" />
        <input
          className="w-full bg-transparent text-sm outline-none placeholder-zinc-500"
          placeholder="Cari SKU, nama, HS Code…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(q)}
        />
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-600/15 px-3 py-2 text-sm text-red-400">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12 text-zinc-500">
          <Loader2 className="animate-spin" size={24} />
        </div>
      ) : products.length === 0 ? (
        <EmptyState message="Belum ada produk. Klik 'Tambah Produk' untuk mulai." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {products.map((p) => (
            <div key={p.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-sm font-semibold">{p.sku}</div>
                  <div className="text-sm text-zinc-300">{p.name}</div>
                  <div className="mt-1 font-mono text-xs text-indigo-400">HS {p.hs_code || '—'}</div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] ${
                    p.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-700/50 text-zinc-400'
                  }`}
                >
                  {p.active ? 'aktif' : 'nonaktif'}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-zinc-400">
                <div>
                  <div className="text-zinc-600">Ukuran (cm)</div>
                  {p.length_cm}×{p.width_cm}×{p.height_cm}
                </div>
                <div>
                  <div className="text-zinc-600">Berat (g)</div>
                  {p.net_weight_g} / {p.gross_weight_g}
                </div>
                <div>
                  <div className="text-zinc-600">Harga</div>
                  ${p.unit_price_usd.toFixed(2)}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="ghost" className="!px-3 !py-1.5 text-xs" onClick={() => openEdit(p)}>
                  <Pencil size={13} /> Edit
                </Button>
                <Button variant="danger" className="!px-3 !py-1.5 text-xs" onClick={() => remove(p)}>
                  <Trash2 size={13} /> Hapus
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} title={editing ? `Edit ${editing.sku}` : 'Tambah Produk'} onClose={() => setModalOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="SKU *">
              <input className={inputCls} value={form.sku} onChange={(e) => set('sku', e.target.value)} required />
            </Field>
            <Field label="HS Code (BTKI)" hint="Verifikasi ke PPJK/DJBC sebelum ekspor pertama">
              <input className={inputCls} value={form.hs_code} onChange={(e) => set('hs_code', e.target.value)} />
            </Field>
          </div>
          <Field label="Nama Produk *">
            <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </Field>
          <Field label="Deskripsi (untuk dokumen export, English)">
            <textarea
              className={inputCls}
              rows={2}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Panjang (cm)">
              <input type="number" step="0.1" className={inputCls} value={form.length_cm} onChange={(e) => set('length_cm', Number(e.target.value))} />
            </Field>
            <Field label="Lebar (cm)">
              <input type="number" step="0.1" className={inputCls} value={form.width_cm} onChange={(e) => set('width_cm', Number(e.target.value))} />
            </Field>
            <Field label="Tinggi (cm)">
              <input type="number" step="0.1" className={inputCls} value={form.height_cm} onChange={(e) => set('height_cm', Number(e.target.value))} />
            </Field>
            <Field label="Berat Neto (g)">
              <input type="number" step="1" className={inputCls} value={form.net_weight_g} onChange={(e) => set('net_weight_g', Number(e.target.value))} />
            </Field>
            <Field label="Berat Kotor (g)">
              <input type="number" step="1" className={inputCls} value={form.gross_weight_g} onChange={(e) => set('gross_weight_g', Number(e.target.value))} />
            </Field>
            <Field label="Harga Satuan (USD)">
              <input type="number" step="0.01" className={inputCls} value={form.unit_price_usd} onChange={(e) => set('unit_price_usd', Number(e.target.value))} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="accent-indigo-500" />
            Produk aktif
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />} Simpan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
