import { useEffect, useMemo, useRef, useState } from 'react'
import { InitialsAvatar } from './InitialsAvatar'
import { durationLabel, lastSeenLabel } from './relative-time'
import type { BoardGroup, BoardPerson } from './presence.types'
import { usePresenceBoard, usePresenceCount } from './usePresenceBoard'

/*
 * The header "N online" pill and its dropdown: the whole company, the same for
 * every employee, manager and admin, grouped by shift, with leave today and
 * where they are on the new admin panel.
 *
 * Two tabs, both grouped by shift:
 *
 *   · Active (the default) — who is supposed to be working at this moment
 *     (inside their shift, not on weekly off or leave), each Active or Away
 *     with how long; plus anyone active right now whatever their shift, with
 *     a chip saying why they are outside the expected list.
 *   · All — everyone (shifts closed, never-seen people folded into one line
 *     per shift). Days off read as "Weekly off", not "Away".
 *
 * Search always looks through everyone.
 */

const STATUS_LABEL = { online: 'Online', away: 'Away', signed_off: 'Logged out' } as const

type Tab = 'active' | 'all'

const TABS: { key: Tab; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'all', label: 'All' },
]

const EMPTY: Record<Tab, string> = {
  active: 'No one is on shift or active right now.',
  all: 'No one to show.',
}

interface Chip {
  text: string
  tone: string
}

const isOnline = (p: BoardPerson): boolean => p.presence?.status === 'online'

/** On the Active tab: expected now, or active now whatever the shift. */
const isOnActiveTab = (p: BoardPerson): boolean => p.onDuty || isOnline(p)

/** Why someone is not expected today — leave first, then a day off. */
function offChip(p: BoardPerson): Chip | null {
  if (p.leave) return { text: p.leave.isHalfDay ? 'Half-day leave' : 'Leave', tone: 'leave' }
  if (p.dayOff) return { text: p.dayOff, tone: 'off' }
  return null
}

function chipsOf(p: BoardPerson, tab: Tab): Chip[] {
  const off = offChip(p)
  if (tab === 'active') {
    const status = isOnline(p) ? { text: 'Active', tone: 'online' } : { text: 'Away', tone: 'away' }
    return off ? [status, off] : [status]
  }
  // All: someone working on a day off still shows Online beside why; anyone
  // else off today reads as their day off, never as "Away".
  if (isOnline(p)) return off ? [{ text: 'Online', tone: 'online' }, off] : [{ text: 'Online', tone: 'online' }]
  if (off) return [off]
  if (!p.presence) return [{ text: 'Not seen', tone: 'none' }]
  return [{ text: STATUS_LABEL[p.presence.status], tone: p.presence.status }]
}

/**
 * The Active tab's line: how long they have been active, or how long away.
 * Away is counted from their last activity, but never from before the shift
 * began — last seen yesterday is "away since the shift started", not 20 hours.
 */
function activeLineOf(p: BoardPerson, today: string): string {
  const s = p.presence
  if (s?.status === 'online') {
    const where = s.page.name ? `on ${s.page.name}` : null
    const length = s.sessionMinutes >= 1 ? `for ${durationLabel(s.sessionMinutes)}` : 'just arrived'
    return ['Active', length, where].filter(Boolean).join(' · ')
  }
  const seenToday = s && s.lastSeenDate === today
  const sinceSeen = seenToday ? Math.floor(s.secondsAgo / 60) : null
  const shift = p.shiftMinutesIn
  if (sinceSeen !== null && (shift === null || sinceSeen <= shift)) {
    return `Away for ${durationLabel(sinceSeen)} · last active ${s!.lastSeenTime}`
  }
  if (shift !== null) return `Away for ${durationLabel(shift)} · not active since the shift started`
  return 'Away'
}

function lineOf(p: BoardPerson, today: string): string {
  const s = p.presence
  if (!s) return 'Not seen on the admin panel'
  const where = s.page.name ? `on ${s.page.name}` : null
  if (s.status === 'online') {
    const length = s.sessionMinutes >= 1 ? `${durationLabel(s.sessionMinutes)} in` : 'just arrived'
    return ['Active now', where, length].filter(Boolean).join(' · ')
  }
  const when = lastSeenLabel(s.secondsAgo, s.lastSeenDate, s.lastSeenTime, today)
  if (s.status === 'signed_off') return `Logged out · ${when}`
  return [`Last seen ${when}`, where].filter(Boolean).join(' · ')
}

function Row({ p, today, tab }: { p: BoardPerson; today: string; tab: Tab }) {
  const chips = chipsOf(p, tab)
  return (
    <div className="on-row">
      <InitialsAvatar name={p.name || '?'} dot={p.presence?.status} />
      <div className="on-row-text">
        <div className="on-row-name">
          <span className="on-name">
            {p.name}
            {p.isMe ? <span className="on-you">(you)</span> : null}
          </span>
          {p.team ? <span className="on-role">{p.team}</span> : null}
          {chips.map((c, i) => (
            <span key={c.text} className={`on-chip ${c.tone}${i > 0 ? ' second' : ''}`}>
              {c.text}
            </span>
          ))}
        </div>
        <p className={`on-line${p.presence?.status === 'online' ? ' is-online' : ''}`}>
          {tab === 'active' ? activeLineOf(p, today) : lineOf(p, today)}
        </p>
      </div>
    </div>
  )
}

