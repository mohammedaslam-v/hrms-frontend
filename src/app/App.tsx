import { useCallback, useEffect, useState } from 'react'
import { AuthProvider } from './providers'
import { AppRouter } from './router'
import { authApi, LoginPage } from '../features/auth'
import type { AuthenticatedEmployee } from '../shared/types/session'

type Status = 'booting' | 'signed-out' | 'signed-in'

/**
 * The session gate, and nothing else.
 *
 * Either there is a signed-in employee — in which case the router takes over —
 * or there is not, and the only screen is sign-in. Which page answers which URL
 * is `router.tsx`; who may see what is `navigation/access.ts`.
 */
function App() {
  const [status, setStatus] = useState<Status>('booting')
  const [employee, setEmployee] = useState<AuthenticatedEmployee | null>(null)

  // The access token lives in memory, so a reload restores the session from the
  // httpOnly refresh cookie rather than from anything the page can read.
  useEffect(() => {
    authApi
      .refresh()
      .then((session) => {
        setEmployee(session.employee)
        setStatus('signed-in')
      })
      .catch(() => setStatus('signed-out'))
  }, [])

  const handleSignedIn = useCallback((signedIn: AuthenticatedEmployee) => {
    setEmployee(signedIn)
    setStatus('signed-in')
  }, [])

  const signOut = useCallback(() => {
    void authApi.logout().then(() => {
      setEmployee(null)
      setStatus('signed-out')
    })
  }, [])

  if (status === 'booting') return <div className="boot">Loading…</div>

  if (status === 'signed-out' || !employee) {
    return <LoginPage onSignedIn={handleSignedIn} />
  }

  return (
    <AuthProvider employee={employee} onSignOut={signOut}>
      <AppRouter />
    </AuthProvider>
  )
}

export default App
