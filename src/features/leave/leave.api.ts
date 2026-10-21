import type {
  ApplyLeavePayload,
  ApprovalsView,
  DecisionResult,
  EditApprovedLeavePayload,
  EditApprovedResult,
  LeavePreview,
  LeaveType,
  MyLeaveView,
  OnLeaveEmployee,
} from './leave.types'
import { request } from '../../shared/api/client'

export const leaveApi = {
  getMine: () => request<MyLeaveView>('/leave/me'),

  /** Employees currently on approved leave today. */
  getOnLeaveToday: () => request<OnLeaveEmployee[]>('/leave/on-leave-today'),

  /** Get leave record for an employee in reporting line or as admin. */
  getForEmployee: (employeeId: number) =>
    request<MyLeaveView>(`/leave/${employeeId}`),

  /** Live feedback for the apply form — writes nothing. */
  preview: (
    from: string,
    to: string,
    type: LeaveType,
    halfDay: boolean,
    employeeId?: number,
    excludeRequestId?: number,
  ) => {
    const extra = excludeRequestId ? `&excludeRequestId=${excludeRequestId}` : ''
    const path = employeeId
      ? `/leave/${employeeId}/preview?from=${from}&to=${to}&type=${type}&halfDay=${halfDay}${extra}`
      : `/leave/me/preview?from=${from}&to=${to}&type=${type}&halfDay=${halfDay}${extra}`
    return request<LeavePreview>(path)
  },

  apply: (payload: ApplyLeavePayload, employeeId?: number) => {
    const path = employeeId ? `/leave/${employeeId}/requests` : '/leave/me/requests'
    return request<MyLeaveView>(path, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  cancel: (id: number, employeeId?: number) => {
    const path = employeeId
      ? `/leave/${employeeId}/requests/${id}/cancel`
      : `/leave/me/requests/${id}/cancel`
    return request<MyLeaveView>(path, { method: 'POST' })
  },
}

export const approvalsApi = {
  get: () => request<ApprovalsView>('/leave/approvals'),

  decide: (id: number, decision: 'Approved' | 'Rejected', note?: string) =>
    request<DecisionResult>(`/leave/approvals/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify({ decision, note }),
    }),

  editApproved: (id: number, payload: EditApprovedLeavePayload) =>
    request<EditApprovedResult>(`/leave/approvals/${id}/edit`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
}
