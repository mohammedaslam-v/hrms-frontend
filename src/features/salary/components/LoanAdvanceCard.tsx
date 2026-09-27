import { formatInr } from '../../../shared/lib/format'
import type { EmployeeLoanView } from '../salary.types'

interface LoanAdvanceCardProps {
  loan: EmployeeLoanView | null
}

export function LoanAdvanceCard({ loan }: LoanAdvanceCardProps) {
  if (!loan) return null

  const pct =
    loan.principal > 0
      ? Math.min(100, Math.round((loan.repaidAmount / loan.principal) * 100))
      : 0

  return (
    <div className="card mt">
      <h3>Loan &amp; advance</h3>
      <div>
        <div className="kv">
          <b>Purpose</b>
          <span>{loan.purpose}</span>
        </div>
        <div className="kv">
          <b>Principal</b>
          <span>{formatInr(loan.principal)}</span>
        </div>
        <div className="kv">
          <b>Monthly EMI</b>
          <span>{formatInr(loan.emi)}</span>
        </div>
        <div className="kv">
          <b>Interest rate</b>
          <span>{loan.interestRate > 0 ? `${loan.interestRate}%` : 'Interest free'}</span>
        </div>
        <div className="kv">
          <b>Instalments paid</b>
          <span>
            {loan.paidMonths} of {loan.tenureMonths}
          </span>
        </div>
        <div className="kv">
          <b>Repaid so far</b>
          <span>{formatInr(loan.repaidAmount)}</span>
        </div>
        <div className="kv">
          <b>Outstanding</b>
          <span>{formatInr(loan.outstandingAmount)}</span>
        </div>
        <div className="kv">
          <b>Final instalment</b>
          <span>{loan.finalMonth}</span>
        </div>
        <div className="bar mt">
          <i
            style={{
              width: `${pct}%`,
              background: 'var(--coral, #ea6a18)',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: 'var(--muted)',
            marginTop: 5,
          }}
        >
          <span>{pct}% repaid</span>
          <span>{loan.tenureMonths - loan.paidMonths} months remaining</span>
        </div>
      </div>
    </div>
  )
}
