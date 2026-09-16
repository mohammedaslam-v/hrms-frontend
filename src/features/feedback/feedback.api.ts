import { request } from '../../shared/api/client'
import type { FeedbackRecord, FeedbackVisibility } from './feedback.types'

export interface AddFeedbackPayload {
  body: string
  visibility: FeedbackVisibility
}

export const feedbackApi = {
  add: (employeeId: number, payload: AddFeedbackPayload) =>
    request<FeedbackRecord[]>(`/feedback/${employeeId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  delete: (feedbackId: number) =>
    request<FeedbackRecord[]>(`/feedback/${feedbackId}`, {
      method: 'DELETE',
    }),
}
