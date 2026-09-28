import type { AttendanceStatus } from '../attendance'

export interface DashboardKpis {
  headcount: number
  loggedIn: number
  late: number
  noLogin: number
  onLeave: number
}

export interface DepartmentHours {
  department: string
  hours: number
  /** Share of the busiest department, 0–100. The bar's width. */
  percent: number
}

/**
 * One line in "Needs your attention".
 *
 * `goTo` is a nav key, or null when the screen that would answer the item is
 * not built yet — the line still says the thing, it just is not a link.
 */
export interface AttentionItem {
  kind: 'approvals' | 'late' | 'no-login' | 'goals-at-risk'
  title: string
  detail: string
  tone: 'violet' | 'coral' | 'maroon' | 'saffron'
  goTo: string | null
}

export interface LiveRow {
  employeeId: number
  name: string
  department: string | null
  workMode: string
  shiftStart: string
  shiftEnd: string
  loginAt: string | null
  activeHours: number
  status: AttendanceStatus
}

export interface OnLeaveToday {
  employeeId: number
  name: string
  leaveType: string
}

export interface DashboardView {
  /** The date this page is about, from the database clock — never the browser's. */
  date: string
  scope: 'company' | 'team'
  kpis: DashboardKpis
  departments: DepartmentHours[]
  attention: AttentionItem[]
  live: LiveRow[]
  onLeave: OnLeaveToday[]
}
