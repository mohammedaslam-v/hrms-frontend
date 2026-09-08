import { useCallback, useEffect, useState } from 'react'
import { attendanceApi } from './attendance.api'
import type { WeekBar } from './attendance.types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const fmtShort = (iso: string): string => {
  const [, m, d] = iso.split('-')
  return `${d} ${MONTHS[Number(m) - 1]}`
}

const asHours = (hours: number): string => {
  const total = Math.round(hours * 60)
  return `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, '0')}m`
}

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
export function WeekCard({ isSelf, reason }: { isSelf: boolean; reason: string }) {
  const [bars, setBars] = useState<WeekBar[] | null>(null)
  const [loading, setLoading] = useState(isSelf)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setBars(await attendanceApi.getWeek())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this week.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isSelf) return
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [isSelf, load])

  const body = () => {
    if (!isSelf) {
      return (
        <div className="empty">
          <b>Not shown here</b>
          {reason}
        </div>
      )
    }
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
