import type {
  AttendanceRangeDto,
  PunctualitySummaryDto,
  TodayBoardDto,
  TodayView,
  WeekBar,
} from './attendance.types'
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

  /** Manager / Admin attendance dashboard & reports */
  getTodayBoard: () => request<TodayBoardDto>('/attendance/today-board'),

  getRange: (params: {
    from: string
    to: string
    employeeId?: number
    department?: string
    status?: string
  }) => {
    const q = new URLSearchParams()
    q.set('from', params.from)
    q.set('to', params.to)
    if (params.employeeId) q.set('employeeId', String(params.employeeId))
    if (params.department) q.set('department', params.department)
    if (params.status) q.set('status', params.status)
    return request<AttendanceRangeDto>(`/attendance/range?${q.toString()}`)
  },

  getSummary: (params: { from: string; to: string; department?: string }) => {
    const q = new URLSearchParams()
    q.set('from', params.from)
    q.set('to', params.to)
    if (params.department) q.set('department', params.department)
    return request<PunctualitySummaryDto>(`/attendance/summary?${q.toString()}`)
  },
}
