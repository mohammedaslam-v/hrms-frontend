import { Fragment } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { NAV_SECTIONS, TIER_NAME, type NavItem } from '../navigation/nav-items'
import { canAccess } from '../navigation/access'
import { useAuth } from '../app/auth-context'

interface RailProps {
  /** Unread counts keyed by nav key — wired to real endpoints as pages land. */
  badges?: Record<string, number>
  onLocked: (item: NavItem) => void
}

/**
 * The icon rail: 60px collapsed, expanding to 232px on hover or keyboard focus.
 *
 * Locked modules stay visible behind a padlock rather than disappearing, so staff
 * can see a feature exists and ask for access instead of assuming it does not.
 */
export function Rail({ badges = {}, onLocked }: RailProps) {
  const { employee } = useAuth()
  const tiers = employee.tiers
  const navigate = useNavigate()

  const renderItem = (item: NavItem) => {
    const allowed = canAccess(item.tier, tiers)
    const count = badges[item.key] ?? 0

    const inner = (
      <>
        <span className="ic">{item.icon}</span>
        <span className="lb">{item.label}</span>
        {count > 0 && (
          <>
            <span className="pill">{count}</span>
            <span className="dotmark" />
          </>
        )}
      </>
    )

    if (!allowed) {
      return (
        <button
          key={item.key}
          type="button"
          className="rail-btn locked"
          style={{ '--c': item.color } as React.CSSProperties}
          onClick={() => onLocked(item)}
          title={`${item.label} — ${TIER_NAME[item.tier]}`}
        >
          {inner}
        </button>
      )
    }

    return (
      <NavLink
        key={item.key}
        to={item.path}
        className={({ isActive }) => `rail-btn${isActive ? ' active' : ''}`}
        style={{ '--c': item.color } as React.CSSProperties}
        title={item.label}
        onClick={(e) => {
          // Keeps keyboard and mouse behaviour identical for the placeholder pages.
          if (e.metaKey || e.ctrlKey) return
          navigate(item.path)
        }}
      >
        {inner}
      </NavLink>
    )
  }

  return (
    <nav className="rail" aria-label="Main">
      <div className="logo">b</div>

      {NAV_SECTIONS.map((section) => {
        // The heading dims when the whole group is out of reach.
        const sectionOpen = canAccess(section.tier, tiers)
        return (
          // A fragment, not a wrapper element: on narrow screens the rail becomes
          // a horizontal strip, and a block-level wrapper per section would stack
          // the icons instead of letting them flow in one row.
          <Fragment key={section.heading}>
            <div className={`rail-sec${sectionOpen ? '' : ' dim'}`}>{section.heading}</div>
            {section.items.map(renderItem)}
          </Fragment>
        )
      })}

      <div className="rail-spacer" />
    </nav>
  )
}
