import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Users as UsersIcon, UserPlus, Loader2, KeyRound, Ban, CheckCircle2 } from 'lucide-react'
import { api } from '../lib/api'
import type { User } from '../context/AuthContext'
import { Button, Field, Modal, inputCls } from '../components/UI'
import Breadcrumbs from '../components/Breadcrumbs'

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // create form
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('ops')

  // reset password target
  const [resetUser, setResetUser] = useState<User | null>(null)
  const [newPwd, setNewPwd] = useState('')

  const load = useCallback(async () => {
    try {
      setUsers(await api<User[]>('/users'))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const create = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/users', { method: 'POST', body: { name, email, password, role } })
      setShowCreate(false)
      setName(''); setEmail(''); setPassword(''); setRole('ops')
      await load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const toggleActive = async (u: User) => {
    setBusy(true)
    setError('')
    try {
      await api(`/users/${u.id}/${u.active ? 'deactivate' : 'activate'}`, { method: 'POST' })
      await load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const resetPwd = async (e: FormEvent) => {
    e.preventDefault()
    if (!resetUser) return
    setBusy(true)
    setError('')
    try {
      await api(`/users/${resetUser.id}/password`, { method: 'PUT', body: { password: newPwd } })
      setResetUser(null)
      setNewPwd('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-zinc-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="anim-fade-up">
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Pengguna' }]} />
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-indigo-400" /> Pengguna
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">Kelola akun admin & ops</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <UserPlus className="w-4 h-4" /> Tambah
        </Button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-300">{error}</div>}

      <div className="space-y-3">
        {users.map((u) => (
          <div key={u.id} className={`rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex items-center gap-3 ${!u.active ? 'opacity-50' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-indigo-600/25 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 uppercase">
              {u.name.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{u.name}</div>
              <div className="text-xs text-zinc-500 truncate">{u.email}</div>
            </div>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-indigo-600/20 text-indigo-300' : 'bg-zinc-700/50 text-zinc-300'}`}>
              {u.role}
            </span>
            {!u.active && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-500/15 text-red-300">Nonaktif</span>}
            <button onClick={() => setResetUser(u)} title="Reset password" className="p-2 text-zinc-500 hover:text-amber-300 rounded-lg hover:bg-zinc-800">
              <KeyRound className="w-4 h-4" />
            </button>
            <button onClick={() => toggleActive(u)} title={u.active ? 'Nonaktifkan' : 'Aktifkan'} className={`p-2 rounded-lg hover:bg-zinc-800 ${u.active ? 'text-zinc-500 hover:text-red-300' : 'text-emerald-400'}`}>
              {u.active ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </button>
          </div>
        ))}
        {users.length === 0 && <div className="text-center text-zinc-500 py-10">Belum ada pengguna</div>}
      </div>

      {showCreate && (
        <Modal open={true} title="Tambah Pengguna" onClose={() => setShowCreate(false)}>
          <form onSubmit={create} className="space-y-3">
            <Field label="Nama"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required /></Field>
            <Field label="Email"><input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
            <Field label="Password (min. 6 karakter)">
              <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
            </Field>
            <Field label="Role">
              <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="ops">ops — operator</option>
                <option value="admin">admin</option>
              </select>
            </Field>
            <Button type="submit" disabled={busy} className="w-full justify-center">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Simpan
            </Button>
          </form>
        </Modal>
      )}

      {resetUser && (
        <Modal open={true} title={`Reset Password — ${resetUser.name}`} onClose={() => setResetUser(null)}>
          <form onSubmit={resetPwd} className="space-y-3">
            <Field label="Password baru (min. 6 karakter)">
              <input type="password" className={inputCls} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} minLength={6} required />
            </Field>
            <Button type="submit" disabled={busy} className="w-full justify-center">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} Reset
            </Button>
          </form>
        </Modal>
      )}
    </div>
  )
}