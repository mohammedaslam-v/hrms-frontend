import type { TodayView, WeekBar } from './attendance.types'
import { request } from '../../api/client'

/**
 * Attendance is always your own — there is no id in any of these paths, because
 * a record only means anything if the person made it themselves.
 */
export const attendanceApi = {
  getToday: () => request<TodayView>('/attendance/me/today'),
  getWeek: () => request<WeekBar[]>('/attendance/me/week'),
  checkIn: () => request<TodayView>('/attendance/me/check-in', { method: 'POST' }),
  checkOut: () => request<TodayView>('/attendance/me/check-out', { method: 'POST' }),
}
