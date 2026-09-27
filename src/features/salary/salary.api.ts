import { request } from '../../shared/api/client'
import type { MySalaryView } from './salary.types'

export const salaryApi = {
  /**
   * Retrieves full salary view (active slip, annual structure, payslip history, loan status)
   * for either self or for an authorized subordinate/employee ID.
   */
  getMySalary: (month?: string, employeeId?: number) => {
    const params = month ? `?month=${encodeURIComponent(month)}` : ''
    const endpoint = employeeId ? `/salary/${employeeId}${params}` : `/salary/me${params}`
    return request<MySalaryView>(endpoint)
  },
}
