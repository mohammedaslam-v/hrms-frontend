import { useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { NAV_SECTIONS, TIER_NAME, type NavItem } from '../navigation/nav-items'
import { canAccess } from '../navigation/access'
import { useAuth } from '../app/auth-context'
import { TIER_LABEL } from '../shared/types/session'
import { initials } from '../shared/lib/format'
import * as icon from '../navigation/icons'

interface MobileNavDrawerProps {
  open: boolean
  onClose: () => void
  badges?: Record<string, number>
  onLocked: (item: NavItem) => void
}

export function MobileNavDrawer({
  open,
  onClose,
  badges = {},
  onLocked,
}: MobileNavDrawerProps) {
  const { employee, signOut } = useAuth()
  const tiers = employee.tiers
  const navigate = useNavigate()
  const location = useLocation()

  // Close drawer automatically on route change
  useEffect(() => {
    onClose()
  }, [location.pathname])

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  // Track if we are currently looking at a team member's page
  const employeeMatch = location.pathname.match(/^\/(me|leave|pay)\/(\d+)/)
  const activeEmployeeId = employeeMatch ? employeeMatch[2] : null

  return (
    <div className="mobile-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="mobile-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="mobile-drawer-header">
          <div className="mobile-drawer-brand">
            <div className="mobile-logo-mark">b</div>
            <div className="mobile-brand-text">
              <span className="mobile-brand-title">bambinos.</span>
              <span className="mobile-brand-subtitle">HRMS PORTAL</span>
            </div>
          </div>
          <button
            type="button"
            className="mobile-drawer-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            {icon.close}
          </button>
        </div>

        {/* User Card */}
        <div className="mobile-drawer-user">
          <div className="mobile-user-avatar">
            {initials(employee.fullName)}
          </div>
          <div className="mobile-user-details">
            <div className="mobile-user-name">{employee.fullName}</div>
            <div className="mobile-user-email">{employee.workEmail}</div>
            <span className="chip c-all nodot sm">{TIER_LABEL[employee.defaultTier]}</span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="mobile-drawer-content">
          {NAV_SECTIONS.map((section) => {
            const sectionOpen = canAccess(section.tier, tiers)

            return (
              <div key={section.heading} className="mobile-nav-group">
                <div className={`mobile-nav-heading${sectionOpen ? '' : ' dim'}`}>
                  {section.heading}
                </div>

                <div className="mobile-nav-items">
                  {section.items.map((item) => {
                    const allowed = canAccess(item.tier, tiers)
                    const count = badges[item.key] ?? 0

                    const targetPath =
                      activeEmployeeId && item.key === 'myleave'
                        ? `/leave/${activeEmployeeId}`
                        : activeEmployeeId && item.key === 'me'
                          ? `/me/${activeEmployeeId}`
                          : activeEmployeeId && item.key === 'mypay'
                            ? `/pay/${activeEmployeeId}`
                            : item.path

                    const isActive =
                      activeEmployeeId && item.key === 'myleave'
                        ? location.pathname === `/leave/${activeEmployeeId}`
                        : activeEmployeeId && item.key === 'me'
                          ? location.pathname === `/me/${activeEmployeeId}`
                          : activeEmployeeId && item.key === 'mypay'
                            ? location.pathname === `/pay/${activeEmployeeId}`
                            : location.pathname === item.path

                    if (!allowed) {
                      return (
                        <button
                          key={item.key}
                          type="button"
                          className="mobile-nav-link locked"
                          style={{ '--c': item.color } as React.CSSProperties}
                          onClick={() => {
                            onClose()
                            onLocked(item)
                          }}
                          title={`${item.label} — ${TIER_NAME[item.tier]}`}
                        >
                          <span className="mobile-nav-ic">{item.icon}</span>
                          <span className="mobile-nav-lb">{item.label}</span>
                          <span className="mobile-nav-padlock">🔒</span>
                        </button>
                      )
                    }

                    return (
                      <NavLink
                        key={item.key}
                        to={targetPath}
                        className={`mobile-nav-link${isActive ? ' active' : ''}`}
                        style={{ '--c': item.color } as React.CSSProperties}
                        onClick={(e) => {
                          if (e.metaKey || e.ctrlKey) return
                          e.preventDefault()
                          onClose()
                          navigate(targetPath)
                        }}
                      >
                        <span className="mobile-nav-ic">{item.icon}</span>
                        <span className="mobile-nav-lb">{item.label}</span>
                        {count > 0 && <span className="mobile-nav-pill">{count}</span>}
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Drawer Footer with Sign Out */}
        <div className="mobile-drawer-footer">
          <button
            type="button"
            className="mobile-signout-btn"
            onClick={() => {
              onClose()
              signOut()
            }}
          >
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  )
}
