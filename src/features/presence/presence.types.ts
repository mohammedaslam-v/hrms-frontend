/** The new admin panel's who-is-online shape, field for field. */
export type PresenceStatus = 'online' | 'away' | 'signed_off'

/**
 * Where someone is: which Bambinos panel, and which page on it. `panel` is
 * 'admin' for the admin panel; others report through the shared tracker.
 * Optional so an older backend's rows still render.
 */
export interface PageRef {
  path: string | null
  name: string | null
  panel?: string
  panelName?: string
}

/** "on Tickets" on the admin panel; "on Renewal panel · Renewal Analysis" elsewhere. */
export function placeLabel(page: PageRef): string | null {
  if (!page.panel || page.panel === 'admin') return page.name ? `on ${page.name}` : null
  return `on ${page.panelName ?? page.panel}${page.name ? ` · ${page.name}` : ''}`
}

export interface PresencePerson {
  admin_id: number
  name: string
  role: string
  status: PresenceStatus
  seconds_ago: number
  session_minutes: number
  page: PageRef
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
  page: PageRef
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
  page: PageRef
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
