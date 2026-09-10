import type { ReactNode } from 'react'
import { ALL_NAV_ITEMS } from '../nav/navigation'

/**
 * The band at the top of every page: the module's coloured icon, its title, a
 * line of context, and any actions.
 *
 * The icon and colour are looked up from the rail's own definition rather than
 * repeated here — the design does the same thing for the same reason, so the
 * square at the top of a page can never drift from the button you clicked to
 * reach it.
 */
export function PageHero({
  navKey,
  title,
  eyebrow,
  children,
}: {
  /** Which rail entry this page belongs to, e.g. 'me' or 'myleave'. */
  navKey: string
  /** Overrides the rail's label — used where the page is about someone else. */
  title?: string
  eyebrow?: ReactNode
  children?: ReactNode
}) {
  const item = ALL_NAV_ITEMS.find((i) => i.key === navKey)

  return (
    <div className="hero">
      {item && (
        <div className="hero-icon" style={{ background: item.color }}>
          {item.icon}
        </div>
      )}
      <div className="hero-txt">
        <h2>{title ?? item?.label ?? ''}</h2>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      </div>
      {children && <div className="hero-actions">{children}</div>}
    </div>
  )
}
