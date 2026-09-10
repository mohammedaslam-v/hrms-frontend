/**
 * Who is signed in, and what they may reach.
 *
 * This sits in `shared/` rather than in `features/auth/` on purpose. Auth is only
 * what *produces* a session; navigation, the layouts and the router all *consume*
 * one. Putting the type inside the auth feature would make the rail and the shell
 * depend on a feature, which is the dependency the boundary rule exists to stop.
 */

/** Tiers stack: everyone is an employee, anyone with reports is also a manager. */
export type AccessTier = 'employee' | 'manager' | 'admin'

export interface AuthenticatedEmployee {
  id: number
  employeeCode: string
  fullName: string
  workEmail: string
  department: string | null
  designation: string | null
  dateOfJoining: string
  tiers: AccessTier[]
  defaultTier: AccessTier
}

export const TIER_LABEL: Record<AccessTier, string> = {
  employee: 'Individual',
  manager: 'Manager access',
  admin: 'Admin access',
}
