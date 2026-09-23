import { useState, type FormEvent } from 'react'
import { reimbursementApi } from '../reimbursement.api'
import type { ReimbursementItem } from '../reimbursement.types'

interface AdminRejectionModalProps {
  claim: ReimbursementItem
  onClose: () => void
  onSuccess: () => void
}

export function AdminRejectionModal({
  claim,
  onClose,
  onSuccess,
}: AdminRejectionModalProps) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Please provide a reason for rejecting the reimbursement request.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await reimbursementApi.rejectClaim(claim.id, {
        reason: reason.trim(),
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reject claim.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose()
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 500,
          backgroundColor: 'var(--panel)',
          borderRadius: 12,
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--line2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <b style={{ fontSize: 16, color: 'var(--red, #ef4444)' }}>Reject Reimbursement Claim</b>
            <small style={{ color: 'var(--muted)', fontSize: 12, display: 'block' }}>
              Ref: {claim.ref} · {claim.employeeName}
            </small>
          </div>
          <button
            type="button"
            className="btn ghost sm"
            onClick={onClose}
            disabled={submitting}
            style={{ minWidth: 32, padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 6,
                  backgroundColor: 'var(--red-soft, #fef2f2)',
                  color: 'var(--red, #ef4444)',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <div
              style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: 'var(--bg, #f8fafc)',
                border: '1px solid var(--line2)',
                fontSize: 13,
              }}
            >
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: 'var(--muted)' }}>Claim Title: </span>
                <b>{claim.title}</b>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                Category: {claim.category} · Date: {claim.expenseDate}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
                Reason for Rejection *
              </label>
              <span style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>
                This reason will be visible to the employee on their reimbursement dashboard.
              </span>
              <textarea
                rows={4}
                placeholder="e.g. Original GST receipt/tax invoice is missing, or expense was not pre-authorized as per company policy."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: 6,
                  border: '1px solid var(--line2)',
                  padding: 10,
                  fontSize: 13,
                  resize: 'vertical',
                }}
                required
              />
            </div>
          </div>

          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--line2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10,
              backgroundColor: 'var(--panel)',
            }}
          >
            <button type="button" className="btn ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={submitting}
              style={{ backgroundColor: 'var(--red, #ef4444)', borderColor: 'var(--red, #ef4444)' }}
            >
              {submitting ? 'Rejecting…' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
