/** The new admin panel's who-is-online shape, field for field. */
export type PresenceStatus = 'online' | 'away' | 'signed_off'

export interface PresencePerson {
  admin_id: number
  name: string
  role: string
  status: PresenceStatus
  seconds_ago: number
  session_minutes: number
  page: { path: string | null; name: string | null }
}

export interface PresenceSummary {
  online: PresencePerson[]
  recent: PresencePerson[]
  counts: { online: number; last_hour: number }
  generated_at: string
  /** HRMS only: the viewer's own admin account(s), for the "(you)" marker. */
  viewer_admin_ids?: number[]
}
