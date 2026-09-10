export type ProjectStatus = 'In progress' | 'Live' | 'Done'

export interface ProjectRecord {
  id: number
  title: string
  status: ProjectStatus
  note: string | null
  startedOn: string | null
  addedByName: string | null
}

/** Chip class per status, reusing the palette the rest of the app already uses. */
export const PROJECT_CHIP: Record<ProjectStatus, string> = {
  Live: 'c-in',
  Done: 'c-wfh',
  'In progress': 'c-wfo',
}
