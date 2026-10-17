import { asHours } from '../../shared/lib/format'
import { fmtShort } from '../../shared/lib/date'
import { agoLabel, durationLabel } from './relative-time'
import type { AdminPanelActivity } from './presence.types'

/**
 * The admin-panel part of a day's hover box on My Page: how long the person
 * spent on the new admin panel that day, and — on today's bar — where they are
 * on it now, or when they were last there.
 *
 * Measured from the panel's own pings (every minute while a tab is open and
 * visible), so it is time on the panel, separate from check-in and check-out.
 */
export function AdminPanelLines({
  activity,
  date,
  isToday,
}: {
  activity: AdminPanelActivity
  date: string
  isToday: boolean
}) {
  if (!activity.linked) {
    return (
      <div className="wbpop-admin">
        <div className="wbpop-source">Admin panel</div>
        <div className="wbpop-note">No admin panel account linked.</div>
      </div>
    )
  }

  const day = activity.days.find((d) => d.date === date)
  const now = activity.now

  let nowLine: string | null = null
  if (isToday && now) {
    if (now.status === 'online') {
      const where = now.page.name ? `on ${now.page.name}` : null
      const length = now.sessionMinutes >= 1 ? `${durationLabel(now.sessionMinutes)} in` : 'just arrived'
      nowLine = ['On the panel now', where, length].filter(Boolean).join(' · ')
    } else {
      const when = now.lastSeenDate === date ? now.lastSeenTime : `${fmtShort(now.lastSeenDate)}, ${now.lastSeenTime}`
      const verb = now.status === 'signed_off' ? 'Logged out of the panel' : 'Last on the panel'
      nowLine = `${verb} at ${when} (${agoLabel(now.secondsAgo)})`
    }
  }

  return (
    <div className="wbpop-admin">
      <div className="wbpop-source">Admin panel</div>
      {day ? (
        <>
          <div className="wbpop-admin-total">{asHours(day.activeSeconds / 3600)} on the panel</div>
          <div className="wbpop-runs">
            <span>
              {day.firstSeen} – {day.lastSeen}
              {day.sessions > 1 ? ` · ${day.sessions} visits` : ''}
            </span>
          </div>
        </>
      ) : (
        <div className="wbpop-note">No admin panel time recorded.</div>
      )}
      {nowLine && <div className={`wbpop-now${now?.status === 'online' ? ' is-online' : ''}`}>{nowLine}</div>}
    </div>
  )
}
