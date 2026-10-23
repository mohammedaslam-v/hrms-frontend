import { request } from '../../shared/api/client'
import type { AdminPanelActivity, PresenceBoard, PresenceSummary } from './presence.types'

export const presenceApi = {
  /** Who is on the new admin panel — the whole company, for every viewer. */
  online: () => request<PresenceSummary>('/presence/online'),

  /** The closed pill's number — one COUNT on the server. */
  count: () => request<{ online: number }>('/presence/count'),

  /** The open dropdown: everyone in scope, grouped by shift. */
  board: () => request<PresenceBoard>('/presence/board'),

  /** Time on the admin panel per day. Omit employeeId for your own. */
  days: (from: string, to: string, employeeId?: number) => {
    const q = new URLSearchParams({ from, to })
    if (employeeId) q.set('employeeId', String(employeeId))
    return request<AdminPanelActivity>(`/presence/days?${q.toString()}`)
  },
}