export function OnlineNow() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Tab>('active')
  // Everyone tab only: shifts opened by hand (they start closed there), and
  // shifts whose "not seen" people have been unfolded.
  const [openShifts, setOpenShifts] = useState<Record<string, boolean>>({})
  const [showNotSeen, setShowNotSeen] = useState<Record<string, boolean>>({})
  const ref = useRef<HTMLDivElement>(null)
  const { online: count, forbidden, error: countError } = usePresenceCount()
  const { board, failed } = usePresenceBoard(open)

  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', away)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', away)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const q = query.trim().toLowerCase()

  // Who each tab lists. Search ignores the tab and looks through everyone,
  // so finding one person is always one step.
  const groups = useMemo<BoardGroup[]>(() => {
    if (!board) return []
    const keep = (p: BoardPerson): boolean => {
      if (q) return p.name.toLowerCase().includes(q)
      if (tab === 'active') return isOnActiveTab(p)
      return true
    }
    return board.groups
      .map((g) => {
        const people = g.people.filter(keep)
        return { ...g, people, online: people.filter(isOnline).length }
      })
      .filter((g) => g.people.length > 0)
  }, [board, q, tab])

  const tabCounts = useMemo(() => {
    const people = board?.groups.flatMap((g) => g.people) ?? []
    return {
      active: people.filter(isOnActiveTab).length,
      all: people.length,
    }
  }, [board])

  // Active is short, so every shift is open. All starts
  // closed — 600 rows under one shift buries the rest. A search opens matches.
  const isExpanded = (g: BoardGroup) => (q || tab !== 'all' ? true : Boolean(openShifts[g.key]))

  // In All, people never seen on the panel fold into one line per shift.
  const folds = !q && tab === 'all'

  // Not shown until the first answer, so a refused account never sees it flash.
  // A failure is shown, not hidden: a missing pill reads as a missing feature.
  if (forbidden || (count === null && !countError)) return null

  // While the board is open its own count is the fresher one.
  const online = open && board ? board.counts.online : count
  const tip =
    online === null ? `Who is online could not load: ${countError}` : `${online} online on the admin panel now`

  return (
    <div className="on-wrap" ref={ref}>
      <button
        type="button"
        className={`on-pill${open ? ' open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        title={tip}
        aria-label={tip}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="on-pulse">
          <span className="on-pulse-ring" />
          <span className="on-pulse-dot" />
        </span>
        <span className="on-count">{online ?? '–'}</span>
        <span className="on-word">online</span>
      </button>

      {open ? (
        <div className="on-menu on-board" role="menu">
          <div className="on-menu-head">
            <span className="on-menu-title">
              <span className="on-pulse-dot" /> Who's on the admin panel
            </span>
            <span className="on-badge">{online ?? '–'} online</span>
          </div>
          <div className="on-tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                className={`on-tab${tab === t.key ? ' active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
                {board ? <span className="on-tab-n">{tabCounts[t.key]}</span> : null}
              </button>
            ))}
          </div>
          <div className="on-search">
            <input
              type="search"
              placeholder="Search name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search people"
            />
          </div>

          <div className="on-menu-body">
            {board === null ? (
              <div className="on-empty">{failed ? 'Could not load right now.' : 'Loading…'}</div>
            ) : groups.length === 0 ? (
              <div className="on-empty">{q ? 'No one matches that name.' : EMPTY[tab]}</div>
            ) : (
              groups.map((g) => {
                const expanded = isExpanded(g)
                const shown =
                  folds && !showNotSeen[g.key] ? g.people.filter((p) => p.presence || p.leave || p.dayOff) : g.people
                const hidden = g.people.length - shown.length
                return (
                  <section key={g.key} className="on-group">
                    <button
                      type="button"
                      className="on-group-head"
                      onClick={() => tab === 'all' && !q && setOpenShifts((o) => ({ ...o, [g.key]: !expanded }))}
                      aria-expanded={expanded}
                      disabled={tab !== 'all' || Boolean(q)}
                    >
                      <span className="on-caret">{expanded ? '▾' : '▸'}</span>
                      <span className="on-group-label">{g.label}</span>
                      <span className="on-group-meta">
                        {g.online > 0 && (
                          <b className="on-group-online">
                            {g.online} {tab === 'active' ? 'active' : 'online'}
                          </b>
                        )}
                        <span>
                          {g.online > 0 ? ' · ' : ''}
                          {tab === 'active' && !q ? `${g.people.length} on shift` : g.people.length}
                        </span>
                      </span>
                    </button>
                    {expanded && (
                      <>
                        {shown.map((p) => (
                          <Row
                            key={`${p.employeeId ?? 'a'}-${p.adminId ?? 'x'}`}
                            p={p}
                            today={board.today}
                            tab={tab}
                          />
                        ))}
                        {hidden > 0 && (
                          <button
                            type="button"
                            className="on-fold"
                            onClick={() => setShowNotSeen((v) => ({ ...v, [g.key]: true }))}
                          >
                            + {hidden} not seen on the admin panel <span>Show</span>
                          </button>
                        )}
                      </>
                    )}
                  </section>
                )
              })
            )}
          </div>

          <div className="on-menu-foot">
            {tab === 'active'
              ? 'People in their shift now (not on weekly off or leave), plus anyone active. Active = on the admin panel in the last 3 minutes.'
              : 'Online = active on the admin panel in the last 3 minutes'}
          </div>
        </div>
      ) : null}
    </div>
  )
}
