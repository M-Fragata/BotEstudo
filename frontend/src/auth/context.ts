import { createContext } from 'react'
import type { ApiUser } from '../api/client'

export interface AuthContextValue {
  user: ApiUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)