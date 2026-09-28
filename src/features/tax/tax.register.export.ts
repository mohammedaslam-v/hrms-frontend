import type { TaxRegisterResponse } from './tax.types'

/**
 * The register as a CSV, for the quarterly Form 24Q working.
 *
 * Column order matches the table on screen so the two can be read side by side,
 * and every amount is a bare number — a CSV that arrives with ₹ and commas in
 * it cannot be summed in a spreadsheet, which is the only reason to download it.
 */
export function exportTaxRegisterCsv(data: TaxRegisterResponse, department: string) {
  const header = [
    'Code', 'Member', 'Department', 'PAN', 'Gross salary', 'Std deduction',
    'Taxable', 'Tax on slabs', '87A rebate', 'Cess', 'Annual TDS',
    'Monthly', 'Deducted YTD',
  ]

  const rows = data.rows
    .filter((r) => !department || r.department === department)
    .map((r) => [
      r.code, r.name, r.department, r.pan,
      r.grossSalary, r.stdDeduction, r.taxableIncome, r.slabTax,
      r.rebate87A, r.cessAmount, r.totalTax, r.monthlyTds, r.deductedTillDate,
    ])

  // A field holding a comma or a quote has to be quoted, or the columns shift.
  const cell = (v: string | number): string => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }

  const csv = [header, ...rows].map((row) => row.map(cell).join(',')).join('\n')
  const scope = department ? department.replace(/\s+/g, '-') : 'all'
  const name = `tds-register-${scope}-FY${data.company.fy.replace('/', '-')}.csv`

  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}
