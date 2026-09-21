import { request } from '../../shared/api/client'
import type { ProjectRecord, ProjectStatus, ProjectType, TaskStatus } from './projects.types'

export interface AddProjectPayload {
  type?: ProjectType
  title: string
  status: ProjectStatus
  note: string | null
  startedOn: string | null
}

export interface UpdateProjectPayload {
  type?: ProjectType
  title?: string
  status?: ProjectStatus
  note?: string | null
  startedOn?: string | null
}

export interface AddTaskPayload {
  parentTaskId?: number | null
  title: string
  status?: TaskStatus
  note?: string | null
  dueDate?: string | null
}

export interface UpdateTaskPayload {
  title?: string
  status?: TaskStatus
  note?: string | null
  dueDate?: string | null
}

export const projectsApi = {
  /**
   * Records a project or achievement against someone.
   * Returns the updated projects list.
   */
  add: (employeeId: number, payload: AddProjectPayload) =>
    request<ProjectRecord[]>(`/projects/${employeeId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (projectId: number, payload: UpdateProjectPayload) =>
    request<ProjectRecord[]>(`/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  delete: (projectId: number) =>
    request<ProjectRecord[]>(`/projects/${projectId}`, {
      method: 'DELETE',
    }),

  addTask: (projectId: number, payload: AddTaskPayload) =>
    request<ProjectRecord[]>(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateTask: (taskId: number, payload: UpdateTaskPayload) =>
    request<ProjectRecord[]>(`/projects/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteTask: (taskId: number) =>
    request<ProjectRecord[]>(`/projects/tasks/${taskId}`, {
      method: 'DELETE',
    }),
}

