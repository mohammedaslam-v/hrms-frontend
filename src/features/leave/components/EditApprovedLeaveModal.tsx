import { useEffect, useState, type FormEvent } from 'react'
import { approvalsApi, leaveApi } from '../leave.api'
import { Modal } from '../../../shared/ui/Modal'
import { messageOf } from '../../../shared/api/errors'
import type {
  ApprovalsView,
  HalfDaySession,
  LeavePreview,
  LeaveRequest,
  LeaveType,
} from '../leave.types'

interface EditApprovedLeaveModalProps {
  leave: LeaveRequest & { employeeName: string }
  onSuccess: (view: ApprovalsView, message: string) => void
  onClose: () => void
}

const TYPES: { value: LeaveType; label: string }[] = [
  { value: 'Casual', label: 'Casual leave' },
  { value: 'Sick', label: 'Sick leave' },
  { value: 'Earned', label: 'Earned leave' },
  { value: 'Unpaid', label: 'Unpaid — loss of pay' },
]

export function EditApprovedLeaveModal({
  leave,
  onSuccess,
  onClose,
}: EditApprovedLeaveModalProps) {
  const [leaveType, setLeaveType] = useState<LeaveType>(leave.leaveType)
  const [fromDate, setFromDate] = useState<string>(
    leave.fromDate ? leave.fromDate.slice(0, 10) : '',
  )
  const [toDate, setToDate] = useState<string>(
    leave.toDate ? leave.toDate.slice(0, 10) : '',
  )
  const [isHalfDay, setIsHalfDay] = useState<boolean>(Boolean(leave.isHalfDay))
  const [halfDaySession, setHalfDaySession] = useState<HalfDaySession>(
    leave.halfDaySession || 'first',
  )
  const [adminNote, setAdminNote] = useState<string>('')
  const [preview, setPreview] = useState<LeavePreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Live preview calculation via backend policy engine
  useEffect(() => {
    if (!fromDate || !toDate) return
    let cancelled = false
    const timer = setTimeout(() => {
      leaveApi
        .preview(fromDate, toDate, leaveType, isHalfDay, leave.employeeId)
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
  }, [fromDate, toDate, leaveType, isHalfDay, leave.employeeId])

  const calculatedDays = isHalfDay ? 0.5 : preview?.days ?? leave.days
  const isExtending = calculatedDays > leave.days
  const daysReduced = Math.round(Math.max(0, leave.days - calculatedDays) * 10) / 10

  const canSubmit =
    !submitting &&
    !isExtending &&
    Boolean(fromDate && toDate) &&
    calculatedDays > 0 &&
    adminNote.trim().length >= 3

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setError(null)
    setSubmitting(true)

    try {
      const result = await approvalsApi.editApproved(leave.id, {
        fromDate,
        toDate,
        isHalfDay,
        halfDaySession: isHalfDay ? halfDaySession : null,
        leaveType,
        adminNote: adminNote.trim(),
      })

      onSuccess(result.view, result.message)
      onClose()
    } catch (err) {
      setError(messageOf(err, 'Could not update approved leave.'))
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={`Edit Approved Leave — ${leave.ref}`}
      onClose={onClose}
      onSubmit={handleSubmit}
      busy={submitting}
      error={error}
      confirm={
        <button
          className="btn primary"
          type="submit"
          disabled={!canSubmit}
          style={{ minWidth: 140 }}
        >
          {submitting ? 'Saving…' : 'Save Changes'}
        </button>
      }
    >
      {/* Employee Reference Card */}
      <div
        style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
          padding: '12px 14px',
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div>
          <strong style={{ fontSize: 14, color: '#1E293B', display: 'block' }}>
            {leave.employeeName}
          </strong>
          <span style={{ fontSize: 12, color: '#64748B' }}>
            Reference: {leave.ref} · Approved on {leave.appliedOn || 'Record'}
          </span>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: '3px 9px',
              borderRadius: 6,
              background: '#F1F5F9',
              color: '#475569',
              display: 'inline-block',
            }}
          >
            {leave.leaveType}
          </span>
        </div>
      </div>

      <div className="grid g2">
        {/* Leave Type */}
        <div className="f">
          <label htmlFor="editLeaveType">Leave type</label>
          <select
            id="editLeaveType"
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

        {/* Half Day */}
        <div className="f">
          <label htmlFor="editHalfDay">Half day</label>
          <select
            id="editHalfDay"
            value={isHalfDay ? '1' : '0'}
            onChange={(e) => {
              const half = e.target.value === '1'
              setIsHalfDay(half)
              if (half) setToDate(fromDate)
            }}
            disabled={submitting}
          >
            <option value="0">No — full days</option>
            <option value="1">Yes — half day (0.5 day)</option>
          </select>
        </div>

        {/* Half Day Session */}
        {isHalfDay && (
          <div className="f">
            <label htmlFor="editHalfDaySession">Which half</label>
            <select
              id="editHalfDaySession"
              value={halfDaySession}
              onChange={(e) => setHalfDaySession(e.target.value as HalfDaySession)}
              disabled={submitting}
            >
              <option value="first">Session 1 — First Half</option>
              <option value="second">Session 2 — Second Half</option>
            </select>
          </div>
        )}
        {isHalfDay && <div className="f" aria-hidden />}

        {/* From Date */}
        <div className="f">
          <label htmlFor="editFromDate">From</label>
          <input
            id="editFromDate"
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value)
              if (isHalfDay || e.target.value > toDate) {
                setToDate(e.target.value)
              }
            }}
            disabled={submitting}
            required
          />
        </div>

        {/* To Date */}
        <div className="f">
          <label htmlFor="editToDate">To</label>
          <input
            id="editToDate"
            type="date"
            value={toDate}
            min={fromDate}
            disabled={isHalfDay || submitting}
            onChange={(e) => setToDate(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Live Impact Feedback */}
      {(isExtending || daysReduced > 0) && (
        <div style={{ marginTop: 14 }}>
          {isExtending ? (
            <div className="notice bad" role="alert">
              <strong>⚠️ Cannot extend leave duration</strong>
              <div style={{ marginTop: 4, fontSize: 12.5 }}>
                The selected date range results in <b>{calculatedDays} working day(s)</b>, which
                exceeds the original approved duration of <b>{leave.days} day(s)</b>.
                <br />
                If the employee requires additional leave days, they should submit a new leave request.
              </div>
            </div>
          ) : (
            <div className="notice" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF' }}>
              <strong>✅ Duration shortened by {daysReduced} day(s)</strong>
              <div style={{ marginTop: 4, fontSize: 12.5 }}>
                New duration: <b>{calculatedDays} day(s)</b> (originally {leave.days} days).
                <br />
                <b>{daysReduced} day(s)</b> will be automatically credited back to the employee's available leave balance.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Modification Note */}
      <div className="f" style={{ marginTop: 14 }}>
        <label htmlFor="editAdminNote">
          Admin Reason / Justification <span style={{ color: '#DC2626' }}>*</span>
        </label>
        <textarea
          id="editAdminNote"
          placeholder="State the reason for modifying this approved leave..."
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          disabled={submitting}
          required
          rows={3}
        />
        <span style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>
          This note is logged in the permanent audit trail and appended to the leave record.
        </span>
      </div>
    </Modal>
  )
}
