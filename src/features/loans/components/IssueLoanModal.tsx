import { useMemo, useState } from 'react'
import type { CreateLoanPayload, LoanMetaDto } from '../types/loans.types'

interface IssueLoanModalProps {
  meta: LoanMetaDto
  submitting: boolean
  onClose: () => void
  onSubmit: (payload: CreateLoanPayload) => Promise<void>
}

function formatInr(n: number): string {
  if (isNaN(n) || n === 0) return '₹0'
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

export function IssueLoanModal({ meta, submitting, onClose, onSubmit }: IssueLoanModalProps) {
  const [employeeId, setEmployeeId] = useState<number | ''>('')
  const [principal, setPrincipal] = useState<number>(30000)
  const [tenureMonths, setTenureMonths] = useState<number>(6)
  const [startMonth, setStartMonth] = useState<string>(
    meta.allowedStartMonths[0]?.monthKey || '',
  )
  const [purpose, setPurpose] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // Real-time EMI calculation (Flat 0% interest)
  const calculatedEmi = useMemo(() => {
    if (!principal || principal <= 0 || !tenureMonths || tenureMonths <= 0) return 0
    return Math.ceil(principal / tenureMonths)
  }, [principal, tenureMonths])

  const selectedEmp = useMemo(() => {
    if (!employeeId) return null
    return meta.employees.find((e) => e.id === Number(employeeId)) || null
  }, [employeeId, meta.employees])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!employeeId) {
      setError('Please select an employee.')
      return
    }

    if (!principal || principal <= 0) {
      setError('Please enter a valid loan principal amount.')
      return
    }

    if (tenureMonths < 1 || tenureMonths > 6) {
      setError('Repayment tenure must be between 1 and 6 months.')
      return
    }

    if (!startMonth) {
      setError('Please choose a start EMI month.')
      return
    }

    try {
      await onSubmit({
        employeeId: Number(employeeId),
        principal,
        tenureMonths,
        startMonth,
        purpose: purpose.trim() || 'Salary advance',
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to issue loan.')
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
          maxWidth: '560px',
          padding: '28px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          borderRadius: '16px',
          background: '#fff',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Issue Company Loan / Advance</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--muted2)', margin: '4px 0 0' }}>
              Interest-free advance recovered automatically via monthly payroll deductions
            </p>
          </div>
          <button
            type="button"
            className="btn ghost sm"
            onClick={onClose}
            disabled={submitting}
            style={{ padding: '4px 10px' }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="notice bad" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="fgrid">
          <div className="f">
            <label>Select Active Employee *</label>
            <select
              value={employeeId}
              onChange={(e) => {
                setEmployeeId(e.target.value ? Number(e.target.value) : '')
                setError(null)
              }}
              required
            >
              <option value="">-- Choose employee --</option>
              {meta.employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employeeCode}){emp.department ? ` · ${emp.department}` : ''}
                  {emp.activeLoansCount && emp.activeLoansCount > 0
                    ? ` (${emp.activeLoansCount} active ${emp.activeLoansCount === 1 ? 'loan' : 'loans'})`
                    : ''}
                </option>
              ))}
            </select>
            {selectedEmp?.activeLoansCount && selectedEmp.activeLoansCount > 0 ? (
              <div className="hint" style={{ color: 'var(--blue)' }}>
                ℹ️ This employee currently has {selectedEmp.activeLoansCount} active {selectedEmp.activeLoansCount === 1 ? 'loan' : 'loans'}. Another loan can be issued concurrently.
              </div>
            ) : null}
          </div>

          <div className="grid g2">
            <div className="f">
              <label>Loan Amount (Principal ₹) *</label>
              <input
                type="number"
                min={1000}
                step={1000}
                value={principal || ''}
                onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
                placeholder="e.g. 50000"
                required
              />
              <span className="hint">0% flat interest rate</span>
            </div>

            <div className="f">
              <label>Tenure (Months) *</label>
              <select
                value={tenureMonths}
                onChange={(e) => setTenureMonths(Number(e.target.value))}
                required
              >
                {[1, 2, 3, 4, 5, 6].map((m) => (
                  <option key={m} value={m}>
                    {m} {m === 1 ? 'Month' : 'Months'} (Max 6)
                  </option>
                ))}
              </select>
              <span className="hint">Max tenure allowed: 6 months</span>
            </div>
          </div>

          {/* Auto-calculated EMI Display */}
          <div
            style={{
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid var(--line2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700 }}>
                Monthly Salary EMI Deduction
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--green)', marginTop: '2px' }}>
                {formatInr(calculatedEmi)} / month
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--muted2)' }}>
                Principal ({formatInr(principal)}) ÷ {tenureMonths} installments
              </div>
            </div>
            <span className="tag green" style={{ fontWeight: 600 }}>
              0% Interest
            </span>
          </div>

          <div className="f">
            <label>Start EMI Deduction Month *</label>
            <select
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              required
            >
              {meta.allowedStartMonths.map((m) => (
                <option key={m.monthKey} value={m.monthKey}>
                  {m.label} {m.isImmediate ? '(Immediate Payout)' : '(+1 Month Grace)'}
                </option>
              ))}
            </select>
            <span className="hint">
              EMI deductions can begin in current salary month or next month (max 1 month future).
            </span>
          </div>

          <div className="f">
            <label>Purpose / Reason</label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Medical emergency, Home relocation, festival advance"
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
              disabled={submitting || !employeeId}
            >
              {submitting ? 'Disbursing Loan…' : 'Disburse Loan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
