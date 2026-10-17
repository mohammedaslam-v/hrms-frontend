import { request } from '../../shared/api/client'
import type { NewWorkActivity, WorkActivity, WorkActivityRange } from './work-activity.types'

export const workActivityApi = {
  /** Omit employeeId for your own. */
  list: (from: string, to: string, employeeId?: number) => {
    const q = new URLSearchParams({ from, to })
    if (employeeId) q.set('employeeId', String(employeeId))
    return request<WorkActivityRange>(`/work-activities?${q.toString()}`)
  },
  create: (activity: NewWorkActivity) =>
    request<WorkActivity>('/work-activities', { method: 'POST', body: JSON.stringify(activity) }),
  remove: (id: number) => request<void>(`/work-activities/${id}`, { method: 'DELETE' }),
}
