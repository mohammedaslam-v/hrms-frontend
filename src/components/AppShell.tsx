import { useEffect, useRef, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { TIER_NAME, type NavItem } from '../nav/navigation'
import { TIER_LABEL, type AuthenticatedEmployee } from '../types/auth'
import { Toast, type ToastMessage } from './Toast'
import { Rail } from './Rail'

interface AppShellProps {
  employee: AuthenticatedEmployee
  onSignOut: () => void
  onChangePassword: () => void
}

const initials = (name: string): string =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

export function AppShell({ employee, onSignOut, onChangePassword }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)
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
      <Rail tiers={employee.tiers} onLocked={handleLocked} />

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
                      onChangePassword()
                    }}
                  >
                    Change password
                  </button>
                  <button className="menu-item" role="menuitem" onClick={onSignOut}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="main">
          <Outlet />
        </main>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
