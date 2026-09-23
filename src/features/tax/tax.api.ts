import { request } from '../../shared/api/client'
import type { MyTaxResponse } from './tax.types'

export const taxApi = {
  /**
   * Retrieves full tax and TDS computation view for self or for an authorized employee ID.
   */
  getMyTax: (employeeId?: number) => {
    const endpoint = employeeId ? `/tax/${employeeId}` : '/tax/me'
    return request<MyTaxResponse>(endpoint)
  },
}
