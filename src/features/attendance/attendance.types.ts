export type AttendanceStatus =
  | 'On time'
  | 'Late'
  | 'Absent'
  | 'Half day'
  | 'Leave'
  | 'Weekly off'
  | 'Holiday'
  | 'Not in yet'

/**
 * Where one day's hours came from.
 *
 * `punch`    — the employee declared it by checking in and out.
 * `activity` — the admin portals observed them working, in half-hour slots.
 *
 * Per DAY, not per person: somebody whose role joined the activity list midweek
 * has declared days behind them and observed days ahead.
 */
export type DaySource = 'punch' | 'activity'

/** The Today card. Always the person's own declaration, whatever their role. */
export interface TodayView {
  date: string
  /** The database's own clock. The browser's clock is never used for a time. */
  serverTime: string
  status: AttendanceStatus
  loginAt: string | null
  logoutAt: string | null
  recheckInAt?: string | null
  /** Settled hours. Zero until check-out — see the running clock in MyPage. */
  activeHours: number
  lateByMinutes: number
  shiftStart: string
  shiftEnd: string
  canCheckIn: boolean
  canCheckOut: boolean
  /**
   * Set for WFO (office or home) and WFH (home): punching is only allowed inside
   * one of these circles. Null means punch from anywhere. The server judges the
   * location again on every punch.
   */
  geofence: GeofencePolicy | null
}

export type ZoneKind = 'office' | 'home'

/** One allowed place: a circle on the map. */
export interface GeofenceZone {
  kind: ZoneKind
  lat: number
  lng: number
  /** The radius people are told about — every message says this number. */
  radiusM: number
  /** Hidden extra metres for GPS drift: decides, never displayed. */
  graceM?: number
}

export interface GeofencePolicy {
  zones: GeofenceZone[]
  /** A fix vaguer than this is "not precise enough", never "outside". */
  maxAccuracyM: number
  /** WFH with no saved home location: blocked until they save one. */
  homeMissing?: boolean
}

/** Sent with a punch — what the browser's Geolocation API reported. */
export interface DeviceFix {
  lat: number
  lng: number
  accuracy: number
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

export const STATUS_LABEL: Record<AttendanceStatus, string> = {
  'On time': 'On time',
  Late: 'Late',
  Absent: 'Not Marked',
  'Half day': 'Half day',
  Leave: 'Leave',
  'Weekly off': 'Weekly off',
  Holiday: 'Holiday',
  'Not in yet': 'Not in yet',
}

/** A stretch of a day. `to` is null only while a punch is still running. */
export interface TimeRange {
  from: string
  /** '24:00' means midnight at the END of the day, never the start of it. */
  to: string | null
}

export interface WeekBar {
  date: string
  dayName: string
  status: AttendanceStatus
  hours: number
  /** Height as a percentage of the chart's scale, 0–100. */
  percent: number
  isToday: boolean
  /**
   * When the person was actually working, in order. One stretch for a declared
   * day; possibly several for an observed one, and the gaps between them are
   * what the total on its own hides.
   */
  segments: TimeRange[]
  /** Whether this day's hours were declared or observed. */
  source: DaySource
}

/** A month (or any window) for the calendar card. */
export interface CalendarView {
  from: string
  to: string
  /** The database's date — today's ring is drawn from this, never the browser. */
  today: string
  /** An admin looking at somebody else. The server checks again on save. */
  canEdit: boolean
  days: WeekBar[]
}

/** What an admin can set a day to. Leave kinds are written as approved leave. */
export const DAY_EDIT_STATUSES = [
  'Present',
  'Earned leave',
  'Half earned leave',
  'LOP full day',
  'LOP half day',
] as const
export type DayEditStatus = (typeof DAY_EDIT_STATUSES)[number]

export interface EditDayInput {
  status: DayEditStatus
  loginAt: string | null
  logoutAt: string | null
  halfDaySession: 'first' | 'second' | null
  note: string
}

export interface TodayBoardKpis {
  onTime: number
  late: number
  absent: number
  leave: number
  off: number
  total: number
}

export interface TodayBoardRow {
  employeeId: number
  code: string
  name: string
  department: string | null
  managerId?: number | null
  managerName?: string | null
  workMode: string
  shiftStart: string
  shiftEnd: string
  loginAt: string | null
  logoutAt: string | null
  activeHours: number
  lateByMinutes: number
  status: AttendanceStatus
  leaveType: string | null
}

export interface TodayBoardDto {
  date: string
  kpis: TodayBoardKpis
  quickCounts: Record<string, number>
  roster: TodayBoardRow[]
}

export interface AttendanceRangeRow {
  date: string
  dayName: string
  employeeId: number
  code: string
  name: string
  department: string | null
  shiftStart: string
  shiftEnd: string
  loginAt: string | null
  logoutAt: string | null
  activeHours: number
  lateByMinutes: number
  status: AttendanceStatus
}

export interface AttendanceRangeDto {
  from: string
  to: string
  totalCount: number
  rows: AttendanceRangeRow[]
}

export interface PunctualityEmployeeSummary {
  employeeId: number
  code: string
  name: string
  department: string | null
  workingDays: number
  onTime: number
  late: number
  absent: number
  leave: number
  halfDay: number
  totalActiveHours: number
  avgActiveHours: number
  punctuality: number
}

export interface PunctualitySummaryDto {
  from: string
  to: string
  summary: PunctualityEmployeeSummary[]
}

export type AttendanceTab = 'today' | 'range' | 'summary'

