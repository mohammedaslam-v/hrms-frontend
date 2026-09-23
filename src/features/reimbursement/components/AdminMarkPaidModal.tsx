import { useState, type FormEvent } from 'react'
import { formatInr } from '../../../shared/lib/format'
import { reimbursementApi } from '../reimbursement.api'
import type { ReimbursementItem } from '../reimbursement.types'

interface AdminMarkPaidModalProps {
  claim: ReimbursementItem
  onClose: () => void
  onSuccess: () => void
}

export function AdminMarkPaidModal({
  claim,
  onClose,
  onSuccess,
}: AdminMarkPaidModalProps) {
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [paymentReference, setPaymentReference] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!paymentDate) {
      setError('Please select a payment date.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await reimbursementApi.markPaid(claim.id, {
        paymentDate,
        paymentReference: paymentReference.trim() || undefined,
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not mark as paid.')
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
            <b style={{ fontSize: 16, color: 'var(--ink)' }}>Record Reimbursement Payout</b>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--muted)' }}>Disbursal Amount:</span>
                <b style={{ fontSize: 16, color: 'var(--green, #0f9d63)' }}>
                  {formatInr(claim.approvedAmount ?? claim.claimAmount)}
                </b>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                Claim: {claim.title} ({claim.category})
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
                Payment / Disbursal Date *
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                style={{
                  width: '100%',
                  height: 38,
                  borderRadius: 6,
                  border: '1px solid var(--line2)',
                  padding: '0 10px',
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
                Razorpay Payout ID / Transaction Ref
              </label>
              <input
                type="text"
                placeholder="e.g. pout_O8dJ890sD / UTR202609228892"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                style={{
                  width: '100%',
                  height: 38,
                  borderRadius: 6,
                  border: '1px solid var(--line2)',
                  padding: '0 12px',
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
              {submitting ? 'Recording…' : 'Mark as Disbursed'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
