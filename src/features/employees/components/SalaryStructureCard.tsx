import { useMemo } from 'react'
import type { EmployeeFormState, EmployeeMetaDto } from '../types/employee-form.types'
import { calculatePt, calculateStructure, formatInr } from '../utils/salary-calculator'

interface SalaryStructureCardProps {
  form: EmployeeFormState
  meta: EmployeeMetaDto
  onChange: <K extends keyof EmployeeFormState>(field: K, value: EmployeeFormState[K]) => void
}

/**
 * Only CTC is typed; every component below is derived from it with the same
 * rules the payslip uses (see calculateStructure), so what HR sees here is what
 * the employee will see on their first slip.
 */
export function SalaryStructureCard({ form, onChange }: SalaryStructureCardProps) {
  const rows = useMemo(() => {
    if (!form.ctc || form.ctc <= 0) return null
    const s = calculateStructure(form.ctc)
    const ptM = calculatePt(form.workState, s.grossM)
    const netM = s.grossM - s.eePfM - ptM
    return {
      earnings: [
        { label: 'Basic', rule: '40% of Gross', m: s.basicM, a: s.basicA },
        { label: 'HRA', rule: '50% of Basic', m: s.hraM, a: s.hraA },
        { label: 'Special allowance', rule: 'Balance', m: s.specialM, a: s.specialA },
      ],
      gross: { m: s.grossM, a: s.grossA },
      employer: [
        { label: 'Employer PF', rule: '12% of Basic, PF wage capped at ₹15,000', m: s.erPfM, a: s.erPfA },
        { label: 'Gratuity', rule: '4.81% of Basic', m: s.gratM, a: s.gratA },
      ],
      ctc: { m: s.grossM + s.erPfM + s.gratM, a: s.ctc },
      deductions: [
        { label: 'Employee PF', rule: '12% of Basic, PF wage capped at ₹15,000', m: s.eePfM, a: s.eePfM * 12 },
        { label: 'Professional tax', rule: `As applicable (${form.workState || 'state not set'})`, m: ptM, a: ptM * 12 },
      ],
      net: { m: netM, a: netM * 12 },
    }
  }, [form.ctc, form.workState])

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
          <label>Pay cycle</label>
          <select value={form.payCycle} onChange={(e) => onChange('payCycle', e.target.value)}>
            <option value="Monthly">Monthly</option>
            <option value="Fortnightly">Fortnightly</option>
          </select>
        </div>
      </div>

      <div id="structPreview" style={{ marginTop: '14px' }}>
        {rows ? (
          <table>
            <thead>
              <tr>
                <th>Component</th>
                <th>Formula</th>
                <th style={{ textAlign: 'right' }}>Monthly</th>
                <th style={{ textAlign: 'right' }}>Annual</th>
              </tr>
            </thead>
            <tbody>
              {rows.earnings.map((r) => (
                <Line key={r.label} {...r} />
              ))}
              <Line label="Gross" rule="Basic + HRA + Special" m={rows.gross.m} a={rows.gross.a} strong />
              {rows.employer.map((r) => (
                <Line key={r.label} {...r} />
              ))}
              <Line label="CTC" rule="Gross + Employer PF + Gratuity" m={rows.ctc.m} a={rows.ctc.a} strong />
              {rows.deductions.map((r) => (
                <Line key={r.label} {...r} deduction />
              ))}
              <Line label="Net salary" rule="Gross − Employee PF − PT" m={rows.net.m} a={rows.net.a} strong />
            </tbody>
          </table>
        ) : (
          <div className="hint">Enter an annual CTC to see the full salary breakdown.</div>
        )}
      </div>
    </>
  )
}

function Line({
  label,
  rule,
  m,
  a,
  strong,
  deduction,
}: {
  label: string
  rule: string
  m: number
  a: number
  strong?: boolean
  deduction?: boolean
}) {
  const fmt = (n: number) => (deduction && n > 0 ? `− ${formatInr(n)}` : formatInr(n))
  const weight = strong ? 700 : 400
  return (
    <tr>
      <td style={{ fontWeight: weight }}>{label}</td>
      <td style={{ color: 'var(--muted)', fontSize: 12 }}>{rule}</td>
      <td style={{ textAlign: 'right', fontWeight: weight }}>{fmt(m)}</td>
      <td style={{ textAlign: 'right', fontWeight: weight }}>{fmt(a)}</td>
    </tr>
  )
}
