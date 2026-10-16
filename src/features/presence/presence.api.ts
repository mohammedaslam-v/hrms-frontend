import { request } from '../../shared/api/client'
import type { PresenceSummary } from './presence.types'

export const presenceApi = {
  /**
   * Who is on the new admin panel. No id to pass: the server narrows it to you,
   * your team, or everyone, from your tiers.
   */
  online: () => request<PresenceSummary>('/presence/online'),
}
