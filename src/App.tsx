import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { authApi } from './api/auth'
import { AppShell } from './components/AppShell'
import { ChangePasswordForm } from './components/ChangePasswordForm'
import { LeaveApprovalsPage } from './components/LeaveApprovalsPage'
import { LoginPage } from './components/LoginPage'
import { MyLeavePage } from './components/MyLeavePage'
import { MyPage } from './components/MyPage'
import { PlaceholderPage } from './components/PlaceholderPage'
import { ALL_NAV_ITEMS, canAccess, homePathFor } from './nav/navigation'
import type { AuthenticatedEmployee } from './types/auth'

type Status = 'booting' | 'signed-out' | 'signed-in'

function App() {
  const [status, setStatus] = useState<Status>('booting')
  const [employee, setEmployee] = useState<AuthenticatedEmployee | null>(null)
  const [changingPassword, setChangingPassword] = useState(false)

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

  const signOut = useCallback(async () => {
    await authApi.logout()
    setEmployee(null)
    setChangingPassword(false)
    setStatus('signed-out')
  }, [])

  if (status === 'booting') return <div className="boot">Loading…</div>

  if (status === 'signed-out' || !employee) {
    return <LoginPage onSignedIn={handleSignedIn} />
  }

  const home = homePathFor(employee.defaultTier)

  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <AppShell
              employee={employee}
              onSignOut={() => void signOut()}
              onChangePassword={() => setChangingPassword(true)}
            />
          }
        >
          {/* Land on the highest tier's home rather than a padlocked screen. */}
          <Route index element={<Navigate to={home} replace />} />

          {ALL_NAV_ITEMS.map((item) => (
            <Route
              key={item.key}
              path={item.path}
              element={
                // Routes are gated as well as the rail — typing a URL is not a way in.
                // The API enforces the same rules again; this is only convenience.
                !canAccess(item.tier, employee.tiers) ? (
                  <Navigate to={home} replace />
                ) : changingPassword ? (
                  <ChangePasswordPanel
                    onDone={() => void signOut()}
                    onCancel={() => setChangingPassword(false)}
                  />
                ) : item.key === 'myleave' ? (
                  <MyLeavePage />
                ) : item.key === 'leave' ? (
                  <LeaveApprovalsPage />
                ) : item.key === 'me' ? (
                  <MyPage />
                ) : (
                  <PlaceholderPage item={item} />
                )
              }
            />
          ))}

          {/* The same page for a team member. Who may open it is decided by the
              API against the reporting tree, so there is no tier gate here. */}
          <Route path="/me/:id" element={<MyPage />} />

          <Route path="*" element={<Navigate to={home} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function ChangePasswordPanel({
  onDone,
  onCancel,
}: {
  onDone: () => void
  onCancel: () => void
}) {
  return (
    <div className="page narrow">
      <div className="card">
        <h3>Change password</h3>
        {/* Every session is revoked server-side, so there is nothing to keep. */}
        <ChangePasswordForm onChanged={onDone} onCancel={onCancel} />
      </div>
    </div>
  )
}

export default App
