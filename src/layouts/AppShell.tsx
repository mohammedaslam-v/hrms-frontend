import { useEffect, useRef, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Rail } from './Rail'
import { useAuth } from '../app/auth-context'
import { TIER_NAME, type NavItem } from '../navigation/nav-items'
import { TIER_LABEL } from '../shared/types/session'
import { Toast, type ToastMessage } from '../shared/ui/Toast'
import { ChangePasswordForm } from '../features/auth'
import { initials } from '../shared/lib/format'

/**
 * The frame every signed-in screen sits in: the rail down the left, the top bar,
 * and the routed page in the middle.
 *
 * It reads the session from context rather than taking it as a prop, so a new
 * screen that needs to know who is looking does not have to be threaded through
 * here first.
 */
export function AppShell() {
  const { employee, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Click-away and Escape both close the profile menu.
  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const handleLocked = (item: NavItem) => {
    setToast({
      text: `${item.label} sits under ${TIER_NAME[item.tier].toLowerCase()}. Ask HR if you need it.`,
      tone: 'bad',
    })
  }

  return (
    <div className="app">
      <Rail onLocked={handleLocked} />

      <div className="shell">
        <header className="topbar">
          <span className="chev">›</span>
          <h1 className="tb-title">bambinos. HRMS</h1>

          <div className="tb-right">
            <span className="chip c-all nodot">{TIER_LABEL[employee.defaultTier]}</span>
            <div className="tb-menu" ref={menuRef}>
              <button
                className="me-btn"
                onClick={() => setMenuOpen((open) => !open)}
                title={employee.fullName}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {initials(employee.fullName)}
              </button>

              {menuOpen && (
                <div className="menu" role="menu">
                  <div className="menu-who">
                    <b>{employee.fullName}</b>
                    <span>{employee.workEmail}</span>
                  </div>
                  <button
                    className="menu-item"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false)
                      navigate('/me')
                    }}
                  >
                    My page
                  </button>
                  <button
                    className="menu-item"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false)
                      setChangingPassword(true)
                    }}
                  >
                    Change password
                  </button>
                  <button className="menu-item" role="menuitem" onClick={signOut}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Changing a password takes over the page area rather than opening a
            dialog, because succeeding at it ends the session — there would be
            nothing left underneath to return to. */}
        <main className="main">
          {changingPassword ? (
            <div className="page narrow">
              <div className="card">
                <h3>Change password</h3>
                {/* Every session is revoked server-side, so there is nothing to keep. */}
                <ChangePasswordForm
                  onChanged={signOut}
                  onCancel={() => setChangingPassword(false)}
                />
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
