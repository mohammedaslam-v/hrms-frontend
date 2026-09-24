import type { AdminLoanSummary } from '../types/loans.types'

interface LoanSummaryCardsProps {
  summary: AdminLoanSummary
}

function formatInr(n: number): string {
  if (isNaN(n) || n === 0) return '₹0'
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

export function LoanSummaryCards({ summary }: LoanSummaryCardsProps) {
  return (
    <div className="grid g4" style={{ marginBottom: '20px' }}>
      <div className="card" style={{ padding: '18px 20px' }}>
        <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
          Active Loans
        </div>
        <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--ink)' }}>
          {summary.activeLoansCount}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--muted2)', marginTop: '4px' }}>
          Employees with ongoing advances
        </div>
      </div>

      <div className="card" style={{ padding: '18px 20px' }}>
        <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
          Total Disbursed
        </div>
        <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--blue)' }}>
          {formatInr(summary.totalDisbursed)}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--muted2)', marginTop: '4px' }}>
          Principal advances issued
        </div>
      </div>

      <div className="card" style={{ padding: '18px 20px' }}>
        <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
          Monthly Recovery
        </div>
        <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--green)' }}>
          {formatInr(summary.monthlyRecovery)}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--muted2)', marginTop: '4px' }}>
          Salary EMI deductions / month
        </div>
      </div>

      <div className="card" style={{ padding: '18px 20px' }}>
        <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
          Total Outstanding
        </div>
        <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--amber)' }}>
          {formatInr(summary.totalOutstanding)}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--muted2)', marginTop: '4px' }}>
          Remaining company recovery
        </div>
      </div>
    </div>
  )
}
