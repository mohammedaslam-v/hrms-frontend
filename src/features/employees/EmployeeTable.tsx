import type { Employee } from './employee.types'

interface EmployeeTableProps {
  employees: Employee[]
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
}

const initials = (employee: Employee): string =>
  `${employee.firstName[0] ?? ''}${employee.lastName[0] ?? ''}`.toUpperCase()

const formatDate = (isoDate: string): string =>
  new Date(isoDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

export function EmployeeTable({ employees, onEdit, onDelete }: EmployeeTableProps) {
  if (employees.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-title">No employees yet</p>
        <p className="empty-hint">Click “Add Employee” to create the first record.</p>
      </div>
    )
  }

  return (
    <div className="table-wrap">
      <table className="employee-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Code</th>
            <th>Contact</th>
            <th>Department</th>
            <th>Designation</th>
            <th>Joined</th>
            <th>Status</th>
            <th className="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td>
                <div className="employee-cell">
                  <span className="avatar">{initials(employee)}</span>
                  <span className="employee-name">
                    {employee.firstName} {employee.lastName}
                  </span>
                </div>
              </td>
              <td>
                <code className="emp-code">{employee.employeeCode}</code>
              </td>
              <td>
                <div className="contact-cell">
                  <span>{employee.email}</span>
                  {employee.phone && <span className="muted">{employee.phone}</span>}
                </div>
              </td>
              <td>{employee.department ?? <span className="muted">—</span>}</td>
              <td>{employee.designation ?? <span className="muted">—</span>}</td>
              <td>{formatDate(employee.dateOfJoining)}</td>
              <td>
                <span className={`badge badge-${employee.status}`}>{employee.status}</span>
              </td>
              <td>
                <div className="row-actions">
                  <button className="btn btn-ghost" onClick={() => onEdit(employee)}>
                    Edit
                  </button>
                  <button
                    className="btn btn-ghost btn-danger"
                    onClick={() => onDelete(employee)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
