import { TIER_NAME, type NavItem } from '../../navigation/nav-items'

/**
 * Stands in for a nav destination that is routed and permitted but not yet built,
 * so the rail can be exercised in full without dead links.
 */
export function PlaceholderPage({ item }: { item: NavItem }) {
  return (
    <div className="page">
      <div className="hero">
        <div className="hero-icon" style={{ background: item.color }}>
          {item.icon}
        </div>
        <div className="hero-txt">
          <h2>{item.label}</h2>
          <div className="eyebrow">{TIER_NAME[item.tier]}</div>
        </div>
      </div>

      <div className="card">
        <div className="empty">
          <b>Not built yet</b>
          This page is routed and your access level allows it — the screen itself is still to come.
        </div>
      </div>
    </div>
  )
}
