import { useMemo } from 'react'
import type { EmployeeFormState, EmployeeMetaDto } from '../types/employee-form.types'
import {
  calculateIncomeTax,
  calculatePt,
  calculateStructure,
  formatInr,
} from '../utils/salary-calculator'

interface SalaryStructureCardProps {
  form: EmployeeFormState
  meta: EmployeeMetaDto
  onChange: <K extends keyof EmployeeFormState>(field: K, value: EmployeeFormState[K]) => void
}

export function SalaryStructureCard({ form, meta, onChange }: SalaryStructureCardProps) {
  const preview = useMemo(() => {
    if (!form.ctc || form.ctc <= 0) return null
    const s = calculateStructure(form.ctc)
    const pt = calculatePt(form.workState, s.grossM)
    const tax = calculateIncomeTax(s.grossA, form.variablePay, form.bonus)
    return { s, pt, tax }
  }, [form.ctc, form.workState, form.variablePay, form.bonus])

  return (
    <>
      <div className="formhead" style={{ marginTop: '22px' }}>
        Salary structure
      </div>
      <div className="grid g2">
        <div className="f">
          <label>Annual CTC (₹) *</label>
          <input
            id="nCtc"
            type="number"
            min={0}
            step={10000}
            placeholder="900000"
            value={form.ctc || ''}
            onChange={(e) => onChange('ctc', Math.max(0, Number(e.target.value) || 0))}
            required
          />
        </div>

        <div className="f">
          <label>Variable pay (₹ / yr)</label>
          <input
            id="nVar"
            type="number"
            min={0}
            step={5000}
            placeholder="150000"
            value={form.variablePay || ''}
            onChange={(e) => onChange('variablePay', Math.max(0, Number(e.target.value) || 0))}
          />
        </div>

        <div className="f">
          <label>Joining bonus (₹)</label>
          <input
            id="nBonus"
            type="number"
            min={0}
            step={5000}
            placeholder="50000"
            value={form.bonus || ''}
            onChange={(e) => onChange('bonus', Math.max(0, Number(e.target.value) || 0))}
          />
        </div>

        <div className="f">
          <label>ESOPs (units)</label>
          <input
            id="nEsop"
            type="number"
            min={0}
            placeholder="500"
            value={form.esopUnits || ''}
            onChange={(e) => onChange('esopUnits', Math.max(0, Number(e.target.value) || 0))}
          />
        </div>

        <div className="f">
          <label>ESOP vesting</label>
          <select
            value={form.esopVesting}
            onChange={(e) => onChange('esopVesting', e.target.value)}
          >
            {meta.esopVestingOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="f">
          <label>Pay cycle</label>
          <select
            value={form.payCycle}
            onChange={(e) => onChange('payCycle', e.target.value)}
          >
            <option value="Monthly">Monthly</option>
            <option value="Fortnightly">Fortnightly</option>
          </select>
        </div>
      </div>

      <div id="structPreview" style={{ marginTop: '14px' }}>
        {preview ? (
          <div className="notice blue">
            <b>Monthly:</b> basic {formatInr(preview.s.basicM)} · HRA {formatInr(preview.s.hraM)} · special {formatInr(preview.s.specialM)} · gross <b>{formatInr(preview.s.grossM)}</b>
            <br />
            <b>Deductions:</b> PF {formatInr(preview.s.eePfM)} · professional tax {formatInr(preview.pt)} · TDS {formatInr(preview.tax.monthly)}
            <br />
            <b>Annual tax under the new regime:</b> {formatInr(preview.tax.total)} on a taxable income of {formatInr(preview.tax.taxable)}
          </div>
        ) : (
          <div className="hint">
            Enter a CTC to see the monthly break-up and the tax under the new regime.
          </div>
        )}
      </div>
    </>
  )
}
