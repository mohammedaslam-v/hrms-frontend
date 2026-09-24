import type { EmployeeFormState, EmployeeMetaDto } from '../types/employee-form.types'

interface PersonalRoleCardProps {
  form: EmployeeFormState
  meta: EmployeeMetaDto
  onChange: <K extends keyof EmployeeFormState>(field: K, value: EmployeeFormState[K]) => void
}

export function PersonalRoleCard({ form, meta, onChange }: PersonalRoleCardProps) {
  return (
    <>
      <div className="formhead">Personal &amp; role</div>
      <div className="grid g2">
        <div className="f">
          <label>Full name *</label>
          <input
            id="nName"
            type="text"
            placeholder="e.g. Ananya Rao"
            value={form.fullName}
            onChange={(e) => onChange('fullName', e.target.value)}
            required
          />
        </div>

        <div className="f">
          <label>Title</label>
          <input
            id="nTitle"
            type="text"
            placeholder="e.g. Growth Marketer"
            value={form.title}
            onChange={(e) => onChange('title', e.target.value)}
          />
        </div>

        <div className="f">
          <label>Department</label>
          <select
            id="nDept"
            value={form.department}
            onChange={(e) => onChange('department', e.target.value)}
          >
            {meta.departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div className="f">
          <label>Reporting manager</label>
          <select
            id="mgrSelect"
            value={form.managerId}
            onChange={(e) => onChange('managerId', e.target.value)}
          >
            <option value="">None / Self</option>
            {meta.managers.map((mgr) => (
              <option key={mgr.id} value={mgr.id}>
                {mgr.name} ({mgr.employeeCode}){mgr.department ? ` · ${mgr.department}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="f">
          <label>Date of joining *</label>
          <input
            id="nDoj"
            type="date"
            value={form.dateOfJoining}
            onChange={(e) => onChange('dateOfJoining', e.target.value)}
            required
          />
        </div>

        <div className="f">
          <label>Date of leaving</label>
          <input
            id="nDol"
            type="date"
            value={form.dateOfLeaving}
            onChange={(e) => onChange('dateOfLeaving', e.target.value)}
          />
        </div>

        <div className="f">
          <label>Date of birth *</label>
          <input
            id="nDob"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => onChange('dateOfBirth', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="f">
          <label>Work Email *</label>
          <input
            id="nEmail"
            type="email"
            placeholder="name@bambinos.live"
            value={form.workEmail}
            onChange={(e) => onChange('workEmail', e.target.value)}
            required
          />
        </div>

        <div className="f">
          <label>Phone</label>
          <input
            id="nPhone"
            type="tel"
            placeholder="+91 …"
            value={form.phone}
            onChange={(e) => onChange('phone', e.target.value)}
          />
        </div>

        <div className="f">
          <label>PAN</label>
          <input
            id="nPan"
            type="text"
            placeholder="ABCDE1234F"
            maxLength={10}
            style={{ textTransform: 'uppercase' }}
            value={form.pan}
            onChange={(e) => onChange('pan', e.target.value.toUpperCase())}
          />
        </div>

        <div className="f">
          <label>UAN (provident fund)</label>
          <input
            id="nUan"
            type="text"
            placeholder="12 digits"
            maxLength={12}
            value={form.uan}
            onChange={(e) => onChange('uan', e.target.value)}
          />
        </div>

        <div className="f">
          <label>Work location</label>
          <select
            id="nState"
            value={form.workState}
            onChange={(e) => onChange('workState', e.target.value)}
          >
            {meta.workStates.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div className="f">
          <label>Opening leave balance</label>
          <input
            id="nLeave"
            type="number"
            min={0}
            step={0.5}
            value={form.openingLeave}
            onChange={(e) => onChange('openingLeave', Number(e.target.value) || 0)}
          />
        </div>
      </div>
    </>
  )
}
