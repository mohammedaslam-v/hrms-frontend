export type WorkMode = 'WFH' | 'WFO' | 'Hybrid'

/** Why the viewer is being shown this page — decided by the server, not the UI. */
export type ProfileAccess = 'self' | 'manager' | 'admin'

export interface ProfileDocument {
  key: string
  label: string
  path: string
}

/** A card the design draws that has no data behind it yet, and the reason. */
export interface PendingBlock {
  block: string
  reason: string
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
  pending: PendingBlock[]
}

export const WORK_MODE_CLASS: Record<WorkMode, string> = {
  WFH: 'c-wfh',
  WFO: 'c-wfo',
  Hybrid: 'c-leave',
}
