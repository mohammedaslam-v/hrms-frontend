import { useCallback, useEffect, useRef, useState } from 'react'
import { attendanceApi } from './attendance.api'
import { STATUS_CLASS, type TodayView } from './attendance.types'
import { asHours } from '../../shared/lib/format'
import { Modal } from '../../shared/ui/Modal'

const minutesOf = (time: string): number => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/**
 * Today — the check-in card.
 *
 * Every employee gets it on their own page, and admins can also view/punch
 * when visiting an employee's dashboard from the team directory.
 */
interface TodayCardProps {
  employeeId: number
  isSelf: boolean
  isAdmin?: boolean
  /** First name, for the wording when this is somebody else's day. */
  employeeName: string
}

export function TodayCard({ employeeId, isSelf, isAdmin, employeeName }: TodayCardProps) {
  const [view, setView] = useState<TodayView | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCheckOutConfirm, setShowCheckOutConfirm] = useState(false)

  const canPunch = isSelf || Boolean(isAdmin)

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

  const isRunning = canPunch && elapsed !== null

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
      let next: TodayView
      if (what === 'in') {
        next = isSelf ? await attendanceApi.checkIn() : await attendanceApi.checkInFor(employeeId)
      } else {
        next = isSelf ? await attendanceApi.checkOut() : await attendanceApi.checkOutFor(employeeId)
      }
      apply(next)
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
  const isCheckedIn = Boolean(view.loginAt && !view.logoutAt)
  const isCheckedOut = Boolean(view.loginAt && view.logoutAt)

  return (
    <div className="card top-card">
      <h3 style={{ margin: 0, marginBottom: 8 }}>Today</h3>

      <div className="clock" style={{ fontSize: 32, marginBottom: 2 }}>{asHours(displayHours)}</div>
      <div className="eyebrow" style={{ marginBottom: 10 }}>
        {isRunning ? 'Active so far today' : 'Active on system'}
      </div>

      <div className="kv" style={{ padding: '5.5px 0', fontSize: 12.5 }}>
        <b>Status</b>
        <span>
          <span className={`chip ${STATUS_CLASS[view.status]}`}>{view.status}</span>
        </span>
      </div>
      <div className="kv" style={{ padding: '5.5px 0', fontSize: 12.5 }}>
        <b>Check-in</b>
        <span>
          {view.loginAt ?? '—'}
          {view.status === 'Late' && view.lateByMinutes > 15 && (
            <span className="hint" style={{ color: 'var(--red)', marginLeft: 6 }}>
              {view.lateByMinutes} min late
            </span>
          )}
        </span>
      </div>
      {view.recheckInAt && (
        <div className="kv" style={{ padding: '5.5px 0', fontSize: 12.5 }}>
          <b>Re-check-in</b>
          <span>
            {view.recheckInAt}
            <span className="hint" style={{ color: 'var(--muted)', marginLeft: 6 }}>
              (resumed)
            </span>
          </span>
        </div>
      )}
      <div className="kv" style={{ padding: '5.5px 0', fontSize: 12.5 }}>
        <b>Check-out</b>
        <span>{view.logoutAt ?? '—'}</span>
      </div>
      <div className="kv" style={{ padding: '5.5px 0', fontSize: 12.5 }}>
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

      {!canPunch ? (
        <div className="hint" style={{ marginTop: 'auto', paddingTop: 8 }}>
          {employeeName.split(' ')[0]} records this on their own page.
        </div>
      ) : (
        <div style={{ marginTop: 'auto', paddingTop: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn success"
              onClick={() => void act('in')}
              disabled={busy || isCheckedIn}
              style={{
                flex: 1,
                minHeight: 38,
                fontWeight: 600,
                opacity: isCheckedIn ? 0.45 : 1,
                cursor: isCheckedIn ? 'not-allowed' : 'pointer',
              }}
              title={
                isCheckedIn
                  ? 'Already checked in'
                  : isCheckedOut
                    ? 'Check in again'
                    : 'Check in for today'
              }
            >
              {busy && !isCheckedIn ? 'Recording…' : isCheckedOut ? 'Check in' : 'Check in'}
            </button>

            <button
              type="button"
              className="btn danger"
              onClick={() => setShowCheckOutConfirm(true)}
              disabled={busy || !isCheckedIn}
              style={{
                flex: 1,
                minHeight: 38,
                fontWeight: 600,
                boxShadow: isCheckedIn ? '0 2px 8px rgba(220, 62, 67, 0.25)' : 'none',
                opacity: !isCheckedIn ? 0.45 : 1,
                cursor: !isCheckedIn ? 'not-allowed' : 'pointer',
              }}
              title={
                !isCheckedIn
                  ? isCheckedOut
                    ? 'Please check in again to check out'
                    : 'Please check in first'
                  : 'Check out for today'
              }
            >
              {busy && isCheckedIn ? 'Recording…' : 'Check out'}
            </button>
          </div>

          {isCheckedOut && !isCheckedIn && (
            <div className="hint" style={{ marginTop: 6, fontSize: 12, textAlign: 'center' }}>
              Checked out for today at {view.logoutAt}.
            </div>
          )}
          {!isSelf && isAdmin && (
            <div className="hint" style={{ marginTop: 4, fontSize: 11, textAlign: 'center', color: 'var(--muted)' }}>
              Admin action on behalf of {employeeName.split(' ')[0]}
            </div>
          )}
        </div>
      )}

      {showCheckOutConfirm && (
        <Modal
          title="Confirm Check-out"
          onClose={() => setShowCheckOutConfirm(false)}
          busy={busy}
          maxWidth={420}
          confirm={
            <button
              className="btn danger"
              type="button"
              onClick={async () => {
                setShowCheckOutConfirm(false)
                await act('out')
              }}
              disabled={busy}
              style={{ fontWeight: 600 }}
            >
              {busy ? 'Checking out…' : 'Yes, Check out'}
            </button>
          }
        >
          <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5, padding: '8px 0 16px' }}>
            {isSelf
              ? 'Are you sure you want to check out for today?'
              : `Are you sure you want to check out ${employeeName.split(' ')[0]} for today?`}
          </div>
        </Modal>
      )}
    </div>
  )
}
