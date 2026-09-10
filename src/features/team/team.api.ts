import { request } from '../../api/client'
import type { DirectoryView } from './team.types'

export const teamApi = {
  /**
   * Your own scope — the company for an admin, your reporting tree for a
   * manager. There is no id to pass: the server decides whose list this is.
   */
  getDirectory: (includeLeavers = false) =>
    request<DirectoryView>(`/team${includeLeavers ? '?includeLeavers=true' : ''}`),
}
