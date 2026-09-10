import { request } from '../../shared/api/client'
import type { ProjectRecord, ProjectStatus } from './projects.types'

export interface AddProjectPayload {
  title: string
  status: ProjectStatus
  note: string | null
  startedOn: string | null
}

export const projectsApi = {
  /**
   * Records a project against someone. The author is the signed-in person — the
   * server takes it from the session, never from this payload.
   *
   * Returns the whole list back, so the card shows the new state without a
   * second request.
   */
  add: (employeeId: number, payload: AddProjectPayload) =>
    request<ProjectRecord[]>(`/projects/${employeeId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}
