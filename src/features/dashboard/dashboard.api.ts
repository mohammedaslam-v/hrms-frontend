import { request } from '../../shared/api/client'
import type { DashboardView } from './dashboard.types'

export const dashboardApi = {
  /**
   * There is no scope parameter: the server decides what you may see from who
   * you are. A manager cannot widen it to the company by changing a URL.
   */
  get: () => request<DashboardView>('/dashboard'),
}
