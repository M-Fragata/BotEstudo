import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { api, clearSession, getStoredUser, getToken, storeSession } from '../api/client'
import { AuthContext } from './context'
import type { AuthContextValue } from './context'
import type { ApiUser } from '../api/client'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(() => getStoredUser())
  const [loading, setLoading] = useState(() => getToken() !== null)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      return
    }

    let cancelled = false
    api
      .me()
      .then(({ user: me }) => {
        if (cancelled) return
        setUser((current) => (current ? { ...current, email: me.email, id: me.id } : { ...me, name: null }))
      })
      .catch(() => {
        if (cancelled) return
        clearSession()
        setUser(null)
        setLoading(false)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { user: logged, token } = await api.login(email, password)
    storeSession(logged, token)
    setUser(logged)
    setLoading(false)
  }

  const register = async (name: string, email: string, password: string) => {
    const { user: created, token } = await api.register(name, email, password)
    storeSession(created, token)
    setUser(created)
    setLoading(false)
  }

  const logout = () => {
    clearSession()
    setUser(null)
    setLoading(false)
  }

  const value: AuthContextValue = { user, loading, login, register, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}