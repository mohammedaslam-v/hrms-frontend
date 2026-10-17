export type WorkActivityType = 'phone_call' | 'external_meeting' | 'other'

export interface WorkActivity {
  id: number
  employeeId: number
  date: string
  type: WorkActivityType
  /** HH:MM, India time. */
  startTime: string
  endTime: string
  note: string | null
  createdAt: string
}

export interface WorkActivityRange {
  /** Dates the viewer may still add to or delete from, newest first. */
  editableDates: string[]
  canEdit: boolean
  activities: WorkActivity[]
}

export interface NewWorkActivity {
  date: string
  type: WorkActivityType
  startTime: string
  endTime: string
  note: string
}

export const ACTIVITY_LABEL: Record<WorkActivityType, string> = {
  phone_call: 'Phone call',
  external_meeting: 'External meeting',
  other: 'Other',
}
