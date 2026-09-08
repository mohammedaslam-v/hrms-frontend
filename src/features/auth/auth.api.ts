import type { AuthenticatedEmployee, OtpChallenge, SessionResponse } from '../../types/auth'
import { request, setAccessToken } from '../../api/client'

const keepToken = (session: SessionResponse): SessionResponse => {
  setAccessToken(session.accessToken)
  return session
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, {
    method: 'POST',
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })

export const authApi = {
  /** Step one. A correct password returns a challenge, not a session. */
  login: (workEmail: string, password: string) =>
    post<OtpChallenge & { otpRequired: true }>('/auth/login', { workEmail, password }),

  /** Step two. The only call that signs anyone in. */
  verifyOtp: (challengeId: string, code: string) =>
    post<SessionResponse>('/auth/verify-otp', { challengeId, code }).then(keepToken),

  resendOtp: (challengeId: string) => post<OtpChallenge>('/auth/resend-otp', { challengeId }),

  forgotPassword: (workEmail: string) =>
    post<OtpChallenge>('/auth/forgot-password', { workEmail }),

  /** Checks the reset code without spending it, so the UI can gate the next screen. */
  verifyResetOtp: (challengeId: string, code: string) =>
    post<{ verified: true }>('/auth/verify-reset-otp', { challengeId, code }),

  resetPassword: (challengeId: string, code: string, newPassword: string) =>
    post<null>('/auth/reset-password', { challengeId, code, newPassword }),

  changePassword: (currentPassword: string, newPassword: string) =>
    post<null>('/auth/change-password', { currentPassword, newPassword }),

  /** Restores a session on page load from the httpOnly refresh cookie. */
  refresh: () => post<SessionResponse>('/auth/refresh').then(keepToken),

  me: () => request<{ employee: AuthenticatedEmployee }>('/auth/me'),

  logout: async () => {
    try {
      await post<null>('/auth/logout')
    } finally {
      setAccessToken(null)
    }
  },
}
