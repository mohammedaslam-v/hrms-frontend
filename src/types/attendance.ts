export type AttendanceStatus =
  | 'On time'
  | 'Late'
  | 'Absent'
  | 'Half day'
  | 'Leave'
  | 'Weekly off'
  | 'Holiday'
  | 'Not in yet'

export interface TodayView {
  date: string
  /** The database's own clock. The browser's clock is never used for a time. */
  serverTime: string
  status: AttendanceStatus
  loginAt: string | null
  logoutAt: string | null
  /** Settled hours. Zero until check-out — see the running clock in MyPage. */
  activeHours: number
  lateByMinutes: number
  shiftStart: string
  shiftEnd: string
  canCheckIn: boolean
  canCheckOut: boolean
}

export const STATUS_CLASS: Record<AttendanceStatus, string> = {
  'On time': 'c-in',
  Late: 'c-pend',
  Absent: 'c-abs',
  'Half day': 'c-leave',
  Leave: 'c-leave',
  'Weekly off': 'c-out',
  Holiday: 'c-wfh',
  'Not in yet': 'c-out',
}

export interface WeekBar {
  date: string
  dayName: string
  status: AttendanceStatus
  hours: number
  /** Height as a percentage of the chart's scale, 0–100. */
  percent: number
  isToday: boolean
}
