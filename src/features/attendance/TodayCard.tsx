import { useCallback, useEffect, useRef, useState } from 'react'
import { attendanceApi } from './attendance.api'
import { STATUS_CLASS, type TodayView } from './attendance.types'
import { asHours } from '../../shared/lib/format'

const minutesOf = (time: string): number => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/**
 * Today — the check-in card.
 *
 * The clock ticks in the browser, but it never reads the browser's wall clock.
 * The elapsed span comes from the server (`serverTime` minus `loginAt`), and
 * local time is only ever used to measure how long the page has been open since
 * that reading. A viewer with a wrong clock therefore sees the right number.
 */
interface TodayCardProps {
  employeeId: number
  isSelf: boolean
  /** First name, for the wording when this is somebody else's day. */
  employeeName: string
}

export function TodayCard({ employeeId, isSelf, employeeName }: TodayCardProps) {
  const [view, setView] = useState<TodayView | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Elapsed minutes at the moment the server answered, and the local timestamp
  // of that moment. The ref is written and read only in effects and handlers —
  // never during render, where a ref read would not trigger an update.
  const anchor = useRef<{ minutes: number; at: number } | null>(null)
  /** Minutes since check-in. Null when the day is closed or not started. */
  const [elapsed, setElapsed] = useState<number | null>(null)

  const apply = useCallback((next: TodayView) => {
    setView(next)
    if (next.loginAt && !next.logoutAt) {
      const minutes = minutesOf(next.serverTime) - minutesOf(next.loginAt)
      anchor.current = { minutes, at: Date.now() }
      setElapsed(minutes)
    } else {
      anchor.current = null
      setElapsed(null)
    }
  }, [])

  const load = useCallback(async () => {
    try {
      apply(isSelf ? await attendanceApi.getToday() : await attendanceApi.getTodayFor(employeeId))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load today’s attendance.')
    } finally {
      setLoading(false)
    }
  }, [apply, isSelf, employeeId])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [load])

  // The clock only runs while a day is open, and restarting it on every tick
  // would be pointless churn — so the effect keys off whether it should run,
  // not off the value it produces.
  // The clock only ticks on your own page. Watching a colleague's minutes count
  // up in real time is surveillance, not information — a manager sees the same
  // figures, settled.
  const isRunning = isSelf && elapsed !== null

  // One minute is the smallest unit the card shows, so that is the interval.
  // The figure is recomputed from the anchor rather than incremented, so a
  // throttled background tab catches up instead of quietly falling behind.
  useEffect(() => {
    if (!isRunning) return
    const id = setInterval(() => {
      const at = anchor.current
      if (at) setElapsed(at.minutes + Math.floor((Date.now() - at.at) / 60_000))
    }, 60_000)
    return () => clearInterval(id)
  }, [isRunning])

  const act = async (what: 'in' | 'out') => {
    setBusy(true)
    setError(null)
    try {
      apply(what === 'in' ? await attendanceApi.checkIn() : await attendanceApi.checkOut())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That did not go through.')
      // The server refused, so re-read rather than leaving the card guessing.
      void load()
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="card">
        <h3>Today</h3>
        <div className="empty">Loading…</div>
      </div>
    )
  }

  if (!view) {
    return (
      <div className="card">
        <h3>Today</h3>
        <div className="notice bad" role="alert">
          {error ?? 'Could not load today’s attendance.'}
        </div>
      </div>
    )
  }

  // Purely derived from state — no clock read and no ref read during render.
  const displayHours = isRunning && elapsed !== null ? elapsed / 60 : view.activeHours

  return (
    <div className="card">
      <h3>Today</h3>

      <div className="clock">{asHours(displayHours)}</div>
      <div className="eyebrow" style={{ marginBottom: 14 }}>
        {isRunning ? 'Active so far today' : 'Active on system'}
      </div>

      <div className="kv">
        <b>Status</b>
        <span>
          <span className={`chip ${STATUS_CLASS[view.status]}`}>{view.status}</span>
        </span>
      </div>
      <div className="kv">
        <b>Check-in</b>
        <span>
          {view.loginAt ?? '—'}
          {view.lateByMinutes > 0 && (
            <span className="hint" style={{ color: 'var(--red)' }}>
              {view.lateByMinutes} min late
            </span>
          )}
        </span>
      </div>
      <div className="kv">
        <b>Check-out</b>
        <span>{view.logoutAt ?? '—'}</span>
      </div>
      <div className="kv">
        <b>Shift</b>
        <span>
          {view.shiftStart}–{view.shiftEnd}
        </span>
      </div>

      {error && (
        <div className="notice bad mt8" role="alert">
          {error}
        </div>
      )}

      {/* Only the person themselves can punch. A manager sees the record; they
          cannot check somebody in, and there is no endpoint that would let them. */}
      {!isSelf ? (
        <div className="hint" style={{ marginTop: 14 }}>
          {employeeName.split(' ')[0]} records this on their own page.
        </div>
      ) : (
      <div style={{ marginTop: 14 }}>
        {view.canCheckIn && (
          <button className="btn success" onClick={() => void act('in')} disabled={busy}>
            {busy ? 'Recording…' : 'Check in'}
          </button>
        )}
        {view.canCheckOut && (
          <button className="btn ghost" onClick={() => void act('out')} disabled={busy}>
            {busy ? 'Recording…' : 'Check out'}
          </button>
        )}
        {!view.canCheckIn && !view.canCheckOut && (
          <div className="hint">Your day is recorded. Nothing more to do.</div>
        )}
      </div>
      )}
    </div>
  )
}
