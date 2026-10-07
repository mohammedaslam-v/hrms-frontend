export interface SalaryStructure {
  ctc: number
  basicA: number
  hraA: number
  specialA: number
  erPfA: number
  gratA: number
  grossA: number
  basicM: number
  hraM: number
  specialM: number
  grossM: number
  pfWage: number
  eePfM: number
  erPfM: number
  gratM: number
}

export interface TaxComputationResult {
  grossSalary: number
  stdDeduction: number
  taxable: number
  slabTax: number
  rebate: number
  marginalRelief: number
  surcharge: number
  cess: number
  total: number
  monthly: number
}

const CFG = {
  pfCeiling: 15000,
  pfRate: 0.12,
  stdDeduction: 75000,
  rebateCap: 1200000,
  rebateMax: 60000,
  cess: 0.04,
  slabs: [
    [400000, 0],
    [800000, 0.05],
    [1200000, 0.1],
    [1600000, 0.15],
    [2000000, 0.2],
    [2400000, 0.25],
    [Infinity, 0.3],
  ] as [number, number][],
  surcharge: [
    [5000000, 0],
    [10000000, 0.1],
    [20000000, 0.15],
    [Infinity, 0.25],
  ] as [number, number][],
}

export function formatInr(n: number): string {
  if (isNaN(n) || n === 0) return '₹0'
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

/**
 * MIRROR OF the backend's structure() in hrms-backend
 * src/modules/salary/salary.domain.ts — change both together.
 *
 * The form needs a breakdown on every keystroke, so it computes locally rather
 * than calling the server; the numbers must still match the payslip to the
 * rupee, which is why the logic is copied line for line, not approximated.
 *
 *   Basic 40% of Gross · HRA 50% of Basic · Special = balance
 *   PF 12% of Basic on a wage capped at ₹15,000/month (employer and employee)
 *   Gratuity 4.81% of Basic · CTC = Gross + Employer PF + Gratuity
 */
const RULES = { basicPctOfGross: 0.4, hraPctOfBasic: 0.5, pfRate: 0.12, gratuityPctOfBasic: 0.0481 }

function grossFromCtc(ctc: number, pfWageCeiling: number): number {
  const b = RULES.basicPctOfGross
  const uncapped = ctc / (1 + b * RULES.pfRate + b * RULES.gratuityPctOfBasic)
  if (b * uncapped <= pfWageCeiling) return uncapped
  return (ctc - RULES.pfRate * pfWageCeiling) / (1 + b * RULES.gratuityPctOfBasic)
}

function split(ctc: number, pfWageCeiling: number) {
  const basic = Math.round(grossFromCtc(ctc, pfWageCeiling) * RULES.basicPctOfGross)
  const hra = Math.round(basic * RULES.hraPctOfBasic)
  const pfWage = Math.min(basic, pfWageCeiling)
  const pf = Math.round(pfWage * RULES.pfRate)
  const gratuity = Math.round(basic * RULES.gratuityPctOfBasic)
  const gross = Math.round(ctc) - pf - gratuity
  const special = Math.max(0, gross - basic - hra)
  return { basic, hra, special, gross, pf, pfWage, gratuity }
}

export function calculateStructure(ctc: number): SalaryStructure {
  const annualCtc = Math.max(0, Math.round(ctc || 0))
  const m = split(annualCtc / 12, CFG.pfCeiling)
  const a = split(annualCtc, CFG.pfCeiling * 12)

  return {
    ctc: annualCtc,
    basicA: a.basic,
    hraA: a.hra,
    specialA: a.special,
    erPfA: a.pf,
    gratA: a.gratuity,
    grossA: a.gross,
    basicM: m.basic,
    hraM: m.hra,
    specialM: m.special,
    grossM: m.gross,
    pfWage: m.pfWage,
    eePfM: m.pf,
    erPfM: m.pf,
    gratM: m.gratuity,
  }
}

export function calculatePt(state: string, grossM: number, monthKey?: string): number {
  const isFeb = monthKey ? monthKey.slice(5) === '02' : false
  switch (state) {
    case 'Karnataka':
      return grossM >= 25000 ? 200 : 0
    case 'Maharashtra':
      return grossM <= 7500 ? 0 : grossM <= 10000 ? 175 : isFeb ? 300 : 200
    case 'Telangana':
      return grossM < 15000 ? 0 : grossM <= 20000 ? 150 : 200
    case 'Tamil Nadu':
      return grossM <= 7500 ? 0 : grossM <= 12500 ? 125 : 208
    case 'Delhi':
      return 0
    default:
      return grossM >= 25000 ? 200 : 0
  }
}

function calculateSlabTax(ti: number): number {
  let prev = 0
  let tax = 0
  for (const [cap, rate] of CFG.slabs) {
    if (ti <= prev) break
    const amt = Math.min(ti, cap) - prev
    tax += amt * rate
    prev = cap
    if (ti <= cap) break
  }
  return tax
}

function calculateSurcharge(ti: number, tax: number): number {
  let rate = 0
  for (const [cap, r] of CFG.surcharge) {
    if (ti <= cap) {
      rate = r
      break
    }
  }
  if (!rate) return 0
  const amount = tax * rate

  let threshold = 0
  let prevRate = 0
  for (const [cap, r] of CFG.surcharge) {
    if (ti > cap) {
      threshold = cap
      prevRate = r
    }
  }

  if (threshold) {
    const taxAtThreshold = calculateSlabTax(threshold) * (1 + prevRate)
    const excess = ti - threshold
    const total = tax + amount
    if (total - taxAtThreshold > excess) {
      const relief = total - taxAtThreshold - excess
      return Math.max(0, amount - relief)
    }
  }

  return amount
}

export function calculateIncomeTax(
  grossA: number,
  variablePay = 0,
  bonus = 0,
): TaxComputationResult {
  const grossSalary = grossA + variablePay + bonus
  const stdDeduction = CFG.stdDeduction
  const taxable = Math.max(0, grossSalary - stdDeduction)
  const slabTax = calculateSlabTax(taxable)

  let rebate = 0
  let marginalRelief = 0
  if (taxable <= CFG.rebateCap) {
    rebate = Math.min(slabTax, CFG.rebateMax)
  } else {
    const excess = taxable - CFG.rebateCap
    if (slabTax > excess) {
      marginalRelief = slabTax - excess
    }
  }

  const afterRebate = Math.max(0, slabTax - rebate - marginalRelief)
  const surcharge = calculateSurcharge(taxable, afterRebate)
  const cess = (afterRebate + surcharge) * CFG.cess
  const total = Math.round(afterRebate + surcharge + cess)
  const monthly = Math.round(total / 12)

  return {
    grossSalary,
    stdDeduction,
    taxable,
    slabTax,
    rebate,
    marginalRelief,
    surcharge,
    cess,
    total,
    monthly,
  }
}
