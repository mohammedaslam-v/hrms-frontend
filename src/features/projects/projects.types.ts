export type ProjectType = 'project' | 'achievement'
export type ProjectStatus = 'In progress' | 'Live' | 'Done'
export type TaskStatus = 'Pending' | 'In progress' | 'Done'

export interface ProjectTaskRecord {
  id: number
  projectId: number
  parentTaskId: number | null
  title: string
  status: TaskStatus
  note: string | null
  dueDate: string | null
  addedBy: number
  addedByName: string | null
  createdAt: string
  subtasks: ProjectTaskRecord[]
}

export interface TaskStats {
  total: number
  done: number
  inProgress: number
  pending: number
}

export interface ProjectRecord {
  id: number
  employeeId: number
  type: ProjectType
  title: string
  status: ProjectStatus
  note: string | null
  startedOn: string | null
  addedBy?: number
  addedByName: string | null
  tasks?: ProjectTaskRecord[]
  taskStats?: TaskStats
}

/** Chip class per status, reusing the palette the rest of the app already uses. */
export const PROJECT_CHIP: Record<ProjectStatus, string> = {
  Live: 'c-in',
  Done: 'c-wfh',
  'In progress': 'c-wfo',
}

export const TASK_CHIP: Record<TaskStatus, string> = {
  Done: 'c-in',
  'In progress': 'c-wfo',
  Pending: 'c-wfh',
}

