import { useState, type FormEvent } from 'react'
import { approvalsApi } from '../leave.api'
import { Modal } from '../../../shared/ui/Modal'
import { messageOf } from '../../../shared/api/errors'
import { fmtShort } from '../../../shared/lib/date'
import { HALF_DAY_LABEL, type ApprovalsView, type LeaveRequest } from '../leave.types'

interface DeleteLeaveModalProps {
  leave: LeaveRequest & { employeeName: string }
  onSuccess: (view: ApprovalsView, message: string) => void
  onClose: () => void
}

/**
 * Admin-only. Unlike cancelling, which keeps the row in the log, this removes
 * the request for good — so the dialog spells out what changes before asking
 * for a reason.
 */
export function DeleteLeaveModal({ leave, onSuccess, onClose }: DeleteLeaveModalProps) {
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isApproved = leave.status === 'Approved'
  const paidDays = Math.max(0, Math.round((leave.days - leave.unpaidDays) * 10) / 10)
  const canSubmit = !submitting && note.trim().length >= 3

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setError(null)
    setSubmitting(true)
    try {
      const result = await approvalsApi.deleteRequest(leave.id, note.trim())
      onSuccess(result.view, result.message)
      onClose()
    } catch (err) {
      setError(messageOf(err, 'Could not delete this leave request.'))
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={`Delete leave — ${leave.ref}`}
      onClose={onClose}
      onSubmit={handleSubmit}
      busy={submitting}
      error={error}
      maxWidth={520}
      confirm={
        <button
          className="btn danger"
          type="submit"
          disabled={!canSubmit}
          style={{ minWidth: 140 }}
          title={canSubmit ? undefined : 'Enter a reason (minimum 3 characters)'}
        >
          {submitting ? 'Deleting…' : 'Yes, delete'}
        </button>
      }
    >
      <div
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          padding: '12px 14px',
          marginBottom: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <b style={{ fontSize: 14, color: 'var(--ink)' }}>{leave.employeeName}</b>
          <span className={`chip ${leave.leaveType === 'Unpaid' ? 'c-abs' : 'c-leave'}`}>{leave.leaveType}</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink2)' }}>
          {leave.days} day{leave.days === 1 ? '' : 's'} · {fmtShort(leave.fromDate)}
          {leave.fromDate !== leave.toDate && <> to {fmtShort(leave.toDate)}</>}
          {leave.isHalfDay && leave.halfDaySession && <> · {HALF_DAY_LABEL[leave.halfDaySession]}</>}
          {' · '}
          <span>{leave.status}</span>
        </div>
        {leave.reason && (
          <div style={{ fontSize: 12.5, color: 'var(--muted)', fontStyle: 'italic' }}>"{leave.reason}"</div>
        )}
      </div>

      {isApproved ? (
        <div className="notice bad" style={{ marginBottom: 12 }}>
          <b>This leave is approved.</b> Deleting it:
          <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12.5, lineHeight: 1.6 }}>
            {paidDays > 0 && (
              <li>
                returns <b>{paidDays} day{paidDays === 1 ? '' : 's'}</b> to the leave balance
              </li>
            )}
            {leave.unpaidDays > 0 && (
              <li>
                removes <b>{leave.unpaidDays} day{leave.unpaidDays === 1 ? '' : 's'}</b> of loss of pay from salary
              </li>
            )}
            <li>clears the leave from the attendance calendar for these dates</li>
            <li>a past working day with no check-in will then read as Absent</li>
          </ul>
        </div>
      ) : (
        <div className="notice bad" style={{ marginBottom: 12 }}>
          This {leave.status.toLowerCase()} request will be removed from the log. It has not
          touched the balance or attendance, so nothing else changes.
        </div>
      )}

      <p className="hint" style={{ marginBottom: 12 }}>
        This cannot be undone. The full request is kept in the audit log with your reason.
      </p>

      <div className="f">
        <label htmlFor="deleteLeaveNote">
          Reason <span style={{ color: '#DC2626' }}>*</span>
        </label>
        <textarea
          id="deleteLeaveNote"
          placeholder="Why is this leave being deleted? (minimum 3 characters)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={submitting}
          required
          rows={3}
        />
      </div>
    </Modal>
  )
}
