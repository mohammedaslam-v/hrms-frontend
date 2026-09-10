import type { WorkMode } from '../profile/profile.types'

export interface DirectoryMember {
  id: number
  employeeCode: string
  fullName: string
  designation: string | null
  department: string | null
  managerName: string | null
  workMode: WorkMode
  shiftStart: string
  shiftEnd: string
  weeklyOff: string[]
  dateOfJoining: string
  dateOfLeaving: string | null
  /**
   * Absent entirely — not null — for anyone who may not see pay. The server
   * never fetches it for them, so there is nothing here to hide.
   */
  ctc?: number | null
}

export interface DirectoryView {
  /** Whether to draw the pay column. Sent explicitly, not inferred from the rows. */
  canSeePay: boolean
  scope: 'company' | 'team'
  members: DirectoryMember[]
}
