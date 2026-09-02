import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/** Tangkapan error render — mencegah blank screen total (React unmount semua tree saat error tak tertangani). */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="anim-fade-up mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-600/15">
            <AlertTriangle size={22} className="text-red-400" />
          </div>
          <h1 className="text-lg font-semibold text-zinc-100">Terjadi kesalahan pada tampilan</h1>
          <p className="mt-2 text-sm break-words text-zinc-400">{this.state.error.message}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => this.setState({ error: null })}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Coba lagi
            </button>
            <button
              onClick={() => {
                window.location.href = '/'
              }}
              className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
            >
              Ke Dashboard
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
