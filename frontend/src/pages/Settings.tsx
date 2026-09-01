import { useEffect, useState } from 'react'
import { Building2, Save, Upload, ImageIcon, CheckCircle2, Loader2 } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import { api, postForm } from '../lib/api'
import type { CompanySetting } from '../lib/types'

const inputCls = 'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500'

export default function Settings() {
  const [form, setForm] = useState<CompanySetting | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [sigPreview, setSigPreview] = useState('')
  const [sigFile, setSigFile] = useState<File | null>(null)

  useEffect(() => {
    api<CompanySetting>('/company')
      .then((d) => { setForm(d); setSigPreview(d.signature_image ? `/api/company/signature-image?t=${Date.now()}` : '') })
      .catch(() => setMsg('gagal memuat profil'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-800/60" />)}</div>

  const set = (k: keyof CompanySetting, v: string) => setForm((f) => (f ? { ...f, [k]: v } : f))

  const save = async () => {
    if (!form) return
    setSaving(true); setMsg('')
    try {
      await api('/company', { method: 'PUT', body: form })
      setMsg('tersimpan ✓')
    } catch { setMsg('gagal menyimpan') } finally { setSaving(false) }
  }

  const uploadSig = async () => {
    if (!sigFile) return
    const fd = new FormData()
    fd.append('file', sigFile)
    setSaving(true); setMsg('')
    try {
      await postForm('/company/signature', fd)
      setMsg('tanda tangan tersimpan ✓')
      setSigPreview(`/api/company/signature-image?t=${Date.now()}`)
      setSigFile(null)
    } catch { setMsg('gagal upload (PNG/JPG maks 2MB)') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'Pengaturan' }]} />
        <h1 className="mt-1 flex items-center gap-2 text-xl font-bold text-zinc-100">
          <Building2 className="h-5 w-5 text-amber-500" /> Profil Perusahaan
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Dipakai sebagai header &amp; data eksportir di semua dokumen (PI, CI, PL, SI, PEB Data Sheet).
        </p>
      </div>

      {msg && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4" /> {msg}
        </div>
      )}

      {form && (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 lg:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Nama Perusahaan *</label>
                <input className={inputCls} value={form.company_name} onChange={(e) => set('company_name', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Email</label>
                <input className={inputCls} value={form.email} onChange={(e) => set('email', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-zinc-400">Alamat</label>
                <textarea className={inputCls} rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Kota</label>
                <input className={inputCls} value={form.city} onChange={(e) => set('city', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Negara</label>
                <input className={inputCls} value={form.country} onChange={(e) => set('country', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Telepon</label>
                <input className={inputCls} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Website</label>
                <input className={inputCls} value={form.website} onChange={(e) => set('website', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">NIB *</label>
                <input className={inputCls} value={form.nib} onChange={(e) => set('nib', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">NPWP *</label>
                <input className={inputCls} value={form.npwp} onChange={(e) => set('npwp', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Penandatangan (nama)</label>
                <input className={inputCls} value={form.signer_name} onChange={(e) => set('signer_name', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Jabatan</label>
                <input className={inputCls} value={form.signer_title} onChange={(e) => set('signer_title', e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={save} disabled={saving}
                className="btn-press inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan
              </button>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <ImageIcon className="h-4 w-4 text-amber-500" /> Tanda Tangan
            </h2>
            <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-950">
              {sigPreview
                ? <img src={sigPreview} alt="ttd" className="max-h-24 object-contain" />
                : <span className="text-xs text-zinc-500">belum ada</span>}
            </div>
            <input type="file" accept="image/png,image/jpeg" className="w-full text-xs text-zinc-400 file:mr-2 file:rounded file:border-0 file:bg-zinc-800 file:px-2 file:py-1 file:text-xs file:text-zinc-200"
              onChange={(e) => setSigFile(e.target.files?.[0] ?? null)} />
            <button onClick={uploadSig} disabled={!sigFile || saving}
              className="btn-press inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-700 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
            </button>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              PNG/JPG maks 2 MB, latar transparan disarankan. Gambar digambar di dokumen di atas nama penandatangan.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}