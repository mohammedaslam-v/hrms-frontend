import { request } from '../../shared/api/client'
import type { AdminPanelActivity, PresenceSummary } from './presence.types'

export const presenceApi = {
  /**
   * Who is on the new admin panel. No id to pass: the server narrows it to you,
   * your team, or everyone, from your tiers.
   */
  online: () => request<PresenceSummary>('/presence/online'),

  /** Time on the admin panel per day. Omit employeeId for your own. */
  days: (from: string, to: string, employeeId?: number) => {
    const q = new URLSearchParams({ from, to })
    if (employeeId) q.set('employeeId', String(employeeId))
    return request<AdminPanelActivity>(`/presence/days?${q.toString()}`)
  },
}
