import { useCallback, useEffect, useState } from 'react'
import { employeesApi } from './api/employees'
import { EmployeeFormModal } from './components/EmployeeFormModal'
import { EmployeeTable } from './components/EmployeeTable'
import type { Employee } from './types/employee'

function App() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)

  const loadEmployees = useCallback(async () => {
    setError(null)
    try {
      setEmployees(await employeesApi.list())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employees')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadEmployees()
  }, [loadEmployees])

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (employee: Employee) => {
    setEditing(employee)
    setModalOpen(true)
  }

  const handleSaved = () => {
    setModalOpen(false)
    setEditing(null)
    void loadEmployees()
  }

  const handleDelete = async (employee: Employee) => {
    const name = `${employee.firstName} ${employee.lastName}`
    if (!window.confirm(`Delete ${name} (${employee.employeeCode})? This cannot be undone.`)) {
      return
    }
    try {
      await employeesApi.remove(employee.id)
      void loadEmployees()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete employee')
    }
  }

  const activeCount = employees.filter((employee) => employee.status === 'active').length

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">HR</span>
          <div>
            <h1>HRMS</h1>
            <p className="brand-sub">Human Resource Management</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add Employee
        </button>
      </header>

      <main className="content">
        <section className="stats">
          <div className="stat-card">
            <p className="stat-label">Total Employees</p>
            <p className="stat-value">{loading ? '…' : employees.length}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Active</p>
            <p className="stat-value stat-active">{loading ? '…' : activeCount}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Inactive</p>
            <p className="stat-value stat-inactive">
              {loading ? '…' : employees.length - activeCount}
            </p>
          </div>
        </section>

        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button className="btn" onClick={() => void loadEmployees()}>
              Retry
            </button>
          </div>
        )}

        <section className="panel">
          <div className="panel-header">
            <h2>Employees</h2>
          </div>
          {loading ? (
            <div className="empty-state">
              <p className="empty-title">Loading employees…</p>
            </div>
          ) : (
            <EmployeeTable employees={employees} onEdit={openEdit} onDelete={handleDelete} />
          )}
        </section>
      </main>

      {modalOpen && (
        <EmployeeFormModal
          key={editing?.id ?? 'new'}
          employee={editing}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

export default App
