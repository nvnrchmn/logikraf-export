import { useState } from 'react'
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router'
import {
  LayoutDashboard,
  Package,
  Boxes,
  Building2,
  BookOpen,
  Users,
  ScrollText,
  Calculator,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/orders', label: 'Pesanan', icon: Package },
  { to: '/products', label: 'Produk', icon: Boxes },
  { to: '/buyers', label: 'Buyer', icon: Building2 },
  { to: '/guide', label: 'Panduan Ekspor', icon: BookOpen },
  { to: '/calculator', label: 'Kalkulator CBM', icon: Calculator },
  { to: '/users', label: 'Pengguna', icon: Users, admin: true },
  { to: '/audit', label: 'Audit Log', icon: ScrollText, admin: true },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)

  if (!user) return <Navigate to="/login" replace />

  function doLogout() {
    logout()
    nav('/login', { replace: true })
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-zinc-800/80">
        <div className="font-bold text-lg tracking-tight">
          logikraf<span className="text-indigo-400">·export</span>
        </div>
        <div className="text-[11px] text-zinc-500 mt-0.5">Export Management System</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.filter((n) => !n.admin || user.role === 'admin').map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/25'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/70 border border-transparent'
              }`
            }
          >
            <Icon className="w-4.5 h-4.5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-zinc-800/80">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full bg-indigo-600/25 border border-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-300 uppercase">
            {user.name.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{user.name}</div>
            <div className="text-[11px] text-zinc-500 capitalize">{user.role}</div>
          </div>
          <button
            onClick={doLogout}
            title="Keluar"
            className="text-zinc-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-full bg-zinc-950">
      {/* Sidebar desktop */}
      <aside className="hidden md:block fixed inset-y-0 left-0 w-60 bg-zinc-900 border-r border-zinc-800/80">
        {sidebar}
      </aside>

      {/* Top bar mobile */}
      <header className="md:hidden sticky top-0 z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800/80">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="font-bold">
            logikraf<span className="text-indigo-400">·export</span>
          </div>
          <button onClick={() => setOpen(true)} className="p-2 text-zinc-400">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Drawer mobile */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 anim-fade" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-zinc-900 border-r border-zinc-800 shadow-2xl anim-slide-right">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      {/* Konten */}
      <main className="md:pl-60">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
