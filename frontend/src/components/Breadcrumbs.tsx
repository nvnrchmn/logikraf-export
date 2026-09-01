import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'

export interface Crumb {
  label: string
  to?: string
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-zinc-500 mb-3 overflow-x-auto whitespace-nowrap">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="w-3 h-3 shrink-0 text-zinc-700" />}
          {it.to ? (
            <Link to={it.to} className="hover:text-zinc-300 transition-colors">
              {it.label}
            </Link>
          ) : (
            <span className="text-zinc-300">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}