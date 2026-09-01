import { useEffect, useState } from 'react'
import { Calculator as CalcIcon, Plus, Trash2, Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import type { Product } from '../lib/types'
import Breadcrumbs from '../components/Breadcrumbs'
import { Button, Field, inputCls } from '../components/UI'

interface Line {
  productId: number
  qty: number
}

const fmt = (n: number) => n.toLocaleString('id-ID', { maximumFractionDigits: 2 })

export default function Calculator() {
  const [products, setProducts] = useState<Product[]>([])
  const [lines, setLines] = useState<Line[]>([{ productId: 0, qty: 1 }])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<Product[]>('/products?q=').then((p) => {
      setProducts(p.filter((x) => x.active))
      if (p.length > 0) setLines([{ productId: p[0].id, qty: 1 }])
      setLoading(false)
    })
  }, [])

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)))

  const totals = lines.reduce(
    (acc, l) => {
      const p = products.find((x) => x.id === l.productId)
      if (!p || l.qty <= 0) return acc
      const vol = (p.length_cm * p.width_cm * p.height_cm) / 1_000_000
      acc.cbm += vol * l.qty
      acc.net += (p.net_weight_g / 1000) * l.qty
      acc.gross += (p.gross_weight_g / 1000) * l.qty
      return acc
    },
    { cbm: 0, net: 0, gross: 0 },
  )

  return (
    <div className="anim-fade-up">
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Kalkulator CBM' }]} />
      <div className="mb-5">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <CalcIcon className="w-5 h-5 text-indigo-400" /> Kalkulator CBM & Berat
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">Hitung volume (CBM), berat neto & kotor dari dimensi produk</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-5 gap-4">
          <div className="md:col-span-3 space-y-3 stagger">
            {lines.map((l, i) => {
              const p = products.find((x) => x.id === l.productId)
              return (
                <div key={i} className="stagger rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex items-end gap-3" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex-1">
                    <Field label="Produk">
                      <select className={inputCls} value={l.productId} onChange={(e) => setLine(i, { productId: Number(e.target.value) })}>
                        {products.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.sku} — {x.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <div className="w-24">
                    <Field label="Qty (pcs)">
                      <input
                        type="number"
                        min={1}
                        className={inputCls}
                        value={l.qty}
                        onChange={(e) => setLine(i, { qty: Number(e.target.value) })}
                      />
                    </Field>
                  </div>
                  <button
                    onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
                    disabled={lines.length === 1}
                    className="p-2 text-zinc-500 hover:text-red-300 rounded-lg hover:bg-zinc-800 disabled:opacity-30 mb-0.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {p && (
                    <div className="text-[11px] text-zinc-500 pb-2 hidden sm:block">
                      {p.length_cm}×{p.width_cm}×{p.height_cm} cm · {p.net_weight_g}/{p.gross_weight_g} g
                    </div>
                  )}
                </div>
              )
            })}
            <Button variant="ghost" onClick={() => setLines((ls) => [...ls, { productId: products[0]?.id ?? 0, qty: 1 }])}>
              <Plus className="w-4 h-4" /> Tambah Baris
            </Button>
          </div>

          <div className="md:col-span-2">
            <div className="stagger rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-indigo-300">Ringkasan</h3>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Total Volume</span>
                <span className="font-semibold text-zinc-100">{fmt(totals.cbm)} m³</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Berat Neto</span>
                <span className="font-semibold text-zinc-100">{fmt(totals.net)} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Berat Kotor</span>
                <span className="font-semibold text-zinc-100">{fmt(totals.gross)} kg</span>
              </div>
              <div className="pt-3 border-t border-indigo-500/20 text-[11px] text-zinc-500">
                Muat 20ft: ±28 m³ · 40ft: ±58 m³ — sesuaikan dengan koli & palet.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}