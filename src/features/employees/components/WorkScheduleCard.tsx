import type { EmployeeFormState, EmployeeMetaDto } from '../types/employee-form.types'

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface WorkScheduleCardProps {
  form: EmployeeFormState
  meta: EmployeeMetaDto
  submitting: boolean
  onChange: <K extends keyof EmployeeFormState>(field: K, value: EmployeeFormState[K]) => void
  onSubmit: () => void
  onCancel: () => void
}

export function WorkScheduleCard({
  form,
  meta,
  submitting,
  onChange,
  onSubmit,
  onCancel,
}: WorkScheduleCardProps) {
  const toggleDay = (day: string) => {
    const isSelected = form.workingDays.includes(day)
    let next: string[]
    if (isSelected) {
      next = form.workingDays.filter((d) => d !== day)
    } else {
      next = [...form.workingDays, day]
    }
    onChange('workingDays', next)
  }

  const offDays = ALL_DAYS.filter((d) => !form.workingDays.includes(d))
  const offPreviewText = offDays.length > 0
    ? `${offDays.join(' + ')} off every week`
    : 'No weekly off set'

  return (
    <div className="card">
      <div className="formhead">Work schedule</div>
      <div className="fgrid">
        <div className="f">
          <label>Work mode</label>
          <select
            id="nMode"
            value={form.workMode}
            onChange={(e) => onChange('workMode', e.target.value as EmployeeFormState['workMode'])}
          >
            {meta.workModes.map((mode) => (
              <option key={mode} value={mode}>
                {mode === 'WFH' ? 'Work from home' : mode === 'WFO' ? 'Work from office' : 'Hybrid'}
              </option>
            ))}
          </select>
        </div>

        <div className="grid g2">
          <div className="f">
            <label>Shift start</label>
            <input
              id="nStart"
              type="time"
              value={form.shiftStart}
              onChange={(e) => onChange('shiftStart', e.target.value)}
            />
          </div>
          <div className="f">
            <label>Shift end</label>
            <input
              id="nEnd"
              type="time"
              value={form.shiftEnd}
              onChange={(e) => onChange('shiftEnd', e.target.value)}
            />
          </div>
        </div>

        <div className="f">
          <label>Working days · tap to toggle</label>
          <div className="daychips" id="dayChips">
            {ALL_DAYS.map((day) => {
              const isOn = form.workingDays.includes(day)
              return (
                <span
                  key={day}
                  className={`daychip ${isOn ? 'on' : ''}`}
                  onClick={() => toggleDay(day)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault()
                      toggleDay(day)
                    }
                  }}
                >
                  {day}
                </span>
              )
            })}
          </div>
        </div>

        <div className="f">
          <label>Weekly off preview</label>
          <div id="offPreview" style={{ fontSize: '13px', color: 'var(--muted2)' }}>
            {offPreviewText}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '9px', marginTop: '22px' }}>
        <button
          type="button"
          className="btn primary"
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting ? 'Saving employee…' : 'Save employee'}
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>

      <div className="notice blue mt">
        New joiners start accruing 2 paid leaves a month from their joining month, and appear on the next payroll run automatically.
      </div>
    </div>
  )
}
