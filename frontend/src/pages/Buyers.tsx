import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, Search, Loader2, Building2 } from 'lucide-react'
import { api } from '../lib/api'
import type { Buyer } from '../lib/types'
import { Button, EmptyState, Field, Modal, inputCls } from '../components/UI'

const empty: Omit<Buyer, 'id' | 'created_at' | 'updated_at'> = {
  company_name: '',
  country: '',
  city: '',
  address: '',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  tax_id: '',
  active: true,
}

export default function Buyers() {
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Buyer | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async (query = '') => {
    setLoading(true)
    try {
      setBuyers(await api<Buyer[]>(`/buyers?q=${encodeURIComponent(query)}`))
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

  const openEdit = (b: Buyer) => {
    setEditing(b)
    setForm({
      company_name: b.company_name,
      country: b.country,
      city: b.city,
      address: b.address,
      contact_name: b.contact_name,
      contact_phone: b.contact_phone,
      contact_email: b.contact_email,
      tax_id: b.tax_id,
      active: b.active,
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
        await api(`/buyers/${editing.id}`, { method: 'PUT', body: form })
      } else {
        await api('/buyers', { method: 'POST', body: form })
      }
      setModalOpen(false)
      await load(q)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (b: Buyer) => {
    if (!confirm(`Hapus buyer ${b.company_name}?`)) return
    await api(`/buyers/${b.id}`, { method: 'DELETE' })
    await load(q)
  }

  const set = (k: keyof typeof empty, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Buyer</h1>
          <p className="text-sm text-zinc-500">Data pembeli / consignee tujuan ekspor</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Tambah Buyer
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
        <Search size={16} className="text-zinc-500" />
        <input
          className="w-full bg-transparent text-sm outline-none placeholder-zinc-500"
          placeholder="Cari nama perusahaan, negara, kontak…"
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
      ) : buyers.length === 0 ? (
        <EmptyState message="Belum ada buyer. Klik 'Tambah Buyer' untuk mulai." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {buyers.map((b) => (
            <div key={b.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/15 text-indigo-400">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{b.company_name}</div>
                    <div className="text-xs text-zinc-500">
                      {b.city && `${b.city}, `}{b.country}
                    </div>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] ${
                    b.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-700/50 text-zinc-400'
                  }`}
                >
                  {b.active ? 'aktif' : 'nonaktif'}
                </span>
              </div>
              <div className="mt-3 space-y-1 text-xs text-zinc-400">
                {b.contact_name && (
                  <div>Kontak: {b.contact_name}{b.contact_phone && ` · ${b.contact_phone}`}</div>
                )}
                {b.contact_email && <div className="truncate">{b.contact_email}</div>}
                {b.tax_id && <div className="font-mono">Tax/VAT ID: {b.tax_id}</div>}
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="ghost" className="!px-3 !py-1.5 text-xs" onClick={() => openEdit(b)}>
                  <Pencil size={13} /> Edit
                </Button>
                <Button variant="danger" className="!px-3 !py-1.5 text-xs" onClick={() => remove(b)}>
                  <Trash2 size={13} /> Hapus
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} title={editing ? `Edit ${editing.company_name}` : 'Tambah Buyer'} onClose={() => setModalOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nama Perusahaan *">
              <input className={inputCls} value={form.company_name} onChange={(e) => set('company_name', e.target.value)} required />
            </Field>
            <Field label="Negara *">
              <input className={inputCls} value={form.country} onChange={(e) => set('country', e.target.value)} required placeholder="Singapore" />
            </Field>
            <Field label="Kota">
              <input className={inputCls} value={form.city} onChange={(e) => set('city', e.target.value)} />
            </Field>
            <Field label="Alamat (untuk dokumen)">
              <input className={inputCls} value={form.address} onChange={(e) => set('address', e.target.value)} />
            </Field>
            <Field label="Nama Kontak">
              <input className={inputCls} value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} />
            </Field>
            <Field label="Telepon">
              <input className={inputCls} value={form.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} />
            </Field>
            <Field label="Email">
              <input type="email" className={inputCls} value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} />
            </Field>
            <Field label="Tax / VAT ID" hint="Diisi di dokumen bila diminta buyer">
              <input className={inputCls} value={form.tax_id} onChange={(e) => set('tax_id', e.target.value)} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="accent-indigo-500" />
            Buyer aktif
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
