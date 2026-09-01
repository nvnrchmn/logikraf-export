import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  Wallet,
  Package,
  Ship,
  Layers,
  Loader2,
  FileText,
  TrendingUp,
} from 'lucide-react'
import { api } from '../lib/api'
import type { DashboardStats } from '../lib/types'
import { allStatuses, fmtDate, fmtMoney, statusMeta } from '../lib/status'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api<DashboardStats>('/dashboard/stats')
      .then(setStats)
      .catch((e) => setError((e as Error).message))
  }, [])

  if (error)
    return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>

  if (!stats)
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-zinc-500">
        <Loader2 className="mr-2 animate-spin" size={18} /> Memuat dashboard…
      </div>
    )

  const cards = [
    { label: 'FOB Bulan Ini', value: fmtMoney(stats.fob_this_month), icon: Wallet, cls: 'text-indigo-400' },
    { label: 'Order Bulan Ini', value: String(stats.orders_this_month), icon: Package, cls: 'text-emerald-400' },
    { label: 'Shipment Aktif', value: String(stats.active_shipments.length), icon: Ship, cls: 'text-amber-400' },
    { label: 'Total Order', value: String(stats.orders_total), icon: Layers, cls: 'text-sky-400' },
  ]

  return (
    <div className="anim-fade-up space-y-6">
      <div>
        <h1 className="text-xl font-bold">Halo, {user?.name} 👋</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Ringkasan operasi ekspor logikraf.</p>
      </div>

      {/* Kartu statistik */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className={`mb-2 flex items-center gap-1.5 text-[11px] text-zinc-500`}>
              <Icon size={13} className={cls} /> {label}
            </div>
            <div className="text-lg font-bold tracking-tight">{value}</div>
          </div>
        ))}
      </div>

      {/* Status order */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <TrendingUp size={15} className="text-indigo-400" /> Status Pesanan
        </h2>
        <div className="flex flex-wrap gap-2">
          {allStatuses.map((s) => {
            const n = stats.by_status[s] ?? 0
            const m = statusMeta[s]
            return (
              <Link
                key={s}
                to={`/orders?status=${s}`}
                className={`flex items-center gap-2 rounded-full border border-zinc-700/60 px-3 py-1.5 text-xs hover:border-zinc-500 ${m.cls}`}
              >
                {m.label} <span className="font-bold">{n}</span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Shipment aktif */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Ship size={15} className="text-amber-400" /> Shipment Aktif
          </h2>
          {stats.active_shipments.length === 0 ? (
            <p className="text-sm text-zinc-600">Belum ada shipment berjalan.</p>
          ) : (
            <div className="space-y-2">
              {stats.active_shipments.map((s) => (
                <Link
                  key={s.id}
                  to={`/orders/${s.id}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2.5 hover:border-zinc-600"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{s.order_no}</div>
                    <div className="truncate text-[11px] text-zinc-500">
                      {s.buyer_name} · {s.vessel || 'vessel belum diisi'}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {s.etd && <span className="text-[11px] text-zinc-500">ETD {fmtDate(s.etd)}</span>}
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${statusMeta[s.status].cls}`}>
                      {statusMeta[s.status].label}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Dokumen terbaru */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <FileText size={15} className="text-indigo-400" /> Dokumen Terbaru
          </h2>
          {stats.recent_docs.length === 0 ? (
            <p className="text-sm text-zinc-600">Belum ada dokumen dibuat.</p>
          ) : (
            <div className="space-y-2">
              {stats.recent_docs.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{d.doc_no}</div>
                    <div className="truncate text-[11px] text-zinc-500">
                      {d.doc_type} · {d.order_no || '-'}
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] text-zinc-500">{d.created_at}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order terbaru */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Package size={15} className="text-emerald-400" /> Pesanan Terbaru
        </h2>
        <div className="divide-y divide-zinc-800/70">
          {stats.recent_orders.map((o) => (
            <Link key={o.id} to={`/orders/${o.id}`} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0 hover:text-zinc-200">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{o.order_no}</div>
                <div className="truncate text-[11px] text-zinc-500">{o.buyer_name} · {o.created_at}</div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-medium">{fmtMoney(o.total_fob)}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] ${statusMeta[o.status].cls}`}>{statusMeta[o.status].label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
