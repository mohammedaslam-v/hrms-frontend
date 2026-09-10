import { useEffect, useState, type FormEvent } from 'react'
import { leaveApi } from '../leave.api'
import { Modal } from '../../../shared/ui/Modal'
import { messageOf } from '../../../shared/api/errors'
import type { HalfDaySession, LeavePreview, LeaveType, MyLeaveView } from '../leave.types'

interface LeaveApplyModalProps {
  onApplied: (view: MyLeaveView) => void
  onClose: () => void
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

export function LeaveApplyModal({ onApplied, onClose }: LeaveApplyModalProps) {
  const [leaveType, setLeaveType] = useState<LeaveType>('Earned')
  const [fromDate, setFromDate] = useState(tomorrow)
  const [toDate, setToDate] = useState(tomorrow)
  const [isHalfDay, setIsHalfDay] = useState(false)
  const [halfDaySession, setHalfDaySession] = useState<HalfDaySession>('first')
  const [reason, setReason] = useState('')
  const [preview, setPreview] = useState<LeavePreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // The preview is authoritative — the same service that validates the request
  // computes it, so the form can never promise something the server will refuse.
  useEffect(() => {
    if (!fromDate || !toDate) return
    let cancelled = false
    const timer = setTimeout(() => {
      leaveApi
        .preview(fromDate, toDate, leaveType, isHalfDay)
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
  }, [fromDate, toDate, leaveType, isHalfDay])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const view = await leaveApi.apply({
        leaveType,
        fromDate,
        toDate,
        isHalfDay,
        halfDaySession: isHalfDay ? halfDaySession : null,
        reason,
      })
      onApplied(view)
    } catch (err) {
      setError(messageOf(err, 'Could not submit your request.'))
      setSubmitting(false)
    }
  }

  const noticeTone =
    preview && !preview.canSubmit ? '' : preview && preview.unpaidDays > 0 ? '' : 'blue'

  return (
    <Modal
      title="Apply for leave"
      onClose={onClose}
      onSubmit={submit}
      busy={submitting}
      error={error}
      confirm={
        <button
          className="btn primary"
          type="submit"
          disabled={submitting || !preview?.canSubmit || !reason.trim()}
        >
        {submitting ? 'Sending…' : 'Send for approval'}
      </button>
    }
  >

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
        <div className={`notice ${noticeTone}`} style={{ marginTop: 14 }}>
          <b>
            {preview.days} day{preview.days === 1 ? '' : 's'}
          </b>
          {preview.skippedDays > 0 && (
            <> · {preview.skippedDays} weekly off/holiday skipped</>
          )}
          <br />
          {preview.message}
        </div>
      )}

    </Modal>
  )
}
