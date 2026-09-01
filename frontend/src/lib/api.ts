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

async function toErr(res: Response): Promise<Error> {
  let msg = `HTTP ${res.status}`
  try {
    const d = await res.json()
    if (d?.error) msg = d.error
  } catch {
    /* body bukan json */
  }
  return new Error(msg)
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

  if (!res.ok) throw await toErr(res)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

/** Upload multipart (FormData) — jangan set Content-Type manual, browser set boundary sendiri. */
export async function postForm<T>(path: string, body: FormData): Promise<T> {
  const res = await fetch('/api' + path, {
    method: 'POST',
    headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
    body,
  })

  if (!res.ok) throw await toErr(res)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
