const TOKEN_KEY = 'lx_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t)
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export interface ApiOpts {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
}

export async function api<T>(path: string, opts: ApiOpts = {}): Promise<T> {
  const res = await fetch('/api' + path, {
    method: opts.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })

  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const d = await res.json()
      if (d?.error) msg = d.error
    } catch {
      /* body bukan json */
    }
    throw new Error(msg)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
