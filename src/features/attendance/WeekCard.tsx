import { useCallback, useEffect, useState } from 'react'
import { attendanceApi } from './attendance.api'
import { type WeekBar } from './attendance.types'
import { DayDetailModal, DayPopover } from './DayDetail'
import { fmtShort } from '../../shared/lib/date'
import { asHours } from '../../shared/lib/format'
import { useAdminActivity } from '../presence'
import { useWorkActivities } from '../work-activity'

/** Days that were never meant to be worked draw as a paler trough. */
const isOffDay = (bar: WeekBar): boolean =>
  bar.status === 'Weekly off' || bar.status === 'Holiday' || bar.status === 'Leave'

/** Where the hover box should sit: centred over the bar it belongs to. */
interface Anchor {
  bar: WeekBar
  x: number
  y: number
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
 * Hovering or tabbing to a bar shows a short summary; clicking it (or Enter)
 * opens the whole day in a window — every stretch, every recorded activity and
 * the admin panel. Who may open somebody else's week is decided
 * by the API against the reporting tree, so the same box is available to the
 * employee, to their manager and to an admin, and to nobody else.
 */
export function WeekCard({ employeeId, isSelf }: { employeeId: number; isSelf: boolean }) {
  const [bars, setBars] = useState<WeekBar[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const [selected, setSelected] = useState<WeekBar | null>(null)
  const admin = useAdminActivity(
    bars?.[0]?.date ?? null,
    bars?.[bars.length - 1]?.date ?? null,
    isSelf ? undefined : employeeId,
  )
  const { range: recorded } = useWorkActivities(
    bars?.[0]?.date ?? null,
    bars?.[bars.length - 1]?.date ?? null,
    isSelf ? undefined : employeeId,
  )

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

  const activitiesOn = (date: string) => recorded?.activities.filter((a) => a.date === date) ?? []

  const openDetail = (bar: WeekBar) => {
    setAnchor(null)
    setSelected(bar)
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
              onClick={() => openDetail(bar)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openDetail(bar)
                }
              }}
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
            ? `${asHours(worked)} so far this week. Hover a day for a summary, click for the full detail.`
            : 'No hours recorded yet this week.'}
        </div>
        {anchor && !selected && (
          <DayPopover
            x={anchor.x}
            y={anchor.y}
            bar={anchor.bar}
            admin={admin}
            activities={activitiesOn(anchor.bar.date)}
          />
        )}
        {selected && (
          <DayDetailModal
            bar={selected}
            admin={admin}
            activities={activitiesOn(selected.date)}
            canDelete={Boolean(recorded?.canEdit && recorded.editableDates.includes(selected.date))}
            onClose={() => setSelected(null)}
          />
        )}
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
