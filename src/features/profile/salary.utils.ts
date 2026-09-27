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
  isTotal?: boolean
}

export interface SalaryBreakout {
  ctc: number
  monthlyGross: number
  rows: SalaryBreakoutRow[]
}

/**
 * Calculates salary breakout matching company policy & statutory provisions:
 * - Basic Salary = 40% of CTC
 * - HRA = 40% of Basic
 * - Employee Contribution = 12% of Basic (capped at ₹1,800/month statutory wage ceiling)
 * - Employer Contribution = 12% of Basic policy rate (4.8% of Basic = ₹960/month on ₹20k basic)
 * - Gratuity = 4.81% of Basic (15 days / 26 days / 12 months)
 * - Other Allowances = Balancing figure reconciling back to exactly CTC
 * - Total = CTC
 */
export function calculateSalaryBreakout(ctc: number): SalaryBreakout {
  const annualCtc = Math.max(0, Math.round(ctc || 0))
  const monthlyCtc = Math.round(annualCtc / 12)

  if (annualCtc === 0) {
    return {
      ctc: 0,
      monthlyGross: 0,
      rows: [
        { component: 'Basic Salary (40%)', annualAmount: 0, monthlyAmount: 0 },
        { component: 'HRA (40% of Basic)', annualAmount: 0, monthlyAmount: 0 },
        { component: 'Other Allowances', annualAmount: 0, monthlyAmount: 0 },
        { component: 'Employee Contribution (12% of Basic)', annualAmount: 0, monthlyAmount: 0 },
        { component: 'Employer Contribution (12% of Basic)', annualAmount: 0, monthlyAmount: 0 },
        { component: 'Gratuity (4.81% of Basic)', annualAmount: 0, monthlyAmount: 0 },
        { component: '✅ Total', annualAmount: 0, monthlyAmount: 0, isTotal: true },
      ],
    }
  }

  // 1. Basic Salary (40% of CTC)
  const basicAnnual = Math.round(annualCtc * 0.4)
  const basicMonthly = Math.round(basicAnnual / 12)

  // 2. HRA (40% of Basic)
  const hraAnnual = Math.round(basicAnnual * 0.4)
  const hraMonthly = Math.round(hraAnnual / 12)

  // 3. Employee Contribution (12% of Basic, capped at statutory wage ceiling ₹15,000 -> ₹1,800/mo)
  const eePfMonthly = Math.min(Math.round(basicMonthly * 0.12), 1800)
  const eePfAnnual = eePfMonthly * 12

  // 4. Employer Contribution (12% of Basic policy rate = 4.8% of Basic)
  // For 600,000 CTC (240k basic) -> 240,000 * 0.048 = 11,520 annual, 960/mo
  const erPfAnnual = Math.round(basicAnnual * 0.048)
  const erPfMonthly = Math.round(erPfAnnual / 12)

  // 5. Gratuity (4.81% of Basic)
  // 15 days of last drawn basic / 26 working days / 12 months = 4.8077% -> 4.81%
  const gratAnnual = Math.round(basicAnnual * 0.0481)
  const gratMonthly = Math.round(gratAnnual / 12)

  // 6. Other Allowances (Balancing figure)
  const otherAnnual = Math.max(
    0,
    annualCtc - (basicAnnual + hraAnnual + eePfAnnual + erPfAnnual + gratAnnual),
  )
  const otherMonthly = Math.max(
    0,
    monthlyCtc - (basicMonthly + hraMonthly + eePfMonthly + erPfMonthly + gratMonthly),
  )

  const rows: SalaryBreakoutRow[] = [
    { component: 'Basic Salary (40%)', annualAmount: basicAnnual, monthlyAmount: basicMonthly },
    { component: 'HRA (40% of Basic)', annualAmount: hraAnnual, monthlyAmount: hraMonthly },
    { component: 'Other Allowances', annualAmount: otherAnnual, monthlyAmount: otherMonthly },
    {
      component: 'Employee Contribution (12% of Basic)',
      annualAmount: eePfAnnual,
      monthlyAmount: eePfMonthly,
    },
    {
      component: 'Employer Contribution (12% of Basic)',
      annualAmount: erPfAnnual,
      monthlyAmount: erPfMonthly,
    },
    { component: 'Gratuity (4.81% of Basic)', annualAmount: gratAnnual, monthlyAmount: gratMonthly },
    { component: '✅ Total', annualAmount: annualCtc, monthlyAmount: monthlyCtc, isTotal: true },
  ]

  return {
    ctc: annualCtc,
    monthlyGross: monthlyCtc,
    rows,
  }
}
