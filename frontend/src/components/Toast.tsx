import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

type Kind = 'success' | 'error' | 'info'
interface T {
  id: number
  msg: string
  kind: Kind
}

let push: ((t: T) => void) | null = null
let seq = 1

export function toast(msg: string, kind: Kind = 'success') {
  push?.({ id: seq++, msg, kind })
}

const icons: Record<Kind, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
}
const iconTone: Record<Kind, string> = {
  success: 'text-emerald-400',
  error: 'text-rose-400',
  info: 'text-sky-400',
}
const borderTone: Record<Kind, string> = {
  success: 'border-emerald-500/40',
  error: 'border-rose-500/40',
  info: 'border-sky-500/40',
}

export function Toasts() {
  const [items, setItems] = useState<T[]>([])
  useEffect(() => {
    push = (t: T) => {
      setItems((x) => [...x.slice(-2), t]) // maksimal 3 tampil
      setTimeout(() => setItems((x) => x.filter((y) => y.id !== t.id)), 2600)
    }
    return () => {
      push = null
    }
  }, [])

  if (items.length === 0) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-sm flex-col gap-3">
        {items.map((t) => {
          const Ic = icons[t.kind]
          return (
            <div
              key={t.id}
              role="status"
              className={`anim-pop flex items-center gap-3 rounded-2xl border bg-zinc-900/95 p-4 shadow-2xl backdrop-blur ${borderTone[t.kind]}`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 ${iconTone[t.kind]}`}>
                <Ic size={19} />
              </span>
              <p className="flex-1 text-sm font-medium leading-snug text-zinc-100">{t.msg}</p>
              <button
                onClick={() => setItems((x) => x.filter((y) => y.id !== t.id))}
                className="rounded-md p-1 text-zinc-500 hover:bg-white/10 hover:text-zinc-200"
                aria-label="Tutup notifikasi"
              >
                <X size={15} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
