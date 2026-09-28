import { request } from '../../shared/api/client'
import type { MyTaxResponse, TaxRegisterResponse } from './tax.types'

export const taxApi = {
  /**
   * Retrieves full tax and TDS computation view for self or for an authorized employee ID.
   */
  getMyTax: (employeeId?: number) => {
    const endpoint = employeeId ? `/tax/${employeeId}` : '/tax/me'
    return request<MyTaxResponse>(endpoint)
  },

  /**
   * Every employee's tax in one table. Admin only — enforced server-side, so
   * there is no id or scope to pass.
   */
  getCompanyRegister: () => request<TaxRegisterResponse>('/tax/register'),
}
