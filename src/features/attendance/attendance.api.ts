import type { TodayView, WeekBar } from './attendance.types'
import { request } from '../../shared/api/client'

/**
 * Attendance is always your own — there is no id in any of these paths, because
 * a record only means anything if the person made it themselves.
 */
export const attendanceApi = {
  getToday: () => request<TodayView>('/attendance/me/today'),
  getWeek: () => request<WeekBar[]>('/attendance/me/week'),

  /**
   * Somebody else's day and week — for a manager or admin viewing a report.
   * Read only: there is no matching write, by design.
   */
  getTodayFor: (employeeId: number) => request<TodayView>(`/attendance/${employeeId}/today`),
  getWeekFor: (employeeId: number) => request<WeekBar[]>(`/attendance/${employeeId}/week`),
  checkIn: () => request<TodayView>('/attendance/me/check-in', { method: 'POST' }),
  checkOut: () => request<TodayView>('/attendance/me/check-out', { method: 'POST' }),
}
