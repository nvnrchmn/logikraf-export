import type { OrderStatus } from './types'

export const statusMeta: Record<OrderStatus, { label: string; cls: string }> = {
  draft: { label: 'Konsep', cls: 'bg-zinc-700/50 text-zinc-300' },
  confirmed: { label: 'Dikonfirmasi', cls: 'bg-blue-500/15 text-blue-400' },
  packed: { label: 'Siap Kirim', cls: 'bg-amber-500/15 text-amber-400' },
  shipped: { label: 'Dikirim', cls: 'bg-indigo-500/15 text-indigo-400' },
  completed: { label: 'Selesai', cls: 'bg-emerald-500/15 text-emerald-400' },
  cancelled: { label: 'Dibatalkan', cls: 'bg-red-500/15 text-red-400' },
}

export const allStatuses: OrderStatus[] = [
  'draft',
  'confirmed',
  'packed',
  'shipped',
  'completed',
  'cancelled',
]

export const statusFlow: Record<OrderStatus, OrderStatus[]> = {
  draft: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['shipped'],
  shipped: ['completed'],
  completed: [],
  cancelled: [],
}

export function fmtMoney(v: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(v)
}

export function fmtDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
