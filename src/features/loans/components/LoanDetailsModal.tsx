import { useMemo } from 'react'
import type { AdminLoanItem } from '../types/loans.types'

interface LoanDetailsModalProps {
  loan: AdminLoanItem
  onClose: () => void
  onMarkAsClosed: (loan: AdminLoanItem) => void
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function formatInr(n: number): string {
  if (isNaN(n) || n === 0) return '₹0'
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

function addMonths(startMonthKey: string, monthsToAdd: number): { monthKey: string; label: string } {
  const [y, m] = startMonthKey.split('-').map(Number)
  const totalM = m + monthsToAdd
  const resYear = y + Math.floor((totalM - 1) / 12)
  const resMonth = ((totalM - 1) % 12) + 1
  const monthKey = `${resYear}-${String(resMonth).padStart(2, '0')}`
  const label = `${MONTH_NAMES[resMonth - 1]} ${resYear}`
  return { monthKey, label }
}

export function LoanDetailsModal({ loan, onClose, onMarkAsClosed }: LoanDetailsModalProps) {
  const pct = loan.principal > 0
    ? Math.min(100, Math.round((loan.repaidAmount / loan.principal) * 100))
    : 0

  const currentMonthKey = new Date().toISOString().slice(0, 7)
  const closedMonthKey = loan.closedAt ? loan.closedAt.slice(0, 7) : null

  const schedule = useMemo(() => {
    const items = []
    for (let i = 0; i < loan.tenureMonths; i++) {
      const { monthKey, label } = addMonths(loan.startMonth, i)
      let status: 'deducted' | 'upcoming' | 'settled' = 'upcoming'

      if (loan.status === 'closed') {
        if (closedMonthKey && monthKey > closedMonthKey) {
          status = 'settled'
        } else {
          status = 'deducted'
        }
      } else if (monthKey <= currentMonthKey) {
        status = 'deducted'
      } else {
        status = 'upcoming'
      }

      items.push({
        num: i + 1,
        monthKey,
        label,
        emi: loan.emi,
        status,
      })
    }
    return items
  }, [loan, currentMonthKey, closedMonthKey])

  return (
    <div
      className="modal on"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
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
          maxWidth: '680px',
          padding: '28px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          borderRadius: '16px',
          background: '#fff',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span
              className="avatar"
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--blue)',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              {loan.employeeName.charAt(0).toUpperCase()}
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                  {loan.employeeName}
                </h3>
                {loan.status === 'active' ? (
                  <span className="chip c-in" style={{ fontSize: '11px' }}>Active Loan</span>
                ) : (
                  <span className="chip" style={{ fontSize: '11px', background: '#f1ece5', color: '#6b7280' }}>
                    Closed
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--muted2)', marginTop: '2px' }}>
                {loan.employeeCode} {loan.department ? `· ${loan.department}` : ''} {loan.designation ? `· ${loan.designation}` : ''}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn ghost sm"
            onClick={onClose}
            style={{ padding: '4px 10px', fontSize: 13 }}
          >
            ✕
          </button>
        </div>

        {/* Loan Purpose Banner */}
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--panel)',
            borderRadius: '10px',
            border: '1px solid var(--line2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700 }}>
              Purpose of Advance
            </div>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>
              {loan.purpose}
            </div>
          </div>
          <span className="tag green" style={{ fontSize: '11.5px' }}>
            0% Flat Interest
          </span>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid g4" style={{ marginBottom: '18px' }}>
          <div style={{ padding: '12px 14px', background: '#fcfbfa', borderRadius: '10px', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Principal Amount
            </div>
            <div style={{ fontSize: '17px', fontWeight: 800, marginTop: '4px', color: 'var(--ink)' }}>
              {formatInr(loan.principal)}
            </div>
          </div>

          <div style={{ padding: '12px 14px', background: '#fcfbfa', borderRadius: '10px', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Monthly EMI
            </div>
            <div style={{ fontSize: '17px', fontWeight: 800, marginTop: '4px', color: 'var(--green)' }}>
              {formatInr(loan.emi)}
            </div>
          </div>

          <div style={{ padding: '12px 14px', background: '#fcfbfa', borderRadius: '10px', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Repaid So Far
            </div>
            <div style={{ fontSize: '17px', fontWeight: 800, marginTop: '4px', color: 'var(--blue)' }}>
              {formatInr(loan.repaidAmount)}
            </div>
          </div>

          <div style={{ padding: '12px 14px', background: '#fcfbfa', borderRadius: '10px', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Outstanding Balance
            </div>
            <div style={{ fontSize: '17px', fontWeight: 800, marginTop: '4px', color: loan.outstandingAmount > 0 ? 'var(--amber)' : 'var(--muted)' }}>
              {formatInr(loan.outstandingAmount)}
            </div>
          </div>
        </div>

        {/* Repayment Progress */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ fontWeight: 600 }}>Repayment Progress</span>
            <span style={{ color: 'var(--muted)' }}>
              {loan.paidMonths} of {loan.tenureMonths} installments completed ({pct}%)
            </span>
          </div>
          <div style={{ height: '8px', background: 'var(--line2)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: loan.status === 'closed' ? 'var(--green)' : 'var(--blue)',
                borderRadius: '4px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Repayment Schedule Table */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '13.5px', fontWeight: 700, margin: '0 0 10px', color: 'var(--ink)' }}>
            Scheduled Installment Breakdown
          </h4>
          <div className="scroll" style={{ maxHeight: '220px', border: '1px solid var(--line2)', borderRadius: '10px' }}>
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Installment</th>
                  <th>Salary Month</th>
                  <th className="num-col">EMI Deduction</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((item) => (
                  <tr key={item.monthKey}>
                    <td style={{ fontWeight: 600, color: 'var(--muted)' }}>Installment #{item.num}</td>
                    <td style={{ fontWeight: 600 }}>{item.label}</td>
                    <td className="num-col" style={{ fontWeight: 700 }}>{formatInr(item.emi)}</td>
                    <td>
                      {item.status === 'deducted' ? (
                        <span className="chip c-in" style={{ fontSize: '11px' }}>✓ Deducted from Salary</span>
                      ) : item.status === 'settled' ? (
                        <span className="chip" style={{ fontSize: '11px', background: '#f1ece5', color: '#6b7280' }}>
                          Settled Early
                        </span>
                      ) : (
                        <span className="chip" style={{ fontSize: '11px', background: '#fef3c7', color: '#b45309' }}>
                          ⏳ Upcoming
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Closed Details Box */}
        {loan.status === 'closed' && (
          <div
            style={{
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid var(--line)',
              fontSize: '12.5px',
              color: 'var(--muted2)',
              marginBottom: '20px',
            }}
          >
            <b>Loan Status:</b> Closed {loan.closedAt ? `on ${loan.closedAt.slice(0, 10)}` : ''}
            {loan.closedReason && (
              <div style={{ marginTop: '4px' }}>
                <b>Closure Reason:</b> {loan.closedReason}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {loan.status === 'active' && (
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => {
                  onClose()
                  onMarkAsClosed(loan)
                }}
                style={{ color: 'var(--amber)', borderColor: 'var(--amber)' }}
              >
                Mark as Closed
              </button>
            )}
          </div>

          <button
            type="button"
            className="btn primary sm"
            onClick={onClose}
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  )
}
