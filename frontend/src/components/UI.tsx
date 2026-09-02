import { X, Trash2, AlertTriangle } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

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
  return createPortal(
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
    </div>,
    document.body
  )
}

// ConfirmDialog — konfirmasi gaya SweetAlert, di-portal ke body agar selalu center viewport.
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Hapus',
  tone = 'danger',
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  body?: string
  confirmLabel?: string
  tone?: 'danger' | 'warn'
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null
  const danger = tone === 'danger'
  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-center justify-center overflow-y-auto p-4 anim-fade">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className="relative z-10 my-auto w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl anim-pop">
        <div className="flex flex-col items-center text-center">
          <span
            className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
              danger ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'
            }`}
          >
            {danger ? <Trash2 size={22} /> : <AlertTriangle size={22} />}
          </span>
          <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
          {body && <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{body}</p>}
          <div className="mt-5 flex w-full justify-end gap-2">
            <button
              onClick={onCancel}
              disabled={busy}
              className="rounded-lg border border-zinc-700 px-3.5 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              disabled={busy}
              className={`rounded-lg px-3.5 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                danger ? 'bg-rose-600 hover:bg-rose-500' : 'bg-amber-600 hover:bg-amber-500'
              }`}
            >
              {busy ? 'Memproses…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
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
