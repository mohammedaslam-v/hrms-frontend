import { request } from '../../../shared/api/client'
import type {
  AdminLoansView,
  CloseLoanPayload,
  CreateLoanPayload,
  EmployeeLoansView,
  LoanMetaDto,
} from '../types/loans.types'

export const loansApi = {
  getAdminMeta: () => request<LoanMetaDto>('/loans/admin/meta'),

  getAdminLoans: (status?: string) => {
    const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : ''
    return request<AdminLoansView>(`/loans/admin${query}`)
  },

  createLoan: (payload: CreateLoanPayload) =>
    request<{ id: number }>('/loans/admin', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  closeLoan: (id: number, payload: CloseLoanPayload) =>
    request<{ success: boolean; message: string }>(`/loans/admin/${id}/close`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMyLoans: () => request<EmployeeLoansView>('/loans/mine'),

  getEmployeeLoans: (employeeId: number) =>
    request<EmployeeLoansView>(`/loans/employee/${employeeId}`),
}
