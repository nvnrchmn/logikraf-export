import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'

type Kind = 'success' | 'error' | 'info'
interface T {
  id: number
  msg: string
  kind: Kind
}

let push: ((t: T) => void) | null = null
let seq = 1

/** Panggil dari handler mana pun: toast('Produk disimpan') / toast('Gagal', 'error') */
export function toast(msg: string, kind: Kind = 'success') {
  push?.({ id: seq++, msg, kind })
}

const icon = (k: Kind) => {
  switch (k) {
    case 'success':
      return <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
    case 'error':
      return <AlertTriangle size={15} className="shrink-0 text-rose-400" />
    default:
      return <Info size={15} className="shrink-0 text-indigo-400" />
  }
}

const pill = (k: Kind) => {
  switch (k) {
    case 'success':
      return 'border-emerald-800/60 bg-zinc-950/95'
    case 'error':
      return 'border-rose-800/60 bg-zinc-950/95'
    default:
      return 'border-indigo-800/60 bg-zinc-950/95'
  }
}

/** Mount sekali di App — merender stack toast pojok atas tengah. */
export function Toasts() {
  const [items, setItems] = useState<T[]>([])
  useEffect(() => {
    push = (t: T) => {
      setItems((x) => [...x, t])
      setTimeout(() => setItems((x) => x.filter((y) => y.id !== t.id)), 3200)
    }
    return () => {
      push = null
    }
  }, [])

  if (items.length === 0) return null
  return (
    <div className="pointer-events-none fixed left-1/2 top-3 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
      {items.map((t) => (
        <div
          key={t.id}
          className={`anim-pop flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm text-zinc-100 shadow-2xl backdrop-blur ${pill(t.kind)}`}
        >
          {icon(t.kind)}
          <span className="leading-snug">{t.msg}</span>
        </div>
      ))}
    </div>
  )
}
