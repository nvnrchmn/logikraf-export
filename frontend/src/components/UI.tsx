import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger'
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}) {
  const base =
    'btn-press inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium disabled:opacity-50 disabled:pointer-events-none'
  const styles: Record<string, string> = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500',
    ghost: 'border border-zinc-700 text-zinc-300 hover:bg-zinc-800',
    danger: 'bg-red-600/15 text-red-400 hover:bg-red-600/25',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </button>
  )
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-zinc-500">{hint}</span>}
    </label>
  )
}

export const inputCls =
  'w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  // kunci scroll background saat modal terbuka
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 anim-fade">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 my-auto w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl anim-scale max-h-[85dvh] overflow-y-auto overscroll-contain">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 py-12 text-center text-sm text-zinc-500">
      {message}
    </div>
  )
}

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="stagger space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-16" style={{ animationDelay: `${i * 70}ms` }} />
      ))}
    </div>
  )
}

export function SkeletonCards({ rows = 4 }: { rows?: number }) {
  return (
    <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-24" style={{ animationDelay: `${i * 70}ms` }} />
      ))}
    </div>
  )
}
