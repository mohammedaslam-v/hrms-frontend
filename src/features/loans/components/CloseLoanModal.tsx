import { useState } from 'react'
import type { AdminLoanItem } from '../types/loans.types'

interface CloseLoanModalProps {
  loan: AdminLoanItem
  submitting: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
}

function formatInr(n: number): string {
  if (isNaN(n) || n === 0) return '₹0'
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

export function CloseLoanModal({ loan, submitting, onClose, onConfirm }: CloseLoanModalProps) {
  const [reason, setReason] = useState('Full payment settled outside payroll')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await onConfirm(reason.trim())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to close loan.')
    }
  }

  return (
    <div
      className="modal on"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 41, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          borderRadius: '16px',
          background: '#fff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
            Mark Loan as Closed
          </h3>
          <button
            type="button"
            className="btn ghost sm"
            onClick={onClose}
            disabled={submitting}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="notice bad" style={{ marginBottom: '14px' }}>
            {error}
          </div>
        )}

        <div className="notice blue" style={{ marginBottom: '16px' }}>
          <p style={{ margin: 0, fontSize: '13px' }}>
            Are you sure you want to close this loan for <b>{loan.employeeName}</b> ({loan.employeeCode})?
          </p>
          <div style={{ marginTop: '8px', fontSize: '12.5px', color: 'var(--ink2)' }}>
            • Principal: <b>{formatInr(loan.principal)}</b><br />
            • Remaining Outstanding: <b style={{ color: 'var(--amber)' }}>{formatInr(loan.outstandingAmount)}</b><br />
            • Repaid so far: <b>{formatInr(loan.repaidAmount)}</b> ({loan.paidMonths} of {loan.tenureMonths} months)
          </div>
          <div style={{ marginTop: '8px', fontSize: '11.5px', color: 'var(--muted)' }}>
            Closing this loan will stop all future monthly salary EMI deductions immediately.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="fgrid">
          <div className="f">
            <label>Closure Reason / Notes *</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Employee settled via bank transfer / full cash settlement"
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button
              type="button"
              className="btn ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn primary"
              style={{ background: 'var(--amber)', borderColor: 'var(--amber)' }}
              disabled={submitting}
            >
              {submitting ? 'Closing Loan…' : 'Confirm Close Loan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
