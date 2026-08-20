import { useState, type FormEvent } from 'react'
import { employeesApi } from '../api/employees'
import type { Employee, EmployeeStatus } from '../types/employee'

interface EmployeeFormModalProps {
  employee: Employee | null
  onClose: () => void
  onSaved: () => void
}

interface FormState {
  employeeCode: string
  firstName: string
  lastName: string
  email: string
  phone: string
  department: string
  designation: string
  dateOfJoining: string
  status: EmployeeStatus
}

const emptyForm: FormState = {
  employeeCode: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  department: '',
  designation: '',
  dateOfJoining: '',
  status: 'active',
}

const toFormState = (employee: Employee): FormState => ({
  employeeCode: employee.employeeCode,
  firstName: employee.firstName,
  lastName: employee.lastName,
  email: employee.email,
  phone: employee.phone ?? '',
  department: employee.department ?? '',
  designation: employee.designation ?? '',
  dateOfJoining: employee.dateOfJoining,
  status: employee.status,
})

const orNull = (value: string): string | null => (value.trim() === '' ? null : value.trim())

export function EmployeeFormModal({ employee, onClose, onSaved }: EmployeeFormModalProps) {
  const isEdit = employee !== null
  const [form, setForm] = useState<FormState>(isEdit ? toFormState(employee) : emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const base = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: orNull(form.phone),
        department: orNull(form.department),
        designation: orNull(form.designation),
        dateOfJoining: form.dateOfJoining,
        status: form.status,
      }
      if (isEdit) {
        await employeesApi.update(employee.id, base)
      } else {
        await employeesApi.create({ ...base, employeeCode: form.employeeCode.trim() })
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Employee' : 'Add Employee'}</h2>
          <button className="btn btn-ghost modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field">
              <span>Employee Code *</span>
              <input
                value={form.employeeCode}
                onChange={(event) => setField('employeeCode', event.target.value)}
                placeholder="EMP-0001"
                required
                disabled={isEdit}
                title={isEdit ? 'Employee code cannot be changed' : undefined}
              />
            </label>
            <label className="field">
              <span>Date of Joining *</span>
              <input
                type="date"
                value={form.dateOfJoining}
                onChange={(event) => setField('dateOfJoining', event.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>First Name *</span>
              <input
                value={form.firstName}
                onChange={(event) => setField('firstName', event.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Last Name *</span>
              <input
                value={form.lastName}
                onChange={(event) => setField('lastName', event.target.value)}
                required
              />
            </label>
            <label className="field field-wide">
              <span>Email *</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setField('email', event.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Phone</span>
              <input
                value={form.phone}
                onChange={(event) => setField('phone', event.target.value)}
              />
            </label>
            <label className="field">
              <span>Status</span>
              <select
                value={form.status}
                onChange={(event) => setField('status', event.target.value as EmployeeStatus)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label className="field">
              <span>Department</span>
              <input
                value={form.department}
                onChange={(event) => setField('department', event.target.value)}
                placeholder="Engineering"
              />
            </label>
            <label className="field">
              <span>Designation</span>
              <input
                value={form.designation}
                onChange={(event) => setField('designation', event.target.value)}
                placeholder="Software Engineer"
              />
            </label>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
