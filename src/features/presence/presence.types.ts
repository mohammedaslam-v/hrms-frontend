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

// ── The shift-wise board (header dropdown) ───────────────────────────────────

export interface BoardPresence {
  status: PresenceStatus
  secondsAgo: number
  sessionMinutes: number
  page: { path: string | null; name: string | null }
  lastSeenDate: string
  lastSeenTime: string
}

export interface BoardPerson {
  employeeId: number | null
  adminId: number | null
  name: string
  subtitle: string | null
  /** Admin-panel role (as the new admin shows it), else the HRMS department. */
  team: string | null
  leave: { type: string; isHalfDay: boolean } | null
  /** 'Weekly off' or 'Holiday' for the shift day running now, else null. */
  dayOff: string | null
  /** Inside their shift now, and not on a weekly off, holiday or leave. */
  onDuty: boolean
  /** Minutes since the running shift began, while inside it. */
  shiftMinutesIn: number | null
  /** Total time active on the admin panel today, in seconds. */
  activeTodaySeconds: number
  presence: BoardPresence | null
  isMe: boolean
}

export interface BoardGroup {
  key: string
  label: string
  /** Null for the admins-only "No HRMS record" group. */
  shiftStart: string | null
  people: BoardPerson[]
  online: number
}

export interface PresenceBoard {
  today: string
  groups: BoardGroup[]
  counts: { online: number; people: number }
  generatedAt: string
}
