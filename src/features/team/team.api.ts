import { request } from '../../shared/api/client'
import type { DirectoryView, EmployeeLocations, SaveLocationsPayload } from './team.types'

export const teamApi = {
  /**
   * Your own scope — the company for an admin, your reporting tree for a
   * manager. There is no id to pass: the server decides whose list this is.
   */
  getDirectory: (includeLeavers = false) =>
    request<DirectoryView>(`/team${includeLeavers ? '?includeLeavers=true' : ''}`),

  /** Admin only: one person's check-in locations, for the Locations popup. */
  getLocations: (employeeId: number) =>
    request<EmployeeLocations>(`/profile/${employeeId}/locations`),

  /** Admin only: save home, the dual-location switch and the second point. */
  saveLocations: (employeeId: number, payload: SaveLocationsPayload) =>
    request<EmployeeLocations>(`/profile/${employeeId}/locations`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
}
