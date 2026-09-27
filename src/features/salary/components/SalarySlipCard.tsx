import { formatInr } from '../../../shared/lib/format'
import type { CompanySalaryConfig, SalarySlip } from '../salary.types'

interface SalarySlipCardProps {
  slip: SalarySlip | null
  company: CompanySalaryConfig
  selectedMonth: string
  loading?: boolean
  onMonthChange: (month: string) => void
  onDownload: () => void
}

export function SalarySlipCard({
  slip,
  company,
  selectedMonth,
  loading = false,
  onMonthChange,
  onDownload,
}: SalarySlipCardProps) {
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number)
    const prevDate = new Date(y, m - 2, 1)
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    onMonthChange(prevKey)
  }

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number)
    const nextDate = new Date(y, m, 1)
    const nextKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`
    onMonthChange(nextKey)
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ margin: 0 }}>Salary slip</h3>
        {loading && (
          <span style={{ fontSize: 12, color: 'var(--blue, #2563eb)', fontWeight: 600 }}>
            Updating data…
          </span>
        )}
      </div>

      <div
        className="filters"
        style={{
          marginBottom: 16,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div className="f" style={{ margin: 0 }}>
          <label htmlFor="msMonth">Month</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              type="button"
              className="btn sm ghost"
              onClick={handlePrevMonth}
              title="Previous Month"
              style={{ padding: '4px 9px', height: 36, minWidth: 32, fontSize: 16, fontWeight: 700 }}
            >
              ‹
            </button>
            <input
              id="msMonth"
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                if (e.target.value) onMonthChange(e.target.value)
              }}
              style={{ height: 36 }}
            />
            <button
              type="button"
              className="btn sm ghost"
              onClick={handleNextMonth}
              title="Next Month"
              style={{ padding: '4px 9px', height: 36, minWidth: 32, fontSize: 16, fontWeight: 700 }}
            >
              ›
            </button>
          </div>
        </div>

        <button
          type="button"
          className="btn primary"
          onClick={onDownload}
          disabled={!slip || loading}
          style={{ height: 36 }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: 4 }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download Payslip
        </button>
      </div>

      {!slip ? (
        <div className="empty" style={{ padding: '36px 20px', textAlign: 'center' }}>
          <b style={{ display: 'block', marginBottom: 6 }}>No slip for this month</b>
          <span style={{ color: 'var(--muted)' }}>
            The employee was not on active payroll during {selectedMonth}.
          </span>
        </div>
      ) : (
        <div className="slip">
          {/* Header */}
          <div className="sh">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <div className="disp" style={{ fontSize: 16, color: 'var(--ink)' }}>
                  {company.name}
                </div>
                <small style={{ color: 'var(--muted)', fontSize: 12 }}>
                  {company.address} · PAN {company.pan} · TAN {company.tan}
                </small>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  className="disp"
                  style={{ fontSize: 15, color: 'var(--blue, #2563eb)' }}
                >
                  {slip.isContractor
                    ? 'Consultancy Retainer Statement'
                    : 'Salary slip'}
                </div>
                <small style={{ fontWeight: 600, color: 'var(--ink2)' }}>
                  {slip.monthLabel}
                  {slip.isFrozen && (
                    <span
                      style={{
                        marginLeft: 6,
                        padding: '1px 6px',
                        background: 'var(--green-soft, #e8f6ef)',
                        color: 'var(--green, #0f9d63)',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      Paid
                    </span>
                  )}
                </small>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="sb">
            {/* Employee Meta Grid */}
            <div className="slipgrid" style={{ marginBottom: 18 }}>
              <div>
                <div className="kv">
                  <b>Employee name</b>
                  <span>{slip.employee.name}</span>
                </div>
                <div className="kv">
                  <b>Employee code</b>
                  <span>{slip.employee.code}</span>
                </div>
                <div className="kv">
                  <b>Designation</b>
                  <span>{slip.employee.title}</span>
                </div>
                <div className="kv">
                  <b>Department</b>
                  <span>{slip.employee.department}</span>
                </div>
                <div className="kv">
                  <b>Date of joining</b>
                  <span>{slip.employee.dateOfJoining}</span>
                </div>
              </div>
              <div>
                <div className="kv">
                  <b>PAN</b>
                  <span>{slip.employee.pan}</span>
                </div>
                <div className="kv">
                  <b>UAN</b>
                  <span>{slip.employee.uan}</span>
                </div>
                <div className="kv">
                  <b>Bank account</b>
                  <span>{slip.employee.bankAccount}</span>
                </div>
                <div className="kv">
                  <b>Days paid</b>
                  <span>
                    {slip.payableDays} of {slip.monthDays}
                    {slip.lopDays > 0 ? ` · ${slip.lopDays} LOP` : ''}
                  </span>
                </div>
                <div className="kv">
                  <b>Work location</b>
                  <span>{slip.employee.workState}</span>
                </div>
              </div>
            </div>

            {/* Earnings & Deductions Tables */}
            <div className="slipgrid">
              <div>
                <h4>{slip.isContractor ? 'Professional Retainer' : 'Earnings'}</h4>
                {slip.isContractor ? (
                  <div className="kv">
                    <b>Professional Retainer Fee</b>
                    <span>{formatInr(slip.earnings.gross)}</span>
                  </div>
                ) : (
                  <>
                    <div className="kv">
                      <b>Basic salary</b>
                      <span>{formatInr(slip.earnings.basic)}</span>
                    </div>
                    <div className="kv">
                      <b>House rent allowance</b>
                      <span>{formatInr(slip.earnings.hra)}</span>
                    </div>
                    <div className="kv">
                      <b>Special allowance</b>
                      <span>{formatInr(slip.earnings.special)}</span>
                    </div>
                  </>
                )}
                <div className="kv total">
                  <b>{slip.isContractor ? 'Gross Invoiced' : 'Gross earnings'}</b>
                  <span>{formatInr(slip.earnings.gross)}</span>
                </div>
              </div>

              <div>
                <h4>Deductions</h4>
                {slip.isContractor ? (
                  <div className="kv">
                    <b>TDS (u/s 194J / 194C)</b>
                    <span>{formatInr(slip.deductions.tds)}</span>
                  </div>
                ) : (
                  <>
                    <div className="kv">
                      <b>Provident fund — employee</b>
                      <span>{formatInr(slip.deductions.employeePf)}</span>
                    </div>
                    <div className="kv">
                      <b>Professional tax</b>
                      <span>{formatInr(slip.deductions.professionalTax)}</span>
                    </div>
                    <div className="kv">
                      <b>Income tax (TDS) — new regime</b>
                      <span>{formatInr(slip.deductions.tds)}</span>
                    </div>
                  </>
                )}
                {slip.deductions.loanEmi > 0 && (
                  <div className="kv">
                    <b>{slip.isContractor ? 'Advance recovery' : 'Loan EMI'}</b>
                    <span>{formatInr(slip.deductions.loanEmi)}</span>
                  </div>
                )}
                <div className="kv total">
                  <b>Total deductions</b>
                  <span>{formatInr(slip.deductions.total)}</span>
                </div>
              </div>
            </div>

            {/* Net Pay Banner */}
            <div className="netpay">
              <div>
                <div className="netpay-label">
                  {slip.isContractor ? 'Net Payout' : 'Net pay'}
                </div>
                <div className="n">{formatInr(slip.netPay)}</div>
              </div>
              <div className="w">{slip.netPayWords}</div>
            </div>

            {/* Employer Contributions & YTD */}
            {slip.isContractor ? (
              <div className="slipgrid" style={{ marginTop: 18 }}>
                <div>
                  <h4>Contractor Scope</h4>
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>
                    Statutory PF, ESI, Gratuity and paid leave accruals do not apply to commercial retainer agreements.
                  </p>
                </div>
                <div>
                  <h4>Fiscal Summary</h4>
                  <div className="kv">
                    <b>Annualized Retainer</b>
                    <span>{formatInr(slip.ytd.annualCtc)}</span>
                  </div>
                  <div className="kv">
                    <b>TDS Deducted Till Date</b>
                    <span>{formatInr(slip.ytd.tdsDeductedTillDate)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="slipgrid" style={{ marginTop: 18 }}>
                <div>
                  <h4>Employer contributions</h4>
                  <div className="kv">
                    <b>Provident fund (EPF 3.67%)</b>
                    <span>{formatInr(slip.employer.employerEpf)}</span>
                  </div>
                  <div className="kv">
                    <b>Pension scheme (EPS 8.33%)</b>
                    <span>{formatInr(slip.employer.eps)}</span>
                  </div>
                  <div className="kv">
                    <b>PF wages considered</b>
                    <span>{formatInr(slip.employer.pfWage)}</span>
                  </div>
                </div>
                <div>
                  <h4>Year to date</h4>
                  <div className="kv">
                    <b>Annual CTC</b>
                    <span>{formatInr(slip.ytd.annualCtc)}</span>
                  </div>
                  <div className="kv">
                    <b>Annual tax liability</b>
                    <span>{formatInr(slip.ytd.annualTax)}</span>
                  </div>
                  <div className="kv">
                    <b>TDS deducted till date</b>
                    <span>{formatInr(slip.ytd.tdsDeductedTillDate)}</span>
                  </div>
                </div>
              </div>
            )}

            <p
              className="hint"
              style={{
                marginTop: 18,
                fontSize: 12,
                color: 'var(--muted2)',
                borderTop: '1px solid var(--line2)',
                paddingTop: 12,
              }}
            >
              Computer generated statement — no signature required. Income tax computed under the new regime (section 115BAC) for FY {company.fy}.
              {slip.isFrozen ? ' · Settled snapshot.' : ' · Live computed projection.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
