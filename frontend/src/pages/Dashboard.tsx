import { Package, Boxes, Building2, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()

  const cards = [
    {
      to: '/orders',
      label: 'Pesanan',
      desc: 'Buat & kelola pesanan ekspor',
      icon: Package,
      accent: 'text-indigo-400 bg-indigo-600/15 border-indigo-500/25',
    },
    {
      to: '/products',
      label: 'Produk',
      desc: 'Master data produk + HS Code',
      icon: Boxes,
      accent: 'text-emerald-400 bg-emerald-600/15 border-emerald-500/25',
    },
    {
      to: '/buyers',
      label: 'Buyer',
      desc: 'Data pembeli luar negeri',
      icon: Building2,
      accent: 'text-amber-400 bg-amber-600/15 border-amber-500/25',
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold">
        Halo, {user?.name.split(' ')[0]} 👋
      </h1>
      <p className="text-zinc-400 text-sm mt-1">
        Kelola pipeline ekspor dari order sampai dokumen kirim.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mt-8">
        {cards.map(({ to, label, desc, icon: Icon, accent }) => (
          <Link
            key={to}
            to={to}
            className="group bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors"
          >
            <div className={`inline-flex w-10 h-10 rounded-xl border items-center justify-center ${accent}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="font-semibold mt-4">{label}</div>
            <div className="text-sm text-zinc-400 mt-1">{desc}</div>
            <div className="flex items-center gap-1 text-xs text-indigo-400 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              Buka <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5">
        <div className="font-semibold">Mulai dari sini</div>
        <ol className="text-sm text-zinc-400 mt-3 space-y-2 list-decimal list-inside">
          <li>Input <Link to="/products" className="text-indigo-400 hover:underline">produk</Link> (SKU, HS Code, dimensi, berat)</li>
          <li>Input <Link to="/buyers" className="text-indigo-400 hover:underline">buyer</Link> (alamat lengkap untuk dokumen)</li>
          <li>Buat <Link to="/orders" className="text-indigo-400 hover:underline">pesanan</Link> → generate dokumen export</li>
        </ol>
      </div>
    </div>
  )
}
