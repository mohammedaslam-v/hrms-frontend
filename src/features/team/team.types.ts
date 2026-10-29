import type { WorkMode } from '../profile'

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
  /** Admins only: draw the Locations column with its Edit button. */
  canManageLocations?: boolean
  scope: 'company' | 'team'
  members: DirectoryMember[]
}

/** A saved check-in place, as the server returns it. */
export interface SavedLocation {
  lat: number
  lng: number
  setAt: string | null
  setByName: string | null
}

/** What the admin's Locations popup opens with. */
export interface EmployeeLocations {
  employeeId: number
  fullName: string
  workMode: WorkMode
  /** WFO: the office always counts, whatever is set here. */
  officeAlwaysAllowed: boolean
  /** Each place counts only while its switch is on. */
  homeEnabled: boolean
  home: SavedLocation | null
  secondEnabled: boolean
  /** Kept while switched off, so switching back on restores it. */
  second: SavedLocation | null
}

/** The popup's Save. Empty clears a place; second needs a point while on. */
export interface SaveLocationsPayload {
  homeEnabled: boolean
  home: { lat: string; lng: string } | null
  secondEnabled: boolean
  second: { lat: string; lng: string } | null
}
