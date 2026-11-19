import { useState, type FormEvent } from 'react'
import { attendanceApi } from './attendance.api'
import { DAY_EDIT_STATUSES, type DayEditStatus, type WeekBar } from './attendance.types'
import { fmtDate } from '../../shared/lib/date'
import { Modal } from '../../shared/ui/Modal'

/*
 * An admin correcting one day of somebody else's attendance.
 *
 * The leave kinds are not a label on the calendar: the server writes them as
 * approved leave, so the balance and loss of pay move exactly as if the leave
 * had been applied for and approved. That is said on the form, because an admin
 * choosing "Earned leave" is spending the employee's balance.
 */

const HALF: DayEditStatus[] = ['Half earned leave', 'LOP half day']
/** Choices with no working times: the whole day was not worked. */
const NO_TIMES: DayEditStatus[] = ['Earned leave', 'LOP full day', 'Weekly off']

/** The status the day already has, as the closest choice on this form. */
function initialStatus(bar: WeekBar): DayEditStatus {
  const unpaid = bar.leaveType === 'Unpaid'
  if (bar.status === 'Leave') return unpaid ? 'LOP full day' : 'Earned leave'
  if (bar.status === 'Half day') return unpaid ? 'LOP half day' : 'Half earned leave'
  if (bar.status === 'Weekly off') return 'Weekly off'
  return 'Present'
}

const HINT: Record<DayEditStatus, string> = {
  Present: 'Saved as a manual check-in. Any single-day leave on this date is cancelled.',
  'Earned leave': 'Recorded as approved earned leave — 1 day from the balance. Anything the balance cannot cover becomes loss of pay.',
  'Half earned leave': 'Recorded as approved earned leave — 0.5 day from the balance. Times are the half that was worked.',
  'LOP full day': 'Recorded as approved unpaid leave — 1 day of loss of pay.',
  'LOP half day': 'Recorded as approved unpaid leave — 0.5 day of loss of pay. Times are the half that was worked.',
  'Weekly off': 'A paid day off for this date only — no loss of pay. Any single-day leave on it is cancelled and the check-in is cleared.',
}

export function EditDayModal({
  employeeId,
  bar,
  isToday,
  onClose,
  onSaved,
}: {
  employeeId: number
  bar: WeekBar
  isToday: boolean
  onClose: () => void
  onSaved: (message: string) => void
}) {
  // A day read from activity slots has several stretches; the first start and
  // the last end are the closest single punch to offer as a starting point.
  const first = bar.segments[0]
  const last = bar.segments[bar.segments.length - 1]

  const [status, setStatus] = useState<DayEditStatus>(initialStatus(bar))
  const [loginAt, setLoginAt] = useState(first?.from ?? '')
  const [logoutAt, setLogoutAt] = useState(last?.to && last.to !== '24:00' ? last.to : '')
  const [session, setSession] = useState<'first' | 'second'>('first')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isHalf = HALF.includes(status)
  const noTimes = NO_TIMES.includes(status)

  const problem = (): string | null => {
    if (note.trim().length < 3) return 'Add a short reason for this change.'
    if (status === 'Present' && !loginAt) return 'A present day needs a check-in time.'
    if (!noTimes && loginAt && !logoutAt && !isToday) return 'Add a check-out time.'
    if (!noTimes && !loginAt && logoutAt) return 'A check-out needs a check-in before it.'
    return null
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const why = problem()
    if (why) {
      setError(why)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const result = await attendanceApi.editDay(employeeId, bar.date, {
        status,
        loginAt: noTimes ? null : loginAt || null,
        logoutAt: noTimes ? null : logoutAt || null,
        halfDaySession: isHalf ? session : null,
        note: note.trim(),
      })
      onSaved(result.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this day.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={`Edit attendance — ${bar.dayName} ${fmtDate(bar.date)}`}
      onClose={onClose}
      onSubmit={submit}
      busy={busy}
      error={error}
      maxWidth={520}
      confirm={
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save day'}
        </button>
      }
    >
      <div className="f">
        <label htmlFor="editDayStatus">Status</label>
        <select
          id="editDayStatus"
          value={status}
          onChange={(e) => setStatus(e.target.value as DayEditStatus)}
          disabled={busy}
        >
          {DAY_EDIT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <p className="hint mt8">{HINT[status]}</p>
      </div>

      {isHalf && (
        <div className="f" style={{ marginTop: 12 }}>
          <label htmlFor="editDaySession">Which half was leave</label>
          <select
            id="editDaySession"
            value={session}
            onChange={(e) => setSession(e.target.value as 'first' | 'second')}
            disabled={busy}
          >
            <option value="first">Session 1 — First half</option>
            <option value="second">Session 2 — Second half</option>
          </select>
        </div>
      )}

      {!noTimes && (
        <div className="grid g2" style={{ marginTop: 12 }}>
          <div className="f">
            <label htmlFor="editDayIn">
              Check-in{status === 'Present' && <span style={{ color: 'var(--red)' }}> *</span>}
            </label>
            <input
              id="editDayIn"
              type="time"
              value={loginAt}
              onChange={(e) => setLoginAt(e.target.value)}
              disabled={busy}
            />
          </div>
          <div className="f">
            <label htmlFor="editDayOut">Check-out{isToday && ' (blank = still in)'}</label>
            <input
              id="editDayOut"
              type="time"
              value={logoutAt}
              onChange={(e) => setLogoutAt(e.target.value)}
              disabled={busy}
            />
          </div>
        </div>
      )}

      <div className="f" style={{ marginTop: 12 }}>
        <label htmlFor="editDayNote">
          Reason <span style={{ color: 'var(--red)' }}>*</span>
        </label>
        <textarea
          id="editDayNote"
          rows={3}
          maxLength={255}
          placeholder="Why this day is being corrected — kept in the audit trail."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={busy}
        />
      </div>
    </Modal>
  )
}
