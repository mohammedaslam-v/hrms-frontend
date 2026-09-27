import { formatInr } from '../../../shared/lib/format'
import type { CompanySalaryConfig, PayslipHistoryItem } from '../salary.types'

interface PayslipHistoryCardProps {
  history: PayslipHistoryItem[]
  company: CompanySalaryConfig
  onDownloadMonth: (monthKey: string) => void
}

export function PayslipHistoryCard({
  history,
  company,
  onDownloadMonth,
}: PayslipHistoryCardProps) {
  return (
    <div className="card mt">
      <h3>
        Payslip history{' '}
        <span className="sub">· FY {company.fy}</span>
      </h3>
      {history.length === 0 ? (
        <div style={{ color: 'var(--muted)', fontSize: 13, padding: '12px 0' }}>
          No payslip history records available.
        </div>
      ) : (
        <div>
          {history.map((item) => (
            <div key={item.monthKey} className="doc">
              <span style={{ flex: 1, fontSize: 13.5, color: 'var(--ink)' }}>
                📄 Salary slip · {item.monthLabel}
              </span>
              <span className="tag">
                {formatInr(item.netPay)}
              </span>
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => onDownloadMonth(item.monthKey)}
              >
                Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
