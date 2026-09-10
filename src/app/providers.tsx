import { useMemo, type ReactNode } from 'react'
import { AuthContext } from './auth-context'
import type { AuthenticatedEmployee } from '../shared/types/session'

/**
 * Makes the signed-in employee available to everything below it.
 *
 * Before this, `employee` was handed from `App` to `AppShell` to `Rail` as a
 * prop, and any new screen that needed to know who was looking had to be threaded
 * the same way. Mounted only once the session exists, so no consumer has to
 * handle a null employee.
 */
export function AuthProvider({
  employee,
  onSignOut,
  children,
}: {
  employee: AuthenticatedEmployee
  onSignOut: () => void
  children: ReactNode
}) {
  const value = useMemo(() => ({ employee, signOut: onSignOut }), [employee, onSignOut])
  return <AuthContext value={value}>{children}</AuthContext>
}
