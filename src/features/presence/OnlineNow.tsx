import { useEffect, useRef, useState } from 'react'
import { clock } from '../../navigation/icons'
import { InitialsAvatar } from './InitialsAvatar'
import { agoLabel, durationLabel } from './relative-time'
import type { PresencePerson } from './presence.types'
import { ONLINE_REFRESH_MS, useOnlineSummary } from './useOnlineSummary'

// The header "N online" pill — a port of the new admin's OnlineNow.tsx, reading
// the same table. Who is using the admin panel right now, and who was seen in
// the last hour, narrowed by the server to you / your team / everyone. Read
// every minute; every 20 s while the menu is open.

const OPEN_REFRESH_MS = 20 * 1000

function PersonRow({ p, me }: { p: PresencePerson; me: boolean }) {
  const online = p.status === 'online'
  const where = p.page.name ? `on ${p.page.name}` : null
  const line = online
    ? [where, p.session_minutes >= 1 ? `${durationLabel(p.session_minutes)} in` : 'just arrived']
        .filter(Boolean)
        .join(' · ')
    : p.status === 'signed_off'
      ? `logged out · ${agoLabel(p.seconds_ago)}`
      : [where, agoLabel(p.seconds_ago)].filter(Boolean).join(' · ')
  return (
    <div className="on-row">
      <InitialsAvatar name={p.name || '?'} dot={p.status} />
      <div className="on-row-text">
        <div className="on-row-name">
          <span className="on-name">
            {p.name}
            {me ? <span className="on-you">(you)</span> : null}
          </span>
          {p.role ? <span className="on-role">{p.role}</span> : null}
        </div>
        <p className={`on-line${online ? ' is-online' : ''}`}>{line}</p>
      </div>
    </div>
  )
}

export function OnlineNow() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { summary, failed, forbidden, reload } = useOnlineSummary(
    open ? OPEN_REFRESH_MS : ONLINE_REFRESH_MS,
  )

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

  const online = summary?.counts.online ?? 0
  const lastHour = summary?.counts.last_hour ?? 0
  const tip = summary
    ? `${online} admin${online === 1 ? '' : 's'} online now · ${lastHour} seen in the last hour`
    : 'Who is using the admin panel right now'

  const isMe = (p: PresencePerson) => summary?.viewer_admin_ids?.includes(p.admin_id) ?? false

  // Not shown until the first answer, so an account that is refused never sees
  // the pill flash up and vanish.
  if (forbidden || summary === null) return null

  return (
    <div className="on-wrap" ref={ref}>
      <button
        type="button"
        className={`on-pill${open ? ' open' : ''}`}
        onClick={() => {
          if (!open) void reload()
          setOpen((o) => !o)
        }}
        title={tip}
        aria-label={tip}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="on-pulse">
          <span className="on-pulse-ring" />
          <span className="on-pulse-dot" />
        </span>
        <span className="on-count">{summary ? online : '·'}</span>
        <span className="on-word">online</span>
      </button>

      {open ? (
        <div className="on-menu" role="menu">
          <div className="on-menu-head">
            <span className="on-menu-title">
              <span className="on-pulse-dot" /> On the admin panel now
            </span>
            <span className="on-badge">{online} online</span>
          </div>

          <div className="on-menu-body">
            {summary === null ? (
              <div className="on-empty">{failed ? 'Could not load right now.' : 'Loading…'}</div>
            ) : (
              <>
                {summary.online.length === 0 ? (
                  <div className="on-empty">No one is on the admin panel right now.</div>
                ) : (
                  summary.online.map((p) => <PersonRow key={p.admin_id} p={p} me={isMe(p)} />)
                )}
                {summary.recent.length > 0 ? (
                  <>
                    <div className="on-section">
                      {clock} Seen in the last hour
                    </div>
                    {summary.recent.map((p) => (
                      <PersonRow key={p.admin_id} p={p} me={isMe(p)} />
                    ))}
                  </>
                ) : null}
              </>
            )}
          </div>

          <div className="on-menu-foot">Online = active in the last 3 minutes</div>
        </div>
      ) : null}
    </div>
  )
}
