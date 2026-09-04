export type LeaveType = 'Casual' | 'Sick' | 'Earned' | 'Unpaid'

/** Which half of the day a half-day request covers. */
export type HalfDaySession = 'first' | 'second'

export const HALF_DAY_LABEL: Record<HalfDaySession, string> = {
  first: 'Session 1',
  second: 'Session 2',
}
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'

export interface LedgerRow {
  month: string
  credit: number
  taken: number
  unpaid: number
  lop: number
  /** Running balance at month end. Negative while a debt is outstanding. */
  closing: number
}

export interface LeaveLedger {
  opening: number
  credited: number
  taken: number
  lop: number
  pending: number
  adjustments: number
  balance: number
  /** Balance minus anything still awaiting approval. */
  available: number
  rows: LedgerRow[]
  lastLeaveOn: string | null
}

export interface LeaveRequest {
  id: number
  ref: string
  leaveType: LeaveType
  fromDate: string
  toDate: string
  days: number
  unpaidDays: number
  status: LeaveStatus
  reason: string
  appliedOn: string
  decidedBy: string | null
  isHalfDay: boolean
  halfDaySession: HalfDaySession | null
  /** Days of this request deducted so far — a request running into a future
      month only counts its elapsed portion, so the ledger stays balanced. */
  daysCounted: number
}

export interface LeavePolicy {
  leaveYear: number
  leavePerMonth: number
  annualEntitlement: number
  carryCap: number
  weeklyOff: string[]
}

export interface MyLeaveView {
  ledger: LeaveLedger
  requests: LeaveRequest[]
  policy: LeavePolicy
  monthlyTaken: { month: string; days: number }[]
}

export interface LeavePreview {
  days: number
  skippedDays: number
  balanceNow: number
  balanceAfter: number
  paidDays: number
  unpaidDays: number
  canSubmit: boolean
  message: string
}

export interface ApplyLeavePayload {
  leaveType: LeaveType
  halfDaySession?: HalfDaySession | null
  fromDate: string
  toDate: string
  isHalfDay: boolean
  reason: string
}

// ---------------------------------------------------------------- approvals

export interface PendingApproval {
  id: number
  ref: string
  employeeId: number
  employeeName: string
  employeeCode: string
  designation: string | null
  leaveType: LeaveType
  fromDate: string
  toDate: string
  days: number
  reason: string
  appliedOn: string
  isHalfDay: boolean
  halfDaySession: HalfDaySession | null
  balanceNow: number
  balanceAfter: number
  paidDays: number
  unpaidDays: number
  /** Approving would take the balance below zero — needs explicit confirmation. */
  createsLossOfPay: boolean
}

export interface TeamBalanceRow {
  employeeId: number
  employeeCode: string
  employeeName: string
  designation: string | null
  opening: number
  credited: number
  taken: number
  lop: number
  pending: number
  balance: number
  lastLeaveOn: string | null
}

export interface ApprovalsView {
  pending: PendingApproval[]
  balances: TeamBalanceRow[]
  log: (LeaveRequest & { employeeName: string })[]
  policy: {
    leaveYear: number
    leavePerMonth: number
    annualEntitlement: number
    carryCap: number
  }
  teamSize: number
}

export interface DecisionResult {
  view: ApprovalsView
  message: string
  convertedToUnpaid: boolean
}
