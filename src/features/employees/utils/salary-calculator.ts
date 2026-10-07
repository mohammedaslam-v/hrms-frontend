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

/**
 * Monthly components when HR overrides the formula on the Add Employee form.
 * Mirrors SalaryComponents in the backend's salary.domain.ts.
 */
export interface SalaryOverride {
  basicM: number
  hraM: number
  specialM: number
  employerPfM: number
  gratuityM: number
  employeePfM: number
  /** Null = "as applicable": follow the work state's slab. */
  professionalTaxM: number | null
}

export type SalaryField = keyof SalaryOverride | 'grossM' | 'netM'

/** The formula's monthly split, as an editable starting point. */
export function formulaComponents(ctc: number): SalaryOverride {
  const s = calculateStructure(ctc)
  return {
    basicM: s.basicM,
    hraM: s.hraM,
    specialM: s.specialM,
    employerPfM: s.erPfM,
    gratuityM: s.gratM,
    employeePfM: s.eePfM,
    professionalTaxM: null,
  }
}

/**
 * One field edited, the rest following the agreed rules:
 *   Basic        → HRA, both PFs and Gratuity re-derive; Special balances
 *   HRA/ErPF/Gr. → Special balances
 *   Special      → it is the balancing field, so the CTC moves instead
 *   EePF / PT    → change Net only
 * CTC stays as entered in every case but the Special edit.
 */
export function applySalaryEdit(
  current: SalaryOverride,
  field: SalaryField,
  value: number,
  annualCtc: number,
  workState = '',
): { components: SalaryOverride; ctc: number } {
  const v = Math.max(0, Math.round(value || 0))
  const monthlyCtc = Math.round(annualCtc / 12)
  const next: SalaryOverride = { ...current }
  const rebalance = () => {
    next.specialM = monthlyCtc - next.basicM - next.hraM - next.employerPfM - next.gratuityM
  }

  switch (field) {
    case 'basicM': {
      const pf = Math.round(Math.min(v, CFG.pfCeiling) * RULES.pfRate)
      next.basicM = v
      next.hraM = Math.round(v * RULES.hraPctOfBasic)
      next.employerPfM = pf
      next.employeePfM = pf
      next.gratuityM = Math.round(v * RULES.gratuityPctOfBasic)
      rebalance()
      return { components: next, ctc: annualCtc }
    }
    case 'hraM':
    case 'employerPfM':
    case 'gratuityM':
      next[field] = v
      rebalance()
      return { components: next, ctc: annualCtc }
    case 'specialM':
      next.specialM = v
      return {
        components: next,
        ctc: (next.basicM + next.hraM + next.specialM + next.employerPfM + next.gratuityM) * 12,
      }
    case 'employeePfM':
      next.employeePfM = v
      return { components: next, ctc: annualCtc }
    case 'professionalTaxM':
      next.professionalTaxM = v
      return { components: next, ctc: annualCtc }
    case 'grossM':
      return fromGross(v, current.professionalTaxM)
    case 'netM':
      return fromGross(grossForNet(v, current.professionalTaxM, workState), current.professionalTaxM)
  }
}

/**
 * Gross typed directly: the same percentages applied from the other end, so
 * CTC becomes Gross + Employer PF + Gratuity. A PT figure HR already set is
 * kept; anything else is re-derived.
 */
function fromGross(grossM: number, professionalTaxM: number | null): { components: SalaryOverride; ctc: number } {
  const g = Math.max(0, Math.round(grossM))
  const basicM = Math.round(g * RULES.basicPctOfGross)
  const hraM = Math.round(basicM * RULES.hraPctOfBasic)
  const pf = Math.round(Math.min(basicM, CFG.pfCeiling) * RULES.pfRate)
  const gratuityM = Math.round(basicM * RULES.gratuityPctOfBasic)
  const components: SalaryOverride = {
    basicM,
    hraM,
    specialM: g - basicM - hraM,
    employerPfM: pf,
    gratuityM,
    employeePfM: pf,
    professionalTaxM,
  }
  return { components, ctc: (g + pf + gratuityM) * 12 }
}

/**
 * The Gross whose take-home is `netM`. Employee PF and professional tax both
 * depend on Gross — PF through Basic and its cap, PT through the state's
 * slabs — so this steps towards it rather than solving in one line. A few
 * rounds settle; a PT slab boundary can leave Net a rupee or two off.
 */
function grossForNet(netM: number, professionalTaxM: number | null, workState: string): number {
  const target = Math.max(0, Math.round(netM))
  let g = target
  for (let i = 0; i < 8; i++) {
    const basic = Math.round(g * RULES.basicPctOfGross)
    const eePf = Math.round(Math.min(basic, CFG.pfCeiling) * RULES.pfRate)
    const pt = professionalTaxM ?? calculatePt(workState, g)
    const next = target + eePf + pt
    if (next === g) break
    g = next
  }
  return g
}
