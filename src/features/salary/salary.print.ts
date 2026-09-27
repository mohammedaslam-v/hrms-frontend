import { formatInr } from '../../shared/lib/format'
import type { CompanySalaryConfig, SalarySlip } from './salary.types'

export function printSlipDocument(slip: SalarySlip, company: CompanySalaryConfig) {
  const w = window.open('', '_blank', 'width=980,height=760')
  if (!w) {
    alert('Please allow pop-ups in your browser to download or print your payslip.')
    return
  }

  const isContractor = slip.isContractor

  const earnRows = isContractor
    ? `
      <div class="kv"><b>Professional Retainer Fee</b><span>${formatInr(slip.earnings.gross)}</span></div>
    `
    : `
      <div class="kv"><b>Basic salary</b><span>${formatInr(slip.earnings.basic)}</span></div>
      <div class="kv"><b>House rent allowance</b><span>${formatInr(slip.earnings.hra)}</span></div>
      <div class="kv"><b>Special allowance</b><span>${formatInr(slip.earnings.special)}</span></div>
    `

  const dedRows = isContractor
    ? `
      <div class="kv"><b>TDS (u/s 194J / 194C)</b><span>${formatInr(slip.deductions.tds)}</span></div>
      ${slip.deductions.loanEmi ? `<div class="kv"><b>Advance / EMI recovery</b><span>${formatInr(slip.deductions.loanEmi)}</span></div>` : ''}
    `
    : `
      <div class="kv"><b>Provident fund — employee</b><span>${formatInr(slip.deductions.employeePf)}</span></div>
      <div class="kv"><b>Professional tax</b><span>${formatInr(slip.deductions.professionalTax)}</span></div>
      <div class="kv"><b>Income tax (TDS) — new regime</b><span>${formatInr(slip.deductions.tds)}</span></div>
      ${slip.deductions.loanEmi ? `<div class="kv"><b>Loan / Advance EMI</b><span>${formatInr(slip.deductions.loanEmi)}</span></div>` : ''}
    `

  const employerBlock = isContractor
    ? `
      <div class="slipgrid" style="margin-top:18px">
        <div>
          <h4>Contractor Notice</h4>
          <p style="font-size:12px;color:#6b7280;line-height:1.5">Commercial retainer statement. Statutory PF, ESI, Gratuity and statutory leave provisions do not apply to service contracts.</p>
        </div>
        <div>
          <h4>Fiscal Summary</h4>
          <div class="kv"><b>Retainer Annualized</b><span>${formatInr(slip.ytd.annualCtc)}</span></div>
          <div class="kv"><b>TDS Deducted Till Date</b><span>${formatInr(slip.ytd.tdsDeductedTillDate)}</span></div>
        </div>
      </div>
    `
    : `
      <div class="slipgrid" style="margin-top:18px">
        <div>
          <h4>Employer contributions</h4>
          <div class="kv"><b>Provident fund (EPF 3.67%)</b><span>${formatInr(slip.employer.employerEpf)}</span></div>
          <div class="kv"><b>Pension scheme (EPS 8.33%)</b><span>${formatInr(slip.employer.eps)}</span></div>
          <div class="kv"><b>PF wages considered</b><span>${formatInr(slip.employer.pfWage)}</span></div>
        </div>
        <div>
          <h4>Year to date</h4>
          <div class="kv"><b>Annual CTC</b><span>${formatInr(slip.ytd.annualCtc)}</span></div>
          <div class="kv"><b>Annual tax liability</b><span>${formatInr(slip.ytd.annualTax)}</span></div>
          <div class="kv"><b>TDS deducted till date</b><span>${formatInr(slip.ytd.tdsDeductedTillDate)}</span></div>
        </div>
      </div>
    `

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Salary Slip · ${slip.employee.name} · ${slip.monthLabel}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #ffffff;
      color: #14161c;
      padding: 32px;
      line-height: 1.5;
    }
    .slip {
      max-width: 820px;
      margin: 0 auto;
      border: 1px solid #e6e0d7;
      border-radius: 12px;
      overflow: hidden;
    }
    .sh {
      background: #faf8f5;
      padding: 20px 24px;
      border-bottom: 1px solid #e6e0d7;
    }
    .sh-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }
    .company-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 18px;
      font-weight: 800;
      color: #14161c;
      letter-spacing: -0.02em;
    }
    .company-sub {
      font-size: 12px;
      color: #6b7280;
      margin-top: 3px;
    }
    .slip-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 16px;
      font-weight: 800;
      color: #2563eb;
      text-align: right;
    }
    .slip-month {
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      text-align: right;
      margin-top: 3px;
    }
    .sb {
      padding: 24px;
    }
    .slipgrid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    h4 {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #6b7280;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid #f0ebe4;
    }
    .kv {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid #f0ebe4;
      font-size: 13px;
    }
    .kv:last-child {
      border-bottom: 0;
    }
    .kv b {
      font-weight: 500;
      color: #4b5563;
    }
    .kv span {
      text-align: right;
      font-weight: 600;
      color: #111827;
      font-variant-numeric: tabular-nums;
    }
    .kv.total {
      border-top: 2px solid #e6e0d7;
      border-bottom: 0;
      margin-top: 6px;
      padding-top: 10px;
    }
    .kv.total b, .kv.total span {
      font-weight: 700;
      color: #111827;
    }
    .netpay {
      background: #e8f6ef;
      border: 1px solid #c3e6d3;
      border-radius: 10px;
      padding: 16px 20px;
      margin: 20px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    .netpay-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #15803d;
    }
    .netpay-amount {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 26px;
      font-weight: 800;
      color: #0f9d63;
      letter-spacing: -0.02em;
      line-height: 1.2;
      margin-top: 2px;
    }
    .netpay-words {
      font-size: 13px;
      font-weight: 600;
      color: #166534;
      text-align: right;
      max-width: 55%;
    }
    .hint {
      font-size: 11.5px;
      color: #9ca3af;
      margin-top: 20px;
      line-height: 1.4;
      border-top: 1px solid #f0ebe4;
      padding-top: 12px;
    }
    @media print {
      body { padding: 0; }
      @page { margin: 12mm; }
      .slip { border: 1px solid #ccc; }
    }
  </style>
</head>
<body>
  <div class="slip">
    <div class="sh">
      <div class="sh-header">
        <div>
          <div class="company-title">${company.name}</div>
          <div class="company-sub">${company.address} · PAN ${company.pan} · TAN ${company.tan}</div>
        </div>
        <div>
          <div class="slip-title">${isContractor ? 'Consultancy Retainer Statement' : 'Salary Slip'}</div>
          <div class="slip-month">${slip.monthLabel}</div>
        </div>
      </div>
    </div>
    <div class="sb">
      <div class="slipgrid" style="margin-bottom:18px">
        <div>
          <div class="kv"><b>Employee name</b><span>${slip.employee.name}</span></div>
          <div class="kv"><b>Employee code</b><span>${slip.employee.code}</span></div>
          <div class="kv"><b>Designation</b><span>${slip.employee.title}</span></div>
          <div class="kv"><b>Department</b><span>${slip.employee.department}</span></div>
          <div class="kv"><b>Date of joining</b><span>${slip.employee.dateOfJoining}</span></div>
        </div>
        <div>
          <div class="kv"><b>PAN</b><span>${slip.employee.pan}</span></div>
          <div class="kv"><b>UAN</b><span>${slip.employee.uan}</span></div>
          <div class="kv"><b>Bank account</b><span>${slip.employee.bankAccount}</span></div>
          <div class="kv"><b>Days paid</b><span>${slip.payableDays} of ${slip.monthDays}${slip.lopDays ? ` · ${slip.lopDays} LOP` : ''}</span></div>
          <div class="kv"><b>Work location</b><span>${slip.employee.workState}</span></div>
        </div>
      </div>

      <div class="slipgrid">
        <div>
          <h4>${isContractor ? 'Professional Fees' : 'Earnings'}</h4>
          ${earnRows}
          <div class="kv total"><b>${isContractor ? 'Gross Invoiced' : 'Gross earnings'}</b><span>${formatInr(slip.earnings.gross)}</span></div>
        </div>
        <div>
          <h4>Deductions</h4>
          ${dedRows}
          <div class="kv total"><b>Total deductions</b><span>${formatInr(slip.deductions.total)}</span></div>
        </div>
      </div>

      <div class="netpay">
        <div>
          <div class="netpay-label">${isContractor ? 'Net Payout' : 'Net Pay'}</div>
          <div class="netpay-amount">${formatInr(slip.netPay)}</div>
        </div>
        <div class="netpay-words">${slip.netPayWords}</div>
      </div>

      ${employerBlock}

      <p class="hint">
        Computer generated statement — no signature required. Income tax computed under the new regime (section 115BAC) for FY ${company.fy}.
        ${slip.isFrozen ? ' · Frozen payroll snapshot.' : ' · Estimated real-time computation.'}
      </p>
    </div>
  </div>
  <script>
    setTimeout(function() {
      window.print();
    }, 450);
  </script>
</body>
</html>`

  w.document.write(html)
  w.document.close()
}
