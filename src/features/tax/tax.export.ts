import type { MyTaxResponse } from './tax.types'

const formatInr = (n: number): string =>
  '₹' + Math.round(n).toLocaleString('en-IN')

export function exportTaxCsv(data: MyTaxResponse) {
  const { employee, computation, slabRows, schedule, company } = data

  const rows: string[][] = [
    ['INCOME TAX COMPUTATION STATEMENT — SECTION 115BAC (NEW REGIME)'],
    ['Company', company.name],
    ['Address', company.address],
    ['Company PAN', company.pan, 'Company TAN', company.tan],
    ['Financial Year', company.fy, 'Assessment Year', company.ay],
    [''],
    ['EMPLOYEE DETAILS'],
    ['Employee Name', employee.name],
    ['Employee Code', employee.code],
    ['Department', employee.department],
    ['Designation', employee.title],
    ['PAN', employee.pan],
    [''],
    ['ANNUAL SALARY & TAX COMPUTATION', 'AMOUNT (INR)'],
    ['Basic Salary', String(computation.basicAnnual)],
    ['House Rent Allowance (HRA)', String(computation.hraAnnual)],
    ['Special Allowance', String(computation.specialAnnual)],
    ['Variable Pay', String(computation.variablePay)],
    ['Bonus / Incentive', String(computation.bonus)],
    ['Gross Salary', String(computation.grossSalary)],
    ['Less: Standard Deduction u/s 16(ia)', String(-computation.stdDeduction)],
    ['Less: Employer NPS Contribution u/s 80CCD(2)', String(-computation.npsDeduction)],
    ['Taxable Income', String(computation.taxableIncome)],
    ['Tax on Slabs', String(computation.slabTax)],
    ['Less: Rebate u/s 87A', String(-computation.rebate87A)],
    ['Less: Marginal Relief u/s 87A', String(-computation.marginalRelief87A)],
    ['Add: Surcharge', String(computation.surchargeAmount)],
    ['Less: Surcharge Marginal Relief', String(-computation.surchargeRelief)],
    ['Add: Health & Education Cess (4%)', String(computation.cessAmount)],
    ['Total Tax for the Year', String(computation.totalTax)],
    ['Monthly TDS', String(computation.monthlyTds)],
    ['Effective Tax Rate (%)', computation.effectiveTaxRate.toFixed(2) + '%'],
    [''],
    ['SLAB-WISE TAX BREAKDOWN', 'RATE', 'TAXED AMOUNT (INR)', 'TAX (INR)'],
    ...slabRows.map((r) => [
      `${formatInr(r.from)} – ${r.to ? formatInr(r.to) : 'and above'}`,
      `${(r.rate * 100).toFixed(0)}%`,
      String(r.amount),
      String(r.tax),
    ]),
    [''],
    ['TDS SCHEDULE & STATUS'],
    ['Months Elapsed', `${schedule.monthsElapsed} of ${schedule.totalMonths}`],
    ['TDS Deducted Till Date', String(schedule.deductedTillDate)],
    ['TDS Remaining This FY', String(schedule.remainingThisFy)],
    ['Percentage Deducted', `${schedule.percentageDeducted}%`],
  ]

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')

  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute(
    'download',
    `Tax_Computation_${employee.code || 'EMP'}_FY_${company.fy}.csv`,
  )
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function printTaxComputation(data: MyTaxResponse) {
  const { employee, computation, slabRows, company } = data

  const printWindow = window.open('', '_blank', 'width=880,height=900')
  if (!printWindow) {
    window.print()
    return
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Tax Computation · ${employee.name} · FY ${company.fy}</title>
  <style>
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 32px;
      color: #1F2937;
      background: #FFFFFF;
      font-size: 13px;
      line-height: 1.5;
    }
    .header {
      border-bottom: 2px solid #E5E7EB;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 6px 0;
    }
    .sub {
      color: #6B7280;
      font-size: 12px;
      margin: 0;
    }
    .emp-bar {
      display: flex;
      justify-content: space-between;
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
      font-size: 12px;
    }
    .emp-bar b {
      color: #111827;
    }
    .grid {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 20px;
    }
    .card {
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 16px;
      background: #FFFFFF;
    }
    h3 {
      font-size: 14px;
      margin: 0 0 14px 0;
      color: #111827;
      font-weight: 600;
      border-bottom: 1px solid #F3F4F6;
      padding-bottom: 8px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #F9FAFB;
    }
    .row.total {
      font-weight: 700;
      border-top: 1px solid #E5E7EB;
      border-bottom: 1px solid #E5E7EB;
      background: #F9FAFB;
      margin: 4px -8px;
      padding: 8px;
      border-radius: 4px;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .table th {
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      color: #6B7280;
      border-bottom: 1px solid #E5E7EB;
      padding: 6px 4px;
    }
    .table td {
      padding: 6px 4px;
      border-bottom: 1px solid #F3F4F6;
    }
    .text-right {
      text-align: right;
    }
    .footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #E5E7EB;
      font-size: 11px;
      color: #6B7280;
    }
    @media print {
      body { margin: 0; padding: 16px; }
      @page { size: auto; margin: 12mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${company.name}</div>
    <div class="sub">Income Tax Computation Statement — Section 115BAC (New Regime) · FY ${company.fy} (AY ${company.ay})</div>
  </div>

  <div class="emp-bar">
    <div><b>Name:</b> ${employee.name} (${employee.code})</div>
    <div><b>PAN:</b> ${employee.pan}</div>
    <div><b>Dept:</b> ${employee.department}</div>
    <div><b>Title:</b> ${employee.title}</div>
  </div>

  <div class="grid">
    <div class="card">
      <h3>Tax Computation Details</h3>
      <div class="row"><span>Basic salary</span><span>${formatInr(computation.basicAnnual)}</span></div>
      <div class="row"><span>House rent allowance</span><span>${formatInr(computation.hraAnnual)}</span></div>
      <div class="row"><span>Special allowance</span><span>${formatInr(computation.specialAnnual)}</span></div>
      ${computation.variablePay ? `<div class="row"><span>Variable pay</span><span>${formatInr(computation.variablePay)}</span></div>` : ''}
      ${computation.bonus ? `<div class="row"><span>Bonus / Incentive</span><span>${formatInr(computation.bonus)}</span></div>` : ''}
      <div class="row total"><span>Gross Salary</span><span>${formatInr(computation.grossSalary)}</span></div>
      <div class="row"><span>Less: Standard deduction u/s 16(ia)</span><span>− ${formatInr(computation.stdDeduction)}</span></div>
      <div class="row"><span>Less: Employer NPS u/s 80CCD(2)</span><span>− ${formatInr(computation.npsDeduction)}</span></div>
      <div class="row total"><span>Taxable Income</span><span>${formatInr(computation.taxableIncome)}</span></div>
      <div class="row"><span>Tax on slabs</span><span>${formatInr(computation.slabTax)}</span></div>
      ${computation.rebate87A ? `<div class="row"><span>Less: Rebate u/s 87A</span><span>− ${formatInr(computation.rebate87A)}</span></div>` : ''}
      ${computation.marginalRelief87A ? `<div class="row"><span>Less: Marginal relief</span><span>− ${formatInr(computation.marginalRelief87A)}</span></div>` : ''}
      ${computation.surchargeAmount ? `<div class="row"><span>Add: Surcharge at ${(computation.surchargeRate * 100).toFixed(0)}%</span><span>+ ${formatInr(computation.surchargeAmount)}</span></div>` : ''}
      ${computation.surchargeRelief ? `<div class="row"><span>Surcharge marginal relief</span><span>− ${formatInr(computation.surchargeRelief)}</span></div>` : ''}
      <div class="row"><span>Add: Health & education cess at 4%</span><span>+ ${formatInr(computation.cessAmount)}</span></div>
      <div class="row total"><span>Total Tax for the Year</span><span>${formatInr(computation.totalTax)}</span></div>
      <div class="row"><span>Monthly TDS</span><span>${formatInr(computation.monthlyTds)}</span></div>
      <div class="row"><span>Effective Tax Rate</span><span>${computation.effectiveTaxRate.toFixed(2)}% of gross</span></div>
    </div>

    <div>
      <div class="card">
        <h3>Slab-wise Tax Breakdown</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Slab</th>
              <th class="text-right">Rate</th>
              <th class="text-right">Taxed</th>
              <th class="text-right">Tax</th>
            </tr>
          </thead>
          <tbody>
            ${slabRows
              .map(
                (r) => `<tr>
              <td>${formatInr(r.from)} – ${r.to ? formatInr(r.to) : 'above'}</td>
              <td class="text-right">${(r.rate * 100).toFixed(0)}%</td>
              <td class="text-right">${formatInr(r.amount)}</td>
              <td class="text-right"><b>${formatInr(r.tax)}</b></td>
            </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </div>

      <div class="card" style="margin-top: 16px;">
        <h3>TDS Schedule Summary</h3>
        <div class="row"><span>Months elapsed</span><span>${data.schedule.monthsElapsed} of 12</span></div>
        <div class="row"><span>Deducted till date</span><span>${formatInr(data.schedule.deductedTillDate)}</span></div>
        <div class="row"><span>Remaining this FY</span><span>${formatInr(data.schedule.remainingThisFy)}</span></div>
      </div>
    </div>
  </div>

  <div class="footer">
    Note: Under the New Tax Regime (Section 115BAC), standard deduction of ₹75,000 is permitted u/s 16(ia).
    Section 87A rebate of up to ₹60,000 applies where taxable income is within ₹12,00,000.
  </div>

  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>`

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}
