import { Construction } from 'lucide-react'

export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mb-4">
        <Construction className="w-7 h-7 text-zinc-500" />
      </div>
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="text-zinc-500 text-sm mt-2">Modul ini sedang dibangun di sprint berikutnya.</p>
    </div>
  )
}
