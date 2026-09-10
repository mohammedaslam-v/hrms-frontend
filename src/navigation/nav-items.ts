/**
 * The navigation itself: every destination in the portal, in rail order.
 *
 * One list, read by three things — the rail draws it, the router builds a route
 * per entry, and `PageHero` looks up a page's icon and colour here so the square
 * at the top of a screen can never drift from the button you clicked to reach it.
 *
 * Adding a page means adding a line here. Nothing else needs to know.
 */

import type { ReactNode } from 'react'
import * as icon from './icons'

/**
 * Which access tier a page sits under. Mirrors the prototype's TIER map:
 * `all` = every signed-in person · `mgr` = manager and admin · `adm` = admin only.
 */
export type NavTier = 'all' | 'mgr' | 'adm'

export interface NavItem {
  key: string
  path: string
  label: string
  tier: NavTier
  /** Accent colour for the icon tile, taken from the approved design. */
  color: string
  icon: ReactNode
  /** Set once the page exists; everything else renders a placeholder. */
  built?: boolean
}

export interface NavSection {
  heading: string
  tier: NavTier
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    heading: 'Individual',
    tier: 'all',
    items: [
      { key: 'myleave', path: '/leave', label: 'My leave', tier: 'all', color: '#0FA968', built: true, icon: icon.calendarTick },
      { key: 'mygoals', path: '/goals', label: 'My goals', tier: 'all', color: '#DD8B08', icon: icon.target },
      { key: 'mypay', path: '/pay', label: 'My salary & payslips', tier: 'all', color: '#0C8CD4', icon: icon.wallet },
      { key: 'mytax', path: '/tax', label: 'My tax & TDS', tier: 'all', color: '#DC3E43', icon: icon.percent },
      { key: 'me', path: '/me', label: 'My page', tier: 'all', color: '#EC4899', icon: icon.person },
    ],
  },
  {
    heading: 'Manager access',
    tier: 'mgr',
    items: [
      { key: 'team', path: '/team', label: 'Team directory', tier: 'mgr', color: '#E8467C', icon: icon.people },
      { key: 'att', path: '/attendance', label: 'Attendance & activity', tier: 'mgr', color: '#EA6A18', icon: icon.clock },
      { key: 'leave', path: '/approvals', label: 'Leave approvals', tier: 'mgr', color: '#6D53F0', built: true, icon: icon.calendar },
      { key: 'teamgoals', path: '/team-goals', label: 'Team goals', tier: 'mgr', color: '#DD8B08', icon: icon.crosshair },
      { key: 'reports', path: '/reports', label: 'Reports centre', tier: 'mgr', color: '#4F46E5', icon: icon.barChart },
    ],
  },
  {
    heading: 'Admin access',
    tier: 'adm',
    items: [
      { key: 'dash', path: '/dashboard', label: 'Dashboard', tier: 'adm', color: '#2563EB', icon: icon.tiles },
      { key: 'add', path: '/employees/new', label: 'Add employee', tier: 'adm', color: '#0E9C93', icon: icon.personPlus },
      { key: 'payroll', path: '/payroll', label: 'Payroll register', tier: 'adm', color: '#0C8CD4', icon: icon.banknote },
      { key: 'alltax', path: '/tax-register', label: 'Company TDS register', tier: 'adm', color: '#DC3E43', icon: icon.receipt },
    ],
  },
]

export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items)

export const TIER_NAME: Record<NavTier, string> = {
  all: 'Individual',
  mgr: 'Manager access',
  adm: 'Admin access',
}
