import { useState, type FormEvent } from 'react'
import { formatInr } from '../../../shared/lib/format'
import { reimbursementApi } from '../reimbursement.api'
import type { ReimbursementItem } from '../reimbursement.types'

interface AdminApprovalModalProps {
  claim: ReimbursementItem
  onClose: () => void
  onSuccess: () => void
}

export function AdminApprovalModal({
  claim,
  onClose,
  onSuccess,
}: AdminApprovalModalProps) {
  const [approvedAmount, setApprovedAmount] = useState<string>(String(claim.claimAmount))
  const [adminNotes, setAdminNotes] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedAmount = parseFloat(approvedAmount)
  const isAdjusted = !isNaN(parsedAmount) && parsedAmount !== claim.claimAmount

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid approved amount greater than ₹0.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await reimbursementApi.approveClaim(claim.id, {
        approvedAmount: parsedAmount,
        adminNotes: adminNotes.trim() || undefined,
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not approve claim.')
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
          maxWidth: 520,
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
            <b style={{ fontSize: 16, color: 'var(--ink)' }}>Approve Reimbursement Claim</b>
            <small style={{ color: 'var(--muted)', fontSize: 12, display: 'block' }}>
              Ref: {claim.ref} · {claim.employeeName} ({claim.employeeCode})
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

            {/* Claim details review */}
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: 'var(--bg, #f8fafc)',
                border: '1px solid var(--line2)',
                fontSize: 13,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--muted)' }}>Claim Title:</span>
                <b style={{ color: 'var(--ink)' }}>{claim.title}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--muted)' }}>Category & Date:</span>
                <span>{claim.category} · {claim.expenseDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Original Requested:</span>
                <b style={{ color: 'var(--blue, #2563eb)' }}>{formatInr(claim.claimAmount)}</b>
              </div>
            </div>

            {/* Editable Approved Amount */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
                Approved Amount (₹) *
              </label>
              <span style={{ fontSize: 11.5, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                You can adjust this amount according to company policy or per-diem caps.
              </span>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--muted)',
                    fontWeight: 700,
                  }}
                >
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                  style={{
                    width: '100%',
                    height: 42,
                    borderRadius: 6,
                    border: '1px solid var(--line2)',
                    paddingLeft: 30,
                    paddingRight: 12,
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--green, #0f9d63)',
                  }}
                  required
                />
              </div>

              {isAdjusted && (
                <div
                  style={{
                    marginTop: 8,
                    padding: '6px 10px',
                    borderRadius: 4,
                    background: '#fef3c7',
                    color: '#92400e',
                    fontSize: 12,
                  }}
                >
                  ℹ️ Requested amount of {formatInr(claim.claimAmount)} will be modified to {formatInr(parsedAmount || 0)}.
                </div>
              )}
            </div>

            {/* Remarks / Policy Note */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink2)', marginBottom: 6 }}>
                Approval Remarks / Policy Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Approved with per-diem conveyance cap"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: 6,
                  border: '1px solid var(--line2)',
                  padding: 10,
                  fontSize: 13,
                }}
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
            <button type="submit" className="btn primary" disabled={submitting}>
              {submitting ? 'Approving…' : `Approve ${formatInr(parsedAmount || claim.claimAmount)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
