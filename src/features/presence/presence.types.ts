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

/** One India date on the admin panel. */
export interface AdminPanelDay {
  date: string
  firstSeen: string
  lastSeen: string
  activeSeconds: number
  sessions: number
}

/** Where the person is on the admin panel now, or when they were last there. */
export interface AdminPanelNow {
  status: PresenceStatus
  secondsAgo: number
  sessionMinutes: number
  page: { path: string | null; name: string | null }
  lastSeenDate: string
  lastSeenTime: string
}

export interface AdminPanelActivity {
  /** False when the employee has no admin account. */
  linked: boolean
  days: AdminPanelDay[]
  now: AdminPanelNow | null
}
