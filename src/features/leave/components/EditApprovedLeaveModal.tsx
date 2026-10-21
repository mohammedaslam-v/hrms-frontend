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
  const [isHalfDay, setIsHalfDay] = useState<boolean>(
    Boolean(leave.isHalfDay || leave.days === 0.5),
  )
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
        .preview(fromDate, toDate, leaveType, isHalfDay, leave.employeeId, leave.id)
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
  }, [fromDate, toDate, leaveType, isHalfDay, leave.employeeId, leave.id])

  const calculatedDays = isHalfDay ? 0.5 : preview?.days ?? leave.days
  const daysExtended = Math.round(Math.max(0, calculatedDays - leave.days) * 10) / 10
  const daysReduced = Math.round(Math.max(0, leave.days - calculatedDays) * 10) / 10
  const isZeroDays = Boolean(fromDate && toDate && !isHalfDay && calculatedDays <= 0)

  const canSubmit =
    !submitting &&
    !isZeroDays &&
    Boolean(fromDate && toDate) &&
    calculatedDays > 0 &&
    adminNote.trim().length >= 3 &&
    preview?.canSubmit !== false

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

  const submitDisabledReason = !canSubmit
    ? isZeroDays
      ? 'Selected date range contains 0 working days'
      : adminNote.trim().length < 3
        ? 'Please enter an admin reason (minimum 3 characters)'
        : !fromDate || !toDate
          ? 'From and To dates are required'
          : undefined
    : undefined

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
          title={submitDisabledReason}
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
              background: '#DCFCE7',
              color: '#166534',
              display: 'inline-block',
            }}
          >
            Approved: {leave.days} day{leave.days === 1 ? '' : 's'}
          </span>
          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
            Original Type: {leave.leaveType}
          </div>
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
      {preview?.existingLeave ? (
        <div style={{ marginTop: 14 }}>
          <div className="notice bad" role="alert">
            <strong>⚠️ Overlapping Leave Request</strong>
            <div style={{ marginTop: 4, fontSize: 12.5 }}>
              Selected dates overlap with existing {preview.existingLeave.status.toLowerCase()} request{' '}
              <b>{preview.existingLeave.ref}</b> ({preview.existingLeave.fromDate} to {preview.existingLeave.toDate}). Cannot overlap with another leave.
            </div>
          </div>
        </div>
      ) : isZeroDays ? (
        <div style={{ marginTop: 14 }}>
          <div className="notice bad" role="alert">
            <strong>⚠️ 0 working days in selected range</strong>
            <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.5 }}>
              The selected dates contain <b>0 working days</b> (the range falls entirely on a weekly off or holiday). An approved leave cannot have a duration of 0 days.
              <br />
              • If this is a half-day leave, change <b>Half day</b> to <b>Yes — half day (0.5 day)</b>.
              <br />
              • Otherwise, select dates on working days, or cancel the request if it is no longer required.
            </div>
          </div>
        </div>
      ) : daysExtended > 0 ? (
        <div style={{ marginTop: 14 }}>
          <div className="notice" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF' }}>
            <strong>ℹ️ Duration extended by {daysExtended} day(s)</strong>
            <div style={{ marginTop: 4, fontSize: 12.5 }}>
              New duration: <b>{calculatedDays} day(s)</b> (originally {leave.days} days).
              <br />
              The employee's leave balance will be updated accordingly. Any past attendance marked during this period will be automatically removed/soft-deleted.
            </div>
          </div>
        </div>
      ) : daysReduced > 0 ? (
        <div style={{ marginTop: 14 }}>
          <div className="notice" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF' }}>
            <strong>✅ Duration shortened by {daysReduced} day(s)</strong>
            <div style={{ marginTop: 4, fontSize: 12.5 }}>
              New duration: <b>{calculatedDays} day(s)</b> (originally {leave.days} days).
              <br />
              <b>{daysReduced} day(s)</b> will be automatically credited back to the employee's available leave balance.
            </div>
          </div>
        </div>
      ) : null}

      {/* Admin Modification Note */}
      <div className="f" style={{ marginTop: 14 }}>
        <label htmlFor="editAdminNote">
          Admin Reason / Justification <span style={{ color: '#DC2626' }}>*</span>
        </label>
        <textarea
          id="editAdminNote"
          placeholder="State the reason for modifying this approved leave (minimum 3 characters)..."
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          disabled={submitting}
          required
          rows={3}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <span style={{ fontSize: 11.5, color: '#64748B' }}>
            This note is logged in the permanent audit trail and appended to the leave record.
          </span>
          {adminNote.length > 0 && adminNote.trim().length < 3 && (
            <span style={{ fontSize: 11.5, color: '#DC2626', fontWeight: 500 }}>
              Minimum 3 characters required ({adminNote.trim().length}/3)
            </span>
          )}
        </div>
      </div>
    </Modal>
  )
}
