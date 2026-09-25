import { useState } from 'react'
import type { AdminLoanItem } from '../types/loans.types'

interface AdminLoansTableProps {
  loans: AdminLoanItem[]
  onCloseLoan: (loan: AdminLoanItem) => void
  onSelectLoan: (loan: AdminLoanItem) => void
  onDisburseLoan?: (loan: AdminLoanItem) => void
}

function formatInr(n: number): string {
  if (isNaN(n) || n === 0) return '₹0'
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

export function AdminLoansTable({ loans, onCloseLoan, onSelectLoan, onDisburseLoan }: AdminLoansTableProps) {
  const [search, setSearch] = useState('')

  const filteredLoans = loans.filter((loan) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      loan.employeeName.toLowerCase().includes(q) ||
      loan.employeeCode.toLowerCase().includes(q) ||
      (loan.department && loan.department.toLowerCase().includes(q)) ||
      loan.purpose.toLowerCase().includes(q)
    )
  })

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--line2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          background: 'var(--panel)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
            Company Loans Ledger
          </span>
          <span style={{ fontSize: '12px', color: 'var(--muted2)' }}>
            ({filteredLoans.length} {filteredLoans.length === 1 ? 'record' : 'records'})
          </span>
        </div>
        <div style={{ position: 'relative', width: '260px' }}>
          <input
            type="text"
            className="input sm"
            placeholder="Search employee, ID or dept…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', fontSize: '12px', paddingRight: '24px' }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                color: 'var(--muted)',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {filteredLoans.length === 0 ? (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--muted2)' }}>
          {loans.length === 0
            ? 'No loans found matching this filter.'
            : 'No employees match your search query.'}
        </div>
      ) : (
        <div className="scroll">
          <table style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Member</th>
                <th>Purpose</th>
                <th className="num-col">Principal</th>
                <th className="num-col">Monthly EMI</th>
                <th>Start / Tenure</th>
                <th style={{ minWidth: '180px' }}>Repayment Progress</th>
                <th className="num-col">Outstanding</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.map((loan) => {
                const pct =
                  loan.principal > 0
                    ? Math.min(100, Math.round((loan.repaidAmount / loan.principal) * 100))
                    : 0

                return (
                  <tr
                    key={loan.id}
                    onClick={() => onSelectLoan(loan)}
                    style={{ cursor: 'pointer' }}
                    title="Click row to view complete loan details and schedule"
                  >
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{loan.employeeName}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                        {loan.employeeCode}
                        {loan.department ? ` · ${loan.department}` : ''}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '13px', color: 'var(--ink)' }}>{loan.purpose}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>
                        0% Interest · Target {loan.finalMonth}
                      </div>
                    </td>

                    <td className="num-col" style={{ fontWeight: 700 }}>
                      {formatInr(loan.principal)}
                    </td>

                    <td className="num-col" style={{ fontWeight: 600, color: 'var(--green)' }}>
                      {formatInr(loan.emi)}
                    </td>

                    <td>
                      <div style={{ fontSize: '12.5px' }}>{loan.startMonth}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        {loan.tenureMonths} installments
                      </div>
                    </td>

                    <td>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '11.5px',
                          marginBottom: '4px',
                        }}
                      >
                        <span>{formatInr(loan.repaidAmount)}</span>
                        <span style={{ color: 'var(--muted)' }}>
                          {loan.paidMonths}/{loan.tenureMonths} mos ({pct}%)
                        </span>
                      </div>
                      <div
                        style={{
                          height: '6px',
                          background: 'var(--line2)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: loan.status === 'closed' ? 'var(--green)' : 'var(--blue)',
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                    </td>

                    <td
                      className="num-col"
                      style={{
                        fontWeight: 700,
                        color: loan.outstandingAmount > 0 ? 'var(--amber)' : 'var(--muted)',
                      }}
                    >
                      {formatInr(loan.outstandingAmount)}
                    </td>

                    <td>
                      {loan.status === 'active' ? (
                        <span className="chip c-in" style={{ textTransform: 'capitalize' }}>
                          Active
                        </span>
                      ) : loan.status === 'pending_disbursement' ? (
                        <span className="chip" style={{ background: '#fef3c7', color: '#b45309', textTransform: 'capitalize' }}>
                          Pending Disburse
                        </span>
                      ) : loan.status === 'disbursement_failed' ? (
                        <span className="chip" style={{ background: '#fee2e2', color: '#b91c1c', textTransform: 'capitalize' }}>
                          Disburse Failed
                        </span>
                      ) : (
                        <span
                          className="chip"
                          style={{ background: '#f1ece5', color: '#6b7280', textTransform: 'capitalize' }}
                        >
                          Closed
                        </span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                        {(loan.status === 'pending_disbursement' || loan.status === 'disbursement_failed') && onDisburseLoan && (
                          <button
                            type="button"
                            className="btn primary sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDisburseLoan(loan)
                            }}
                            style={{ fontSize: '11.5px', padding: '4px 8px', background: '#0284c7' }}
                          >
                            💳 Disburse
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn ghost sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectLoan(loan)
                          }}
                          style={{ fontSize: '11.5px', padding: '4px 8px' }}
                          title="View loan schedule & history"
                        >
                          Details
                        </button>
                        {loan.status === 'active' ? (
                          <button
                            type="button"
                            className="btn ghost sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onCloseLoan(loan)
                            }}
                            style={{ fontSize: '11.5px', padding: '4px 8px', color: 'var(--amber)' }}
                          >
                            Close
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic' }}>
                            {loan.closedReason
                              ? loan.closedReason.slice(0, 15) + (loan.closedReason.length > 15 ? '…' : '')
                              : loan.status === 'pending_disbursement' ? 'Unpaid' : 'Settled'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
