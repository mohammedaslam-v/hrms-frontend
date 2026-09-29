import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../app/auth-context'
import * as icon from '../navigation/icons'

interface MobileBottomNavProps {
  onOpenMenu: () => void
  isMenuOpen: boolean
  badges?: Record<string, number>
}

export function MobileBottomNav({
  onOpenMenu,
  isMenuOpen,
  badges = {},
}: MobileBottomNavProps) {
  const { employee } = useAuth()
  const location = useLocation()
  const defaultTier = employee.defaultTier

  // Determine the 4th contextual tab based on user's highest access tier
  const roleTab =
    defaultTier === 'admin'
      ? { path: '/payroll', label: 'Payroll', icon: icon.banknote, key: 'payroll' }
      : defaultTier === 'manager'
        ? { path: '/approvals', label: 'Approvals', icon: icon.calendar, key: 'leave' }
        : { path: '/pay', label: 'Salary', icon: icon.wallet, key: 'mypay' }

  const tabs = [
    { path: '/me', label: 'My page', icon: icon.person, key: 'me' },
    { path: '/leave', label: 'Leave', icon: icon.calendarTick, key: 'myleave' },
    { path: '/attendance', label: 'Attendance', icon: icon.clock, key: 'att' },
    roleTab,
  ]

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {tabs.map((tab) => {
        const isActive =
          location.pathname === tab.path ||
          (tab.path !== '/' && location.pathname.startsWith(`${tab.path}/`))
        const count = badges[tab.key] ?? 0

        return (
          <NavLink
            key={tab.key}
            to={tab.path}
            className={`mobile-tab${isActive && !isMenuOpen ? ' active' : ''}`}
          >
            <div className="mobile-tab-ic-wrap">
              <span className="mobile-tab-ic">{tab.icon}</span>
              {count > 0 && <span className="mobile-tab-badge">{count}</span>}
            </div>
            <span className="mobile-tab-lb">{tab.label}</span>
          </NavLink>
        )
      })}

      {/* 5th Tab: Menu Button toggles Drawer */}
      <button
        type="button"
        className={`mobile-tab${isMenuOpen ? ' active' : ''}`}
        onClick={onOpenMenu}
        aria-label="More navigation options"
      >
        <div className="mobile-tab-ic-wrap">
          <span className="mobile-tab-ic">{icon.menu}</span>
        </div>
        <span className="mobile-tab-lb">More</span>
      </button>
    </nav>
  )
}
