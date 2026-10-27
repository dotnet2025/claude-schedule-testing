import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '../api/endpoints'
import { setAccessToken, setUnauthorizedHandler, tryRefresh } from '../api/client'
import type { User } from '../types'

interface AuthState { user: User | null; loading: boolean; login: (e: string, p: string) => Promise<User>; logout: () => Promise<void> }
const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null))
    let cancelled = false
    tryRefresh()
      .then((r) => { if (!cancelled) setUser(r?.user ?? null) })
      .catch(() => { /* not signed in */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true; setUnauthorizedHandler(null) }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const r = await authApi.login(email, password)
    setAccessToken(r.accessToken)
    setUser(r.user)
    return r.user
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } finally { setAccessToken(null); setUser(null) }
  }, [])

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth must be used inside AuthProvider')
  return c
}
