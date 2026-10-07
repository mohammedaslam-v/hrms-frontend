import { calculatePt, calculateStructure } from '../employees'

/**
 * Indian Rupee formatter — whole rupees with en-IN grouping (e.g. ₹6,00,000).
 */
export const formatInr = (amount: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(amount || 0))

/**
 * Pure number formatter with en-IN grouping without currency symbol (e.g. 600000 or 6,00,000).
 */
export const formatNumberInr = (amount: number): string =>
  new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Math.round(amount || 0))

export interface SalaryBreakoutRow {
  component: string
  annualAmount: number
  monthlyAmount: number
  /** The CTC line — highlighted. */
  isTotal?: boolean
  /** Gross and Net — bold, not highlighted. */
  isSubtotal?: boolean
}

export interface SalaryBreakout {
  ctc: number
  /** Gross, not CTC — the two differ by employer PF and gratuity. */
  monthlyGross: number
  rows: SalaryBreakoutRow[]
}

/**
 * The breakout on My Page and in the compensation editor.
 *
 * This used to carry its own copy of the maths, on an older formula — Basic as
 * 40% of CTC, HRA at 40% of Basic, employer PF at an undeclared 4.8% while the
 * label said 12%, and employee PF counted inside the CTC total. The payslip had
 * moved on and this had not, so the profile and the slip disagreed. It now
 * reads the same calculateStructure the Add Employee form and the payslip use,
 * and only decides how to lay the numbers out.
 */
export function calculateSalaryBreakout(ctc: number, workState = ''): SalaryBreakout {
  const s = calculateStructure(ctc)
  const ptM = calculatePt(workState, s.grossM)
  const netM = s.grossM - s.eePfM - ptM

  const rows: SalaryBreakoutRow[] = [
    { component: 'Basic (40% of Gross)', annualAmount: s.basicA, monthlyAmount: s.basicM },
    { component: 'HRA (50% of Basic)', annualAmount: s.hraA, monthlyAmount: s.hraM },
    { component: 'Special allowance (balance)', annualAmount: s.specialA, monthlyAmount: s.specialM },
    { component: 'Gross', annualAmount: s.grossA, monthlyAmount: s.grossM, isSubtotal: true },
    { component: 'Employer PF (12% of Basic, max ₹1,800/mo)', annualAmount: s.erPfA, monthlyAmount: s.erPfM },
    { component: 'Gratuity (4.81% of Basic)', annualAmount: s.gratA, monthlyAmount: s.gratM },
    { component: 'CTC', annualAmount: s.ctc, monthlyAmount: s.grossM + s.erPfM + s.gratM, isTotal: true },
    { component: 'Less: Employee PF (12% of Basic, max ₹1,800/mo)', annualAmount: s.eePfM * 12, monthlyAmount: s.eePfM },
    { component: 'Less: Professional tax', annualAmount: ptM * 12, monthlyAmount: ptM },
    { component: 'Net salary', annualAmount: netM * 12, monthlyAmount: netM, isSubtotal: true },
  ]

  return { ctc: s.ctc, monthlyGross: s.grossM, rows }
}
