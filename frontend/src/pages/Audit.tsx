import { useCallback, useEffect, useState } from 'react'
import { ScrollText, Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import Breadcrumbs from '../components/Breadcrumbs'

export interface AuditLog {
  id: number
  user_id: number
  user?: { id: number; name: string; email: string }
  action: string
  entity: string
  entity_id: string
  detail: string
  created_at: string
}

const actionCls: Record<string, string> = {
  create: 'bg-emerald-500/15 text-emerald-300',
  update: 'bg-blue-500/15 text-blue-300',
  delete: 'bg-red-500/15 text-red-300',
  status: 'bg-amber-500/15 text-amber-300',
  doc_generate: 'bg-indigo-500/15 text-indigo-300',
  shipment_update: 'bg-cyan-500/15 text-cyan-300',
  reset_password: 'bg-amber-500/15 text-amber-300',
  deactivate: 'bg-red-500/15 text-red-300',
  activate: 'bg-emerald-500/15 text-emerald-300',
  item_add: 'bg-blue-500/15 text-blue-300',
  item_update: 'bg-blue-500/15 text-blue-300',
  item_remove: 'bg-red-500/15 text-red-300',
}

const entities = ['semua', 'order', 'product', 'buyer', 'user', 'shipment', 'document']

export default function Audit() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [entity, setEntity] = useState('semua')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setLogs(await api<AuditLog[]>('/audit-logs'))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = entity === 'semua' ? logs : logs.filter((l) => l.entity === entity)

  return (
    <div className="anim-fade-up">
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Audit Log' }]} />
      <div className="mb-5">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-indigo-400" /> Audit Log
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">Jejak perubahan terbaru (100 terakhir)</p>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {entities.map((e) => (
          <button
            key={e}
            onClick={() => setEntity(e)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              entity === e ? 'bg-indigo-600/25 text-indigo-300 border border-indigo-500/40' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-300">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-20 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((l, i) => (
            <div
              key={l.id}
              className="stagger rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 flex items-center gap-3"
              style={{ animationDelay: `${Math.min(i * 30, 400)}ms` }}
            >
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${actionCls[l.action] ?? 'bg-zinc-700/50 text-zinc-300'}`}>
                {l.action}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm truncate">
                  <span className="text-zinc-300">{l.user?.name ?? `user#${l.user_id}`}</span>
                  <span className="text-zinc-600"> · {l.entity} {l.entity_id}</span>
                  {l.detail && <span className="text-zinc-500"> — {l.detail}</span>}
                </div>
                <div className="text-[11px] text-zinc-600">{l.created_at}</div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-center text-zinc-500 py-10">Tidak ada entri</div>}
        </div>
      )}
    </div>
  )
}