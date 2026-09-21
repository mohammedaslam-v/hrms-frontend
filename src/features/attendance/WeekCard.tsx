import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { attendanceApi } from './attendance.api'
import { STATUS_CLASS, type WeekBar } from './attendance.types'
import { fmtShort } from '../../shared/lib/date'
import { asHours } from '../../shared/lib/format'

/** Days that were never meant to be worked draw as a paler trough. */
const isOffDay = (bar: WeekBar): boolean =>
  bar.status === 'Weekly off' || bar.status === 'Holiday' || bar.status === 'Leave'

/** Where the box should sit: centred over the bar it belongs to. */
interface Anchor {
  bar: WeekBar
  x: number
  y: number
}

/**
 * The detail behind one bar.
 *
 * Rendered into `document.body` and positioned with `fixed`, because the chart
 * scrolls sideways on a narrow screen and anything inside that container would
 * be clipped by it. Escaping to the body means the box cannot be cut off by an
 * ancestor it knows nothing about.
 */
function DayDetail({ anchor }: { anchor: Anchor }) {
  const { bar } = anchor
  return createPortal(
    <div className="wbpop" role="tooltip" style={{ left: anchor.x, top: anchor.y }}>
      <div className="wbpop-head">
        <b>
          {bar.dayName} {fmtShort(bar.date)}
        </b>
        <span className={`chip ${STATUS_CLASS[bar.status]}`}>{bar.status}</span>
      </div>

      {bar.segments.length > 0 ? (
        <>
          <div className="wbpop-total">{asHours(bar.hours)} active</div>
          {/* Which record this came from. A day is not always measured the same
              way as the day before it — a role added to the activity list
              midweek leaves declared days behind it and observed days ahead. */}
          <div className="wbpop-source">
            {bar.source === 'activity' ? 'From admin-portal activity' : 'From check-in and check-out'}
          </div>
          <div className="wbpop-runs">
            {bar.segments.map((run) => (
              <span key={run.from}>
                {run.from} – {run.to ?? 'still in'}
              </span>
            ))}
          </div>
          {/* The gaps are the reason this box exists, so name them rather than
              leaving the reader to subtract the ranges from the total. */}
          {bar.segments.length > 1 && (
            <div className="wbpop-note">
              {bar.segments.length - 1} break{bar.segments.length > 2 ? 's' : ''} in between
            </div>
          )}
        </>
      ) : (
        <div className="wbpop-note">Nothing recorded for this day.</div>
      )}
    </div>,
    document.body,
  )
}

/**
 * Active hours across this week, Monday to Sunday.
 *
 * A real calendar week rather than a rolling seven days, so the heading means
 * what someone reading it assumes. Early in the week most of the chart is days
 * that have not happened yet; they draw empty, which is the honest picture.
 *
 * The scale carries a nine-hour floor, applied on the server: without it a week
 * whose longest day was four hours would draw a full-height bar and read like a
 * normal week.
 *
 * Hovering or tabbing to a bar opens the detail behind it — when the person was
 * working and when they were not. Who may open somebody else's week is decided
 * by the API against the reporting tree, so the same box is available to the
 * employee, to their manager and to an admin, and to nobody else.
 */
export function WeekCard({ employeeId, isSelf }: { employeeId: number; isSelf: boolean }) {
  const [bars, setBars] = useState<WeekBar[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [anchor, setAnchor] = useState<Anchor | null>(null)

  const load = useCallback(async () => {
    try {
      setBars(isSelf ? await attendanceApi.getWeek() : await attendanceApi.getWeekFor(employeeId))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this week.')
    } finally {
      setLoading(false)
    }
  }, [isSelf, employeeId])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [load])

  // A box positioned against the viewport has to go when the viewport moves,
  // or it detaches from the bar it is describing.
  useEffect(() => {
    if (!anchor) return
    const close = () => setAnchor(null)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [anchor])

  const open = (bar: WeekBar, element: HTMLElement) => {
    const box = element.getBoundingClientRect()
    setAnchor({ bar, x: box.left + box.width / 2, y: box.top - 10 })
  }

  const body = () => {
    if (loading) return <div className="empty">Loading…</div>
    if (error || !bars) {
      return (
        <div className="notice bad" role="alert">
          {error ?? 'Could not load this week.'}
        </div>
      )
    }

    const worked = bars.reduce((total, bar) => total + bar.hours, 0)

    return (
      <>
        <div className="weekbars">
          {bars.map((bar) => (
            <div
              className={`wb${bar.isToday ? ' today' : ''}${isOffDay(bar) ? ' off' : ''}`}
              key={bar.date}
              // Reachable by keyboard as well as by mouse: the detail is the
              // only place the stretches appear, so it cannot be hover-only.
              tabIndex={0}
              role="button"
              aria-label={`${bar.dayName} ${fmtShort(bar.date)}, ${bar.status}, ${asHours(bar.hours)}`}
              onMouseEnter={(e) => open(bar, e.currentTarget)}
              onMouseLeave={() => setAnchor(null)}
              onFocus={(e) => open(bar, e.currentTarget)}
              onBlur={() => setAnchor(null)}
            >
              <div className="col">
                <i style={{ height: `${bar.percent}%` }} />
              </div>
              <span>{bar.dayName}</span>
            </div>
          ))}
        </div>
        <div className="hint mt8">
          {worked > 0
            ? `${asHours(worked)} so far this week. Hover a day for the detail.`
            : 'No hours recorded yet this week.'}
        </div>
        {anchor && <DayDetail anchor={anchor} />}
      </>
    )
  }

  return (
    <div className="card">
      <h3>Active hours · this week</h3>
      {body()}
    </div>
  )
}
