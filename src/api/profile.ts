import type { ProfileView } from '../types/profile'
import { request } from './client'

export const profileApi = {
  /** Your own page. The server scopes this to the session. */
  getMine: () => request<ProfileView>('/profile/me'),

  /** Someone else's — allowed only for your reporting line, or as an admin. */
  getOne: (employeeId: number) => request<ProfileView>(`/profile/${employeeId}`),
}
