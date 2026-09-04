import type { ReactNode } from 'react'
import type { AccessTier } from '../types/auth'

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

const svg = (paths: ReactNode) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {paths}
  </svg>
)

export const NAV_SECTIONS: NavSection[] = [
  {
    heading: 'Individual',
    tier: 'all',
    items: [
      {
        key: 'myleave',
        path: '/leave',
        label: 'My leave',
        tier: 'all',
        color: '#0FA968',
        built: true,
        icon: svg(
          <>
            <rect x="3" y="5" width="18" height="16" rx="3.2" />
            <path d="M3 10h18M8 3v4M16 3v4M8.8 15.2l2.2 2.2 4.2-4.2" />
          </>,
        ),
      },
      {
        key: 'mygoals',
        path: '/goals',
        label: 'My goals',
        tier: 'all',
        color: '#DD8B08',
        icon: svg(
          <>
            <circle cx="12" cy="12" r="8.6" />
            <circle cx="12" cy="12" r="4.6" />
            <circle cx="12" cy="12" r=".9" fill="currentColor" />
          </>,
        ),
      },
      {
        key: 'mypay',
        path: '/pay',
        label: 'My salary & payslips',
        tier: 'all',
        color: '#0C8CD4',
        icon: svg(
          <>
            <path d="M20 8.5V6.6A2.6 2.6 0 0 0 17.4 4H6.6A2.6 2.6 0 0 0 4 6.6v10.8A2.6 2.6 0 0 0 6.6 20h10.8a2.6 2.6 0 0 0 2.6-2.6V15.5" />
            <path d="M21.2 8.5h-4.4a3.5 3.5 0 0 0 0 7h4.4z" />
          </>,
        ),
      },
      {
        key: 'mytax',
        path: '/tax',
        label: 'My tax & TDS',
        tier: 'all',
        color: '#DC3E43',
        icon: svg(
          <>
            <path d="M19 5L5 19" />
            <circle cx="7.6" cy="7.6" r="2.6" />
            <circle cx="16.4" cy="16.4" r="2.6" />
          </>,
        ),
      },
      {
        key: 'me',
        path: '/me',
        label: 'My page',
        tier: 'all',
        color: '#EC4899',
        icon: svg(
          <>
            <circle cx="12" cy="8.2" r="3.7" />
            <path d="M4.6 20a7.4 7.4 0 0 1 14.8 0" />
          </>,
        ),
      },
    ],
  },
  {
    heading: 'Manager access',
    tier: 'mgr',
    items: [
      {
        key: 'team',
        path: '/team',
        label: 'Team directory',
        tier: 'mgr',
        color: '#E8467C',
        icon: svg(
          <>
            <path d="M16 19.5v-1.6a4 4 0 0 0-4-4H6.5a4 4 0 0 0-4 4v1.6" />
            <circle cx="9.2" cy="7.2" r="3.3" />
            <path d="M17.2 13.9a4 4 0 0 1 3 3.9v1.7" />
            <path d="M15.6 4.3a3.3 3.3 0 0 1 0 5.9" />
          </>,
        ),
      },
      {
        key: 'att',
        path: '/attendance',
        label: 'Attendance & activity',
        tier: 'mgr',
        color: '#EA6A18',
        icon: svg(
          <>
            <circle cx="12" cy="12" r="8.6" />
            <path d="M12 7.2V12l3.2 1.9" />
          </>,
        ),
      },
      {
        key: 'leave',
        path: '/approvals',
        label: 'Leave approvals',
        tier: 'mgr',
        color: '#6D53F0',
        built: true,
        icon: svg(
          <>
            <rect x="3" y="5" width="18" height="16" rx="3.2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </>,
        ),
      },
      {
        key: 'teamgoals',
        path: '/team-goals',
        label: 'Team goals',
        tier: 'mgr',
        color: '#DD8B08',
        icon: svg(
          <>
            <path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3" />
            <circle cx="12" cy="12" r="5.2" />
            <circle cx="12" cy="12" r="1" fill="currentColor" />
          </>,
        ),
      },
      {
        key: 'reports',
        path: '/reports',
        label: 'Reports centre',
        tier: 'mgr',
        color: '#4F46E5',
        icon: svg(
          <>
            <path d="M4 20h16" />
            <rect x="5" y="10.5" width="3.6" height="6.5" rx="1.2" />
            <rect x="10.2" y="6.5" width="3.6" height="10.5" rx="1.2" />
            <rect x="15.4" y="13" width="3.6" height="4" rx="1.2" />
          </>,
        ),
      },
    ],
  },
  {
    heading: 'Admin access',
    tier: 'adm',
    items: [
      {
        key: 'dash',
        path: '/dashboard',
        label: 'Dashboard',
        tier: 'adm',
        color: '#2563EB',
        icon: svg(
          <>
            <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
            <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
            <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
            <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
          </>,
        ),
      },
      {
        key: 'add',
        path: '/employees/new',
        label: 'Add employee',
        tier: 'adm',
        color: '#0E9C93',
        icon: svg(
          <>
            <path d="M14.5 19.5v-1.6a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1.6" />
            <circle cx="8.2" cy="7.2" r="3.3" />
            <path d="M18.5 7.5v6M15.5 10.5h6" />
          </>,
        ),
      },
      {
        key: 'payroll',
        path: '/payroll',
        label: 'Payroll register',
        tier: 'adm',
        color: '#0C8CD4',
        icon: svg(
          <>
            <rect x="2.5" y="5.5" width="19" height="13" rx="2.6" />
            <circle cx="12" cy="12" r="2.7" />
            <path d="M6 9.6v4.8M18 9.6v4.8" />
          </>,
        ),
      },
      {
        key: 'alltax',
        path: '/tax-register',
        label: 'Company TDS register',
        tier: 'adm',
        color: '#DC3E43',
        icon: svg(
          <>
            <path d="M7 3.5h10a2 2 0 0 1 2 2v15l-3-2-2 2-2-2-2 2-2-2-3 2v-15a2 2 0 0 1 2-2z" />
            <path d="M9.5 8.5h5M9.5 12h5" />
          </>,
        ),
      },
    ],
  },
]

export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items)

export const TIER_NAME: Record<NavTier, string> = {
  all: 'Individual',
  mgr: 'Manager access',
  adm: 'Admin access',
}

/**
 * Tiers stack, so a manager page opens for a manager or an admin.
 * This is navigation gating only — the API enforces the same rules again.
 */
export const canAccess = (tier: NavTier, held: AccessTier[]): boolean => {
  if (tier === 'all') return true
  if (tier === 'mgr') return held.includes('manager') || held.includes('admin')
  return held.includes('admin')
}

/** Nobody should land on a page their access level padlocks. */
export const homePathFor = (defaultTier: AccessTier): string => {
  if (defaultTier === 'admin') return '/dashboard'
  if (defaultTier === 'manager') return '/team'
  return '/me'
}
