import { useEffect, useState } from 'react'
import { loansApi } from '../api/loans.api'
import type { EmployeeLoanScheduleView, EmployeeLoansView } from '../types/loans.types'

function formatInr(n: number): string {
  if (isNaN(n) || n === 0) return '₹0'
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

interface EmployeeLoanTabProps {
  employeeId?: number
  employeeName?: string
}

export function EmployeeLoanTab({ employeeId, employeeName }: EmployeeLoanTabProps) {
  const [data, setData] = useState<EmployeeLoansView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Track which loan items are expanded (click item -> box increases and reveals details)
  const [expandedLoanIds, setExpandedLoanIds] = useState<number[]>([])
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<number[]>([])

  useEffect(() => {
    let active = true
    setLoading(true)
    const fetcher = employeeId
      ? loansApi.getEmployeeLoans(employeeId)
      : loansApi.getMyLoans()

    fetcher
      .then((res) => {
        if (active) setData(res)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load loan information.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [employeeId])

  const toggleExpand = (loanId: number) => {
    setExpandedLoanIds((prev) =>
      prev.includes(loanId) ? prev.filter((id) => id !== loanId) : [...prev, loanId],
    )
  }

  const toggleHistoryExpand = (loanId: number) => {
    setExpandedHistoryIds((prev) =>
      prev.includes(loanId) ? prev.filter((id) => id !== loanId) : [...prev, loanId],
    )
  }

  if (loading) {
    return (
      <div className="card" style={{ padding: '36px', textAlign: 'center', color: 'var(--muted2)' }}>
        Loading loan and salary advance details…
      </div>
    )
  }

  if (error) {
    return (
      <div className="notice bad">
        {error}
      </div>
    )
  }

  const activeLoans: EmployeeLoanScheduleView[] =
    data?.activeLoans && data.activeLoans.length > 0
      ? data.activeLoans
      : data?.activeLoan
        ? [data.activeLoan]
        : []

  const history = data?.history || []

  if (activeLoans.length === 0 && history.length === 0) {
    return (
      <div className="card" style={{ padding: '36px', textAlign: 'center', color: 'var(--muted2)' }}>
        <div style={{ fontSize: '32px', marginBottom: '10px' }}>💳</div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)' }}>No Loans or Advances</h3>
        <p style={{ fontSize: '13px', margin: '4px 0 0' }}>
          {employeeName
            ? `${employeeName} has no active or past company loans on file.`
            : 'You have no active company loans or salary advances.'}
        </p>
      </div>
    )
  }

  const totalMonthlyEmi = activeLoans.reduce((acc, l) => acc + l.emi, 0)
  const totalOutstanding = activeLoans.reduce((acc, l) => acc + l.outstandingAmount, 0)

  return (
    <div className="fgrid">
      {/* Overview Banner */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          background: '#ffffff',
          border: '1px solid var(--line)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'var(--blue-soft, #eaf0fe)',
              color: 'var(--blue, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            💳
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--ink)' }}>
              {employeeName ? `${employeeName}’s Company Advances` : 'Company Advances'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted2)', marginTop: 2 }}>
              {activeLoans.length} active {activeLoans.length === 1 ? 'loan' : 'loans'} · Click any loan item to expand deduction schedule
            </div>
          </div>
        </div>

        {activeLoans.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700 }}>
                Combined Monthly EMI
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--green)' }}>
                {formatInr(totalMonthlyEmi)}
                <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--muted)' }}> / mo</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700 }}>
                Total Outstanding
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--amber)' }}>
                {formatInr(totalOutstanding)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Loans - Expandable List Items */}
      {activeLoans.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {activeLoans.map((loan, idx) => {
            const isExpanded = expandedLoanIds.includes(loan.id)
            const pct =
              loan.principal > 0
                ? Math.min(100, Math.round((loan.repaidAmount / loan.principal) * 100))
                : 0

            return (
              <div
                key={loan.id}
                className="card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  border: isExpanded ? '1.5px solid var(--blue)' : '1px solid var(--line)',
                  transition: 'border 0.15s ease, box-shadow 0.15s ease',
                  boxShadow: isExpanded ? '0 4px 12px rgba(37, 99, 235, 0.08)' : undefined,
                }}
              >
                {/* Clickable Header Row */}
                <div
                  onClick={() => toggleExpand(loan.id)}
                  style={{
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none',
                    gap: 16,
                    flexWrap: 'wrap',
                    background: isExpanded ? 'var(--panel, #fbf8f4)' : '#ffffff',
                    transition: 'background-color 0.15s ease',
                  }}
                  title="Click to expand/collapse loan details and EMI schedule"
                >
                  {/* Left: Purpose and Start Timeframe */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: '220px' }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 7,
                        background: isExpanded ? 'var(--blue)' : 'var(--line2)',
                        color: isExpanded ? '#ffffff' : 'var(--ink)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      #{idx + 1}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h4 style={{ fontSize: 14.5, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                          {loan.purpose}
                        </h4>
                        <span className="chip c-in" style={{ fontSize: 10.5, padding: '2px 6px' }}>
                          0% Interest
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted2)', marginTop: 2 }}>
                        Disbursed {loan.startMonth} · Target {loan.finalMonth} ({loan.tenureMonths} mos)
                      </div>
                    </div>
                  </div>

                  {/* Middle: Key Figures Strip */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: 10.5, color: 'var(--muted)', display: 'block', textTransform: 'uppercase' }}>
                        Principal
                      </span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>
                        {formatInr(loan.principal)}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: 10.5, color: 'var(--muted)', display: 'block', textTransform: 'uppercase' }}>
                        Monthly EMI
                      </span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--green)' }}>
                        {formatInr(loan.emi)}
                      </span>
                    </div>

                    <div style={{ minWidth: 120 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 10.5,
                          color: 'var(--muted)',
                          marginBottom: 3,
                        }}
                      >
                        <span>{pct}% Repaid</span>
                        <span>{loan.paidMonths}/{loan.tenureMonths}m</span>
                      </div>
                      <div style={{ height: 5, background: 'var(--line2)', borderRadius: 3, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: 'var(--blue)',
                            borderRadius: 3,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: 10.5, color: 'var(--muted)', display: 'block', textTransform: 'uppercase' }}>
                        Outstanding
                      </span>
                      <span
                        style={{
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: loan.outstandingAmount > 0 ? 'var(--amber)' : 'var(--muted)',
                        }}
                      >
                        {formatInr(loan.outstandingAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Expand Dropdown Button */}
                  <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <button
                      type="button"
                      className={`btn sm ${isExpanded ? 'primary' : 'ghost'}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleExpand(loan.id)
                      }}
                      style={{
                        fontSize: 12,
                        padding: '4px 12px',
                        height: 30,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>{isExpanded ? 'Hide Details' : 'EMI Details'}</span>
                      <span style={{ fontSize: 10 }}>{isExpanded ? '▲' : '▼'}</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Box (Revealed when clicked) */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '18px 20px',
                      borderTop: '1px solid var(--line2)',
                      background: '#ffffff',
                    }}
                  >
                    {/* 4 Focused Metric Tiles */}
                    <div className="grid g4" style={{ marginBottom: 16 }}>
                      <div
                        style={{
                          padding: '10px 12px',
                          background: 'var(--panel)',
                          borderRadius: 8,
                          border: '1px solid var(--line2)',
                        }}
                      >
                        <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                          Principal Amount
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
                          {formatInr(loan.principal)}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '10px 12px',
                          background: 'var(--panel)',
                          borderRadius: 8,
                          border: '1px solid var(--line2)',
                        }}
                      >
                        <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                          Repaid So Far
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)', marginTop: 2 }}>
                          {formatInr(loan.repaidAmount)}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '10px 12px',
                          background: 'var(--panel)',
                          borderRadius: 8,
                          border: '1px solid var(--line2)',
                        }}
                      >
                        <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                          Outstanding Balance
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--amber)', marginTop: 2 }}>
                          {formatInr(loan.outstandingAmount)}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '10px 12px',
                          background: 'var(--panel)',
                          borderRadius: 8,
                          border: '1px solid var(--line2)',
                        }}
                      >
                        <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                          Installments
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
                          {loan.paidMonths} of {loan.tenureMonths} Months
                        </div>
                      </div>
                    </div>

                    {/* Scheduled Installment Breakdown Table */}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                        Monthly EMI Deduction Schedule
                      </div>

                      <div
                        className="scroll"
                        style={{
                          maxHeight: 240,
                          border: '1px solid var(--line2)',
                          borderRadius: 8,
                        }}
                      >
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
                            {loan.schedule.map((item, sIdx) => (
                              <tr key={item.monthKey}>
                                <td style={{ fontWeight: 600, color: 'var(--muted)', fontSize: 12 }}>
                                  Installment #{sIdx + 1}
                                </td>
                                <td style={{ fontWeight: 600, fontSize: 13 }}>
                                  {item.monthLabel}
                                </td>
                                <td className="num-col" style={{ fontWeight: 700, color: 'var(--ink)' }}>
                                  {formatInr(item.emi)}
                                </td>
                                <td>
                                  {item.status === 'deducted' ? (
                                    <span className="chip c-in" style={{ fontSize: 11 }}>
                                      ✓ Deducted from Salary
                                    </span>
                                  ) : item.status === 'settled' ? (
                                    <span className="chip" style={{ fontSize: 11 }}>
                                      Settled Early
                                    </span>
                                  ) : (
                                    <span
                                      className="chip"
                                      style={{ background: '#fef3c7', color: '#b45309', fontSize: 11 }}
                                    >
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
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Historical / Closed Loans Section */}
      {history.length > 0 && (
        <div className="card" style={{ marginTop: 6 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            Past Loans & Advances History
          </h4>
          <div className="scroll">
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Purpose</th>
                  <th className="num-col">Principal</th>
                  <th className="num-col">Monthly EMI</th>
                  <th>Tenure</th>
                  <th>Closed On</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Schedule</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => {
                  const isHistoryExpanded = expandedHistoryIds.includes(h.id)
                  return (
                    <tr key={h.id}>
                      <td style={{ fontWeight: 600 }}>{h.purpose}</td>
                      <td className="num-col">{formatInr(h.principal)}</td>
                      <td className="num-col">{formatInr(h.emi)}</td>
                      <td>{h.tenureMonths} Months</td>
                      <td style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                        {h.closedAt ? h.closedAt.slice(0, 10) : h.finalMonth}
                      </td>
                      <td>
                        <span className="chip" style={{ background: '#f1ece5', color: '#6b7280' }}>
                          Closed
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn ghost sm"
                          onClick={() => toggleHistoryExpand(h.id)}
                          style={{ fontSize: 11.5, padding: '3px 8px', height: 26 }}
                        >
                          {isHistoryExpanded ? 'Hide ▲' : 'View ▼'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* If any history item is expanded */}
          {history.filter((h) => expandedHistoryIds.includes(h.id)).map((h) => (
            <div
              key={`hist-exp-${h.id}`}
              style={{
                marginTop: 12,
                padding: '14px 16px',
                background: 'var(--panel)',
                borderRadius: 8,
                border: '1px solid var(--line)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 12.5 }}>
                  Closed Loan Schedule: {h.purpose} ({formatInr(h.principal)})
                </span>
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={() => toggleHistoryExpand(h.id)}
                  style={{ fontSize: 11, padding: '2px 6px', height: 24 }}
                >
                  ✕ Close
                </button>
              </div>
              <div className="scroll" style={{ maxHeight: 180, border: '1px solid var(--line2)', borderRadius: 6, background: '#fff' }}>
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
                    {h.schedule.map((item, sIdx) => (
                      <tr key={item.monthKey}>
                        <td>Installment #{sIdx + 1}</td>
                        <td>{item.monthLabel}</td>
                        <td className="num-col">{formatInr(item.emi)}</td>
                        <td>
                          <span className="chip" style={{ fontSize: 11 }}>
                            {item.status === 'deducted' ? '✓ Deducted' : 'Settled Early'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="notice blue" style={{ marginTop: 4 }}>
        <b>Company Policy:</b> Bambinos company advances are 0% interest-free and recovered automatically via monthly payroll deductions.
      </div>
    </div>
  )
}
