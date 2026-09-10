import type { FeedbackRecord } from '../feedback/feedback.types'
import type { GoalView } from '../goals/goals.types'
import type { ProjectRecord } from '../projects/projects.types'

export type WorkMode = 'WFH' | 'WFO' | 'Hybrid'

/** Why the viewer is being shown this page — decided by the server, not the UI. */
export type ProfileAccess = 'self' | 'manager' | 'admin'

export interface ProfileDocument {
  key: string
  label: string
  path: string
}

/** Pay, for a viewer entitled to see it. Assembled and gated on the server. */
export interface CompensationView {
  effectiveFrom: string
  ctc: number
  variablePay: number
  bonus: number
  esopUnits: number
  esopVestedPct: number
  /** Units actually held today. Computed server-side — the card never does pay arithmetic. */
  esopVestedUnits: number
  revisionNote: string | null
}

export interface ProfileView {
  access: ProfileAccess
  isSelf: boolean

  employeeId: number
  employeeCode: string
  fullName: string
  workEmail: string
  designation: string | null
  department: string | null
  workMode: WorkMode
  workState: string
  shiftStart: string
  shiftEnd: string
  weeklyOff: string[]
  dateOfJoining: string
  dateOfLeaving: string | null
  managerName: string | null

  mobile: string | null
  /** Null when a manager is viewing a report — withheld by the server, not hidden here. */
  personalEmail: string | null
  dateOfBirth: string | null
  emergencyMobile: string | null
  city: string | null
  linkedinProfile: string | null

  documents: ProfileDocument[]
  leaveBalance: number

  /**
   * Null means one of two things, and `canSeeCompensation` tells them apart:
   * this viewer may not see pay, or nobody has loaded it yet. The card says
   * something different in each case.
   */
  compensation: CompensationView | null
  canSeeCompensation: boolean

  /** Not gated the way pay is — a goal is work, and a manager should see it. */
  goals: GoalView[]

  projects: ProjectRecord[]
  /** Already filtered by the server — restricted notes never reach the subject. */
  feedback: FeedbackRecord[]
}

export const WORK_MODE_CLASS: Record<WorkMode, string> = {
  WFH: 'c-wfh',
  WFO: 'c-wfo',
  Hybrid: 'c-leave',
}
