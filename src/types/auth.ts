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

export interface SessionResponse {
  employee: AuthenticatedEmployee
  accessToken: string
  accessTokenExpiresAt: string
}

/** Returned by the password step and by forgot-password. Never a session. */
export interface OtpChallenge {
  challengeId: string
  sentTo: string
  expiresAt: string
  resendAvailableAt: string
}

export const TIER_LABEL: Record<AccessTier, string> = {
  employee: 'Individual',
  manager: 'Manager access',
  admin: 'Admin access',
}
