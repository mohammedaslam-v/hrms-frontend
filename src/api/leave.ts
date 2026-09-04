import type {
  ApplyLeavePayload,
  ApprovalsView,
  DecisionResult,
  LeavePreview,
  LeaveType,
  MyLeaveView,
} from '../types/leave'
import { request } from './client'

export const leaveApi = {
  getMine: () => request<MyLeaveView>('/leave/me'),

  /** Live feedback for the apply form — writes nothing. */
  preview: (from: string, to: string, type: LeaveType, halfDay: boolean) =>
    request<LeavePreview>(
      `/leave/me/preview?from=${from}&to=${to}&type=${type}&halfDay=${halfDay}`,
    ),

  apply: (payload: ApplyLeavePayload) =>
    request<MyLeaveView>('/leave/me/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  cancel: (id: number) =>
    request<MyLeaveView>(`/leave/me/requests/${id}/cancel`, { method: 'POST' }),
}

export const approvalsApi = {
  get: () => request<ApprovalsView>('/leave/approvals'),

  decide: (id: number, decision: 'Approved' | 'Rejected', note?: string) =>
    request<DecisionResult>(`/leave/approvals/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify({ decision, note }),
    }),
}
