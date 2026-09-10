/**
 * Who may reach what.
 *
 * Navigation gating only. The API applies the same rules again on every request,
 * so nothing here is a security boundary — it exists so that people are not shown
 * doors that will not open, and so that typing a URL is not a way in either.
 */

import type { AccessTier } from '../shared/types/session'
import type { NavTier } from './nav-items'

/** Tiers stack, so a manager page opens for a manager or an admin. */
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
