import type { EmployeeFormState, EmployeeMetaDto } from '../types/employee-form.types'
import {
  applySalaryEdit,
  calculatePt,
  formatInr,
  formulaComponents,
  type SalaryField,
} from '../utils/salary-calculator'

interface SalaryStructureCardProps {
  form: EmployeeFormState
  meta: EmployeeMetaDto
  onChange: <K extends keyof EmployeeFormState>(field: K, value: EmployeeFormState[K]) => void
}

/**
 * Annual CTC fills every component from the formula; each component can then
 * be overwritten. Edits are saved with the employee and used on payslips —
 * until one is made, nothing is stored and payroll keeps using the formula.
 */
export function SalaryStructureCard({ form, onChange }: SalaryStructureCardProps) {
  const ctc = form.ctc || 0
  const c = form.salaryOverride ?? formulaComponents(ctc)
  const grossM = c.basicM + c.hraM + c.specialM
  const ptM = c.professionalTaxM ?? calculatePt(form.workState, grossM)
  const netM = grossM - c.employeePfM - ptM
  const overBudget = c.specialM < 0

  // A new CTC starts again from the formula: edits made against the old figure
  // would no longer mean anything.
  const setCtc = (value: number) => {
    onChange('ctc', Math.max(0, Math.round(value || 0)))
    onChange('salaryOverride', null)
  }

  const edit = (field: SalaryField, value: number) => {
    const next = applySalaryEdit(c, field, value, ctc, form.workState)
    onChange('salaryOverride', next.components)
    if (next.ctc !== ctc) onChange('ctc', next.ctc)
  }

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
            onChange={(e) => setCtc(Number(e.target.value))}
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

      {ctc > 0 && (
        <>
          <div className="hint" style={{ margin: '14px 0 6px' }}>
            Monthly amounts, filled from the CTC. Change any of them — the rest adjust; editing Special, Gross or Net moves the CTC.
            {form.salaryOverride && (
              <>
                {' '}
                <button
                  type="button"
                  className="btn ghost sm"
                  style={{ marginLeft: 6, padding: '1px 8px', fontSize: 11 }}
                  onClick={() => onChange('salaryOverride', null)}
                >
                  Reset to formula
                </button>
              </>
            )}
          </div>

          <div className="grid g2">
            <Money label="Basic" hint="40% of Gross" value={c.basicM} onChange={(v) => edit('basicM', v)} />
            <Money label="HRA" hint="50% of Basic" value={c.hraM} onChange={(v) => edit('hraM', v)} />
            <Money
              label="Special allowance"
              hint="Balance"
              value={c.specialM}
              onChange={(v) => edit('specialM', v)}
              error={overBudget ? 'Components exceed the CTC' : undefined}
            />
            <Money label="Gross" hint="Basic + HRA + Special" value={grossM} onChange={(v) => edit('grossM', v)} strong />
            <Money
              label="Employer PF"
              hint="12% of Basic, PF wage capped at ₹15,000"
              value={c.employerPfM}
              onChange={(v) => edit('employerPfM', v)}
            />
            <Money label="Gratuity" hint="4.81% of Basic" value={c.gratuityM} onChange={(v) => edit('gratuityM', v)} />
            <Money
              label="Employee PF"
              hint="12% of Basic, PF wage capped at ₹15,000"
              value={c.employeePfM}
              onChange={(v) => edit('employeePfM', v)}
            />
            <Money
              label="Professional tax"
              hint={`As applicable${form.workState ? ` (${form.workState})` : ''}`}
              value={ptM}
              onChange={(v) => edit('professionalTaxM', v)}
            />
            <Money label="Net salary" hint="Gross − Employee PF − PT" value={netM} onChange={(v) => edit('netM', v)} strong />
          </div>
        </>
      )}
    </>
  )
}

function Money({
  label,
  hint,
  value,
  onChange,
  strong,
  error,
}: {
  label: string
  hint: string
  value: number
  onChange?: (v: number) => void
  /** Totals: shown bold, still editable. */
  strong?: boolean
  error?: string
}) {
  return (
    <div className="f">
      <label>
        {label} <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· {hint}</span>
      </label>
      <input
        type="number"
        min={0}
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => onChange?.(Number(e.target.value))}
        style={{
          ...(strong ? { fontWeight: 700 } : {}),
          ...(error ? { borderColor: '#e11d48' } : {}),
        }}
      />
      <div className="hint" style={{ color: error ? '#be123c' : undefined }}>
        {error ?? `${formatInr(value * 12)} a year`}
      </div>
    </div>
  )
}
