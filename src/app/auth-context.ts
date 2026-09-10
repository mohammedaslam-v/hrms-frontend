import { createContext, use } from 'react'
import type { AuthenticatedEmployee } from '../shared/types/session'

export interface AuthContextValue {
  employee: AuthenticatedEmployee
  signOut: () => void
}

/**
 * The signed-in employee, and the one action that ends the session.
 *
 * Null only before a provider mounts, which cannot happen inside the app — the
 * router is rendered by `AuthProvider`, so anything that can call `useAuth` is
 * already past the sign-in gate. The check below turns that invariant into an
 * error message rather than a null-pointer read somewhere further down.
 */
export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = use(AuthContext)
  if (!value) throw new Error('useAuth was called outside AuthProvider.')
  return value
}
