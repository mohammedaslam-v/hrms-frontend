import type { AuthenticatedEmployee } from '../../shared/types/session'

/** What the sign-in endpoints return. The session model itself is in `shared/types/session`. */
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
