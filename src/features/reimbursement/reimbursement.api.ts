import { fetchBlob, request } from '../../shared/api/client'
import type {
  AdminReimbursementsView,
  ApproveReimbursementPayload,
  CreateReimbursementPayload,
  EmployeeReimbursementsView,
  MarkPaidPayload,
  ReimbursementItem,
  RejectReimbursementPayload,
} from './reimbursement.types'

export const reimbursementApi = {
  getMyReimbursements: () => {
    return request<EmployeeReimbursementsView>('/reimbursements/mine')
  },

  createReimbursement: (payload: CreateReimbursementPayload) => {
    return request<ReimbursementItem>('/reimbursements', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  cancelClaim: (id: number) => {
    return request<{ success: boolean; message: string }>(
      '/reimbursements/' + id,
      { method: 'DELETE' },
    )
  },

  getReceiptBlob: (id: number) => {
    return fetchBlob('/reimbursements/' + id + '/receipt')
  },

  getAllForAdmin: (status?: string) => {
    const query = status && status !== 'All' ? '?status=' + encodeURIComponent(status) : ''
    return request<AdminReimbursementsView>('/reimbursements/admin/all' + query)
  },

  approveClaim: (id: number, payload: ApproveReimbursementPayload) => {
    return request<{ success: boolean; message: string }>(
      '/reimbursements/admin/' + id + '/approve',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    )
  },

  rejectClaim: (id: number, payload: RejectReimbursementPayload) => {
    return request<{ success: boolean; message: string }>(
      '/reimbursements/admin/' + id + '/reject',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    )
  },

  markPaid: (id: number, payload: MarkPaidPayload) => {
    return request<{ success: boolean; message: string }>(
      '/reimbursements/admin/' + id + '/pay',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    )
  },
}
