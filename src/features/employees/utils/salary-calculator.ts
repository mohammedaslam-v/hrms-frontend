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

export function calculateStructure(ctc: number): SalaryStructure {
  const basicA = Math.round(ctc * 0.4)
  const hraA = Math.round(basicA * 0.5)
  const pfWage = Math.min(Math.round(basicA / 12), CFG.pfCeiling)
  const erPfM = Math.round(pfWage * CFG.pfRate)
  const erPfA = erPfM * 12
  const gratA = Math.round(basicA * 0.0481)
  const specialA = Math.max(0, ctc - basicA - hraA - erPfA - gratA)
  const grossA = basicA + hraA + specialA

  return {
    ctc,
    basicA,
    hraA,
    specialA,
    erPfA,
    gratA,
    grossA,
    basicM: Math.round(basicA / 12),
    hraM: Math.round(hraA / 12),
    specialM: Math.round(specialA / 12),
    grossM: Math.round(grossA / 12),
    pfWage,
    eePfM: Math.round(pfWage * CFG.pfRate),
    erPfM,
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
