import type { ProfileView } from './profile.types'
import { request } from '../../shared/api/client'

export const profileApi = {
  /** Your own page. The server scopes this to the session. */
  getMine: () => request<ProfileView>('/profile/me'),

  /** Someone else's — allowed only for your reporting line, or as an admin. */
  getOne: (employeeId: number) => request<ProfileView>(`/profile/${employeeId}`),
}
