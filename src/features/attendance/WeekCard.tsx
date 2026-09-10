import { useCallback, useEffect, useState } from 'react'
import { attendanceApi } from './attendance.api'
import type { WeekBar } from './attendance.types'
import { fmtShort } from '../../shared/lib/date'
import { asHours } from '../../shared/lib/format'

/** Days that were never meant to be worked draw as a paler trough. */
const isOffDay = (bar: WeekBar): boolean =>
  bar.status === 'Weekly off' || bar.status === 'Holiday' || bar.status === 'Leave'

/**
 * Active hours across the last seven days.
 *
 * The scale carries a nine-hour floor, applied on the server: without it a week
 * whose longest day was four hours would draw a full-height bar and read like a
 * normal week.
 */
export function WeekCard({ employeeId, isSelf }: { employeeId: number; isSelf: boolean }) {
  const [bars, setBars] = useState<WeekBar[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
              title={`${fmtShort(bar.date)} · ${bar.status}${bar.hours > 0 ? ` · ${asHours(bar.hours)}` : ''}`}
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
            ? `${asHours(worked)} across the last seven days.`
            : 'No hours recorded in the last seven days.'}
        </div>
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
