import { useEffect, useState, type FormEvent } from 'react'
import { leaveApi } from '../leave.api'
import { Modal } from '../../../shared/ui/Modal'
import { messageOf } from '../../../shared/api/errors'
import type { HalfDaySession, LeavePreview, LeaveRequest, LeaveType, MyLeaveView } from '../leave.types'

interface LeaveApplyModalProps {
  employeeId?: number
  employeeName?: string
  existingRequests?: LeaveRequest[]
  onApplied: (view: MyLeaveView) => void
  onClose: () => void
}

const fmtShort = (d: string): string => {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

const STATUS_CLASS: Record<string, string> = {
  Pending: 'amber',
  Approved: 'green',
  Rejected: 'red',
  Cancelled: '',
}

const tomorrow = (): string => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

/** Only these two are offered: the policy is one pool of Earned Leave, plus loss of pay. */
const TYPES: { value: LeaveType; label: string }[] = [
  { value: 'Casual', label: 'Casual leave' },
  { value: 'Sick', label: 'Sick leave' },
  { value: 'Earned', label: 'Earned leave' },
  { value: 'Unpaid', label: 'Unpaid — loss of pay' },
]

export function LeaveApplyModal({
  employeeId,
  employeeName,
  existingRequests,
  onApplied,
  onClose,
}: LeaveApplyModalProps) {
  const [leaveType, setLeaveType] = useState<LeaveType>('Earned')
  const [fromDate, setFromDate] = useState(tomorrow)
  const [toDate, setToDate] = useState(tomorrow)
  const [isHalfDay, setIsHalfDay] = useState(false)
  const [halfDaySession, setHalfDaySession] = useState<HalfDaySession>('first')
  const [reason, setReason] = useState('')
  const [preview, setPreview] = useState<LeavePreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const upcomingBookedLeaves = (existingRequests ?? []).filter(
    (r) =>
      (r.status === 'Approved' || r.status === 'Pending') &&
      r.toDate >= new Date().toISOString().slice(0, 10),
  )

  // The preview is authoritative — the same service that validates the request
  // computes it, so the form can never promise something the server will refuse.
  useEffect(() => {
    if (!fromDate || !toDate) return
    let cancelled = false
    const timer = setTimeout(() => {
      leaveApi
        .preview(fromDate, toDate, leaveType, isHalfDay, employeeId)
        .then((p) => {
          if (!cancelled) setPreview(p)
        })
        .catch(() => {
          if (!cancelled) setPreview(null)
        })
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [fromDate, toDate, leaveType, isHalfDay, employeeId])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const view = await leaveApi.apply(
        {
          leaveType,
          fromDate,
          toDate,
          isHalfDay,
          halfDaySession: isHalfDay ? halfDaySession : null,
          reason,
        },
        employeeId,
      )
      onApplied(view)
    } catch (err) {
      setError(messageOf(err, 'Could not submit leave request.'))
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={employeeName ? `Apply for leave on behalf of ${employeeName}` : 'Apply for leave'}
      onClose={onClose}
      onSubmit={submit}
      busy={submitting}
      error={error}
      confirm={
        <button
          className="btn primary"
          type="submit"
          disabled={submitting || !preview?.canSubmit || Boolean(preview?.existingLeave) || !reason.trim()}
        >
          {submitting
            ? 'Sending…'
            : employeeId
              ? 'Submit request for employee'
              : 'Send for approval'}
        </button>
      }
    >
      {upcomingBookedLeaves.length > 0 && (
        <div
          style={{
            marginBottom: 14,
            padding: '10px 12px',
            borderRadius: 8,
            background: 'var(--surface-sunken, #f8fafc)',
            border: '1px solid var(--border, #e2e8f0)',
            fontSize: 12.5,
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--text, #1e293b)', marginBottom: 4 }}>
            📅 Already booked / upcoming leave{upcomingBookedLeaves.length > 1 ? 's' : ''}:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {upcomingBookedLeaves.map((r) => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  fontSize: 12,
                }}
              >
                <span>
                  • <b>{fmtShort(r.fromDate)}</b>
                  {r.fromDate !== r.toDate && <> to <b>{fmtShort(r.toDate)}</b></>} ({r.days}{' '}
                  day{r.days === 1 ? '' : 's'} · {r.leaveType})
                </span>
                <span
                  className={`chip ${STATUS_CLASS[r.status] ?? ''}`}
                  style={{ fontSize: 10, padding: '1px 6px' }}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid g2">
        <div className="f">
          <label htmlFor="leaveType">Leave type</label>
          <select
            id="leaveType"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as LeaveType)}
            disabled={submitting}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="f">
          <label htmlFor="halfDay">Half day</label>
          <select
            id="halfDay"
            value={isHalfDay ? '1' : '0'}
            onChange={(e) => setIsHalfDay(e.target.value === '1')}
            disabled={submitting}
          >
            <option value="0">No — full days</option>
            <option value="1">Yes — half day</option>
          </select>
        </div>
        {/* Which half matters to the employee and to the approver, so it is
            asked for rather than left implied. */}
        {isHalfDay && (
          <div className="f">
            <label htmlFor="halfDaySession">Which half</label>
            <select
              id="halfDaySession"
              value={halfDaySession}
              onChange={(e) => setHalfDaySession(e.target.value as HalfDaySession)}
              disabled={submitting}
            >
              <option value="first">Session 1 — first half</option>
              <option value="second">Session 2 — second half</option>
            </select>
          </div>
        )}
        {isHalfDay && <div className="f" aria-hidden />}

        <div className="f">
          <label htmlFor="fromDate">From</label>
          <input
            id="fromDate"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            disabled={submitting}
            required
          />
        </div>
        <div className="f">
          <label htmlFor="toDate">To</label>
          <input
            id="toDate"
            type="date"
            value={toDate}
            min={fromDate}
            onChange={(e) => setToDate(e.target.value)}
            disabled={submitting}
            required
          />
        </div>
      </div>

      <div className="f" style={{ marginTop: 14 }}>
        <label htmlFor="reason">Reason</label>
        <textarea
          id="reason"
          placeholder="A line for your manager — what's the plan, and who is covering?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={submitting}
          required
        />
      </div>

      {preview && (
        <div
          className={`notice ${preview.existingLeave || !preview.canSubmit ? 'bad' : preview.unpaidDays > 0 ? '' : 'blue'}`}
          style={{ marginTop: 14 }}
        >
          {preview.existingLeave ? (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 700,
                  fontSize: 13,
                  color: '#991b1b',
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 16 }}>⚠️</span>
                <span>Already on leave for selected dates</span>
              </div>
              <div style={{ lineHeight: 1.5, fontSize: 12.5, color: '#7f1d1d' }}>
                {employeeName ? <b>{employeeName}</b> : 'This employee'} already has an{' '}
                <span
                  className={`chip ${STATUS_CLASS[preview.existingLeave.status] ?? 'green'}`}
                  style={{ verticalAlign: 'middle', margin: '0 4px', fontSize: 11 }}
                >
                  {preview.existingLeave.status}
                </span>{' '}
                leave request (<b>{preview.existingLeave.ref}</b>) covering{' '}
                <b>{fmtShort(preview.existingLeave.fromDate)}</b>
                {preview.existingLeave.fromDate !== preview.existingLeave.toDate && (
                  <> to <b>{fmtShort(preview.existingLeave.toDate)}</b></>
                )}{' '}
                ({preview.existingLeave.days} day{preview.existingLeave.days === 1 ? '' : 's'} ·{' '}
                {preview.existingLeave.leaveType} leave).
              </div>
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9, color: '#991b1b' }}>
                Cannot apply for duplicate or overlapping leave dates. Please select different dates.
              </div>
            </div>
          ) : (
            <>
              <b>
                {preview.days} day{preview.days === 1 ? '' : 's'}
              </b>
              {preview.skippedDays > 0 && (
                <> · {preview.skippedDays} weekly off/holiday skipped</>
              )}
              <br />
              {preview.message}
            </>
          )}
        </div>
      )}

    </Modal>
  )
}
