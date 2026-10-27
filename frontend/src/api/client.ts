import type { AuthResponse } from '../types'

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>
  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

// Access token is kept in memory only (never localStorage). The refresh token lives in an HttpOnly cookie.
let accessToken: string | null = null
let onUnauthorized: (() => void) | null = null
let refreshing: Promise<boolean> | null = null

export const setAccessToken = (t: string | null) => { accessToken = t }
export const getAccessToken = () => accessToken
export const setUnauthorizedHandler = (fn: (() => void) | null) => { onUnauthorized = fn }

export async function tryRefresh(): Promise<AuthResponse | null> {
  const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}' })
  if (!res.ok) return null
  const data = (await res.json()) as AuthResponse
  accessToken = data.accessToken
  return data
}

async function parseError(res: Response): Promise<ApiError> {
  let message = res.statusText || `Request failed (${res.status})`
  let errors: Record<string, string[]> | undefined
  try {
    const body = await res.json()
    message = body.detail ?? body.title ?? message
    errors = body.errors
    if (errors) message = Object.values(errors).flat().join(' ') || message
  } catch { /* non-JSON body */ }
  return new ApiError(res.status, message, errors)
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers)
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  let body = init.body
  if (init.json !== undefined) { headers.set('Content-Type', 'application/json'); body = JSON.stringify(init.json) }
  let res: Response
  try {
    res = await fetch(path.startsWith('/') ? path : `/api/${path}`, { ...init, headers, body, credentials: 'include' })
  } catch {
    throw new ApiError(0, 'Network error. Please check your connection and try again.')
  }
  if (res.status === 401 && retry && accessToken) {
    refreshing ??= tryRefresh().then((r) => !!r).finally(() => { refreshing = null })
    if (await refreshing) return api<T>(path, init, false)
    accessToken = null
    onUnauthorized?.()
  }
  if (!res.ok) throw await parseError(res)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const qs = (params: Record<string, string | number | boolean | undefined | null>) => {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') p.set(k, String(v))
  const s = p.toString()
  return s ? `?${s}` : ''
}
