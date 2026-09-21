import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { profileApi } from '../profile.api'
import type { ProfileView } from '../profile.types'
import { fmtDate } from '../../../shared/lib/date'

interface Props {
  employee: ProfileView
  onRefresh: () => Promise<void> | void
}

const isEmployeeContractor = (emp: ProfileView): boolean =>
  Boolean(
    emp.isContractor ||
      emp.employmentType?.toLowerCase().includes('contract') ||
      emp.designation?.toLowerCase().includes('contract') ||
      emp.department?.toLowerCase().includes('contract'),
  )

export function AdminLifecycleControls({ employee, onRefresh }: Props) {
  const navigate = useNavigate()

  // Modal visibility states
  const [showDismissModal, setShowDismissModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showSalaryModal, setShowSalaryModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Loading and feedback states
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Local state for immediate reactive UI
  const [isLoginDisabled, setIsLoginDisabled] = useState(Boolean(employee.isLoginDisabled))
  const [isSalaryStopped, setIsSalaryStopped] = useState(Boolean(employee.isSalaryStopped))
  const [isExited, setIsExited] = useState(Boolean(employee.lastWorkingDay || employee.dateOfLeaving))
  const [isContractor, setIsContractor] = useState(isEmployeeContractor(employee))

  useEffect(() => {
    setIsLoginDisabled(Boolean(employee.isLoginDisabled))
    setIsSalaryStopped(Boolean(employee.isSalaryStopped))
    setIsExited(Boolean(employee.lastWorkingDay || employee.dateOfLeaving))
    setIsContractor(isEmployeeContractor(employee))
  }, [
    employee.isLoginDisabled,
    employee.isSalaryStopped,
    employee.lastWorkingDay,
    employee.dateOfLeaving,
    employee.isContractor,
    employee.employmentType,
    employee.designation,
    employee.department,
  ])

  // Dismiss form fields
  const [resignationDate, setResignationDate] = useState(
    employee.resignationDate || new Date().toISOString().slice(0, 10),
  )
  const [resignationReason, setResignationReason] = useState(
    employee.resignationReason || '',
  )
  const [isNoticeServing, setIsNoticeServing] = useState<boolean>(
    employee.isNoticeServing !== undefined ? employee.isNoticeServing : true,
  )
  const [lastWorkingDay, setLastWorkingDay] = useState(
    employee.lastWorkingDay || employee.dateOfLeaving || new Date().toISOString().slice(0, 10),
  )
  const [isRehireEligible, setIsRehireEligible] = useState<boolean>(
    employee.isRehireEligible !== undefined ? employee.isRehireEligible : true,
  )
  const [exitNotes, setExitNotes] = useState(employee.exitNotes || '')

  // Stop salary reason
  const [salaryReason, setSalaryReason] = useState('')

  // Delete confirmation code
  const [deleteConfirmCode, setDeleteConfirmCode] = useState('')

  // Handlers
  const handleDismissSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await profileApi.dismissEmployee(employee.employeeId, {
        resignationDate: resignationDate || null,
        resignationReason,
        isNoticeServing,
        lastWorkingDay,
        isRehireEligible,
        exitNotes: exitNotes || undefined,
      })
      setIsExited(true)
      setSuccessMsg(
        isContractor
          ? 'Contractor exit details successfully recorded.'
          : 'Employee exit details successfully recorded.',
      )
      setShowDismissModal(false)
      await onRefresh()
      setTimeout(() => setSuccessMsg(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit exit details.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleLogin = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const nextState = !isLoginDisabled
      const res = await profileApi.toggleLogin(employee.employeeId, nextState)
      const newStatus = typeof res?.isLoginDisabled === 'boolean' ? res.isLoginDisabled : nextState
      setIsLoginDisabled(newStatus)
      setSuccessMsg(
        newStatus
          ? `${isContractor ? 'Contractor' : 'Employee'} login has been disabled and all active sessions terminated.`
          : `${isContractor ? 'Contractor' : 'Employee'} login has been re-enabled.`,
      )
      setShowLoginModal(false)
      await onRefresh()
      setTimeout(() => setSuccessMsg(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update login status.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleSalary = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const nextState = !isSalaryStopped
      const res = await profileApi.toggleSalary(employee.employeeId, {
        stopped: nextState,
        reason: nextState ? salaryReason : undefined,
      })
      const newStatus = typeof res?.isSalaryStopped === 'boolean' ? res.isSalaryStopped : nextState
      setIsSalaryStopped(newStatus)
      setSuccessMsg(
        newStatus
          ? 'Salary disbursement has been put on hold.'
          : 'Salary disbursement has been resumed.',
      )
      setShowSalaryModal(false)
      setSalaryReason('')
      await onRefresh()
      setTimeout(() => setSuccessMsg(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update salary status.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (deleteConfirmCode.trim() !== employee.employeeCode.trim()) {
      setError(`Please type "${employee.employeeCode}" exactly to confirm deletion.`)
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await profileApi.deleteEmployee(employee.employeeId)
      setShowDeleteModal(false)
      navigate('/team')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Could not delete ${isContractor ? 'contractor' : 'employee'}.`,
      )
      setSubmitting(false)
    }
  }

  return (
    <div
      className="card"
      style={{
        marginBottom: 16,
        border: '1px solid #e0d7cb',
        background: '#fffcf7',
        borderRadius: 16,
        padding: '18px 20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 700,
              color: 'var(--ink)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <span>
              ⚙️ {isContractor ? 'Contractor Lifecycle & Admin Controls' : 'Employee Lifecycle & Admin Controls'}
            </span>
            <span className="tag" style={{ background: '#ede7de', color: '#555' }}>
              Admin Only
            </span>

            {/* Employment Type Selector (Full-time vs Contractor) */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
              <span style={{ fontSize: 11.5, color: 'var(--muted2)', fontWeight: 500 }}>Type:</span>
              <select
                value={isContractor ? 'Contract' : 'Full-time'}
                onChange={async (e) => {
                  const nextType = e.target.value
                  const nextIsContractor = nextType === 'Contract'
                  setIsContractor(nextIsContractor)
                  try {
                    await profileApi.updateEmploymentType(employee.employeeId, nextType)
                    setSuccessMsg(`Employment type updated to ${nextType}.`)
                    await onRefresh()
                    setTimeout(() => setSuccessMsg(null), 4000)
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Could not update employment type.')
                  }
                }}
                disabled={submitting}
                style={{
                  padding: '2px 8px',
                  borderRadius: 8,
                  border: '1px solid var(--line)',
                  fontSize: 11.5,
                  fontWeight: 600,
                  background: isContractor ? '#f3e8ff' : '#eff6ff',
                  color: isContractor ? '#6b21a8' : '#1e40af',
                  cursor: 'pointer',
                }}
                title="Switch between Full-time employee and Contractor"
              >
                <option value="Full-time">💼 Full-time</option>
                <option value="Contract">📋 Contractor</option>
              </select>
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted2)', marginTop: 2 }}>
            {isContractor
              ? 'Manage contractor engagement, contract termination, and account access.'
              : 'Manage employment status, resignation details, salary disbursement, and account access.'}
          </div>
        </div>

        {/* Live Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {isLoginDisabled ? (
            <span
              className="chip"
              style={{
                background: '#fcebeb',
                color: 'var(--red)',
                borderColor: '#fad2d2',
                fontWeight: 600,
              }}
            >
              🔒 Login Disabled
            </span>
          ) : (
            <span
              className="chip"
              style={{
                background: '#e6f6ee',
                color: 'var(--green)',
                borderColor: '#c3ecd7',
                fontWeight: 600,
              }}
            >
              ✓ Login Active
            </span>
          )}

          {/* Salary indicator — only relevant for regular salaried employees */}
          {!isContractor &&
            (isSalaryStopped ? (
              <span
                className="chip"
                style={{
                  background: '#fdf3e0',
                  color: 'var(--amber)',
                  borderColor: '#fae2b8',
                  fontWeight: 600,
                }}
              >
                ⏸ Salary On Hold
              </span>
            ) : (
              <span
                className="chip"
                style={{
                  background: '#e6f6ee',
                  color: 'var(--green)',
                  borderColor: '#c3ecd7',
                  fontWeight: 600,
                }}
              >
                ✓ Salary Active
              </span>
            ))}

          {isExited && (
            <span className="chip c-abs" style={{ fontWeight: 600 }}>
              🚪 {isContractor ? 'Contract Ended' : 'Exited'} (
              {fmtDate(employee.lastWorkingDay || employee.dateOfLeaving!)})
            </span>
          )}
        </div>
      </div>

      {successMsg && (
        <div
          className="notice green"
          style={{ marginBottom: 14, padding: '9px 14px', fontSize: 13 }}
        >
          ✓ {successMsg}
        </div>
      )}

      {error && (
        <div
          className="notice bad"
          style={{ marginBottom: 14, padding: '9px 14px', fontSize: 13 }}
        >
          {error}
        </div>
      )}

      {/* Admin Action Buttons:
          - If Contractor: Remove Contractor, Disable Login, Delete Contractor (Stop Salary is hidden)
          - If Regular: Dismiss Employee, Stop Salary, Disable Login, Delete Employee
      */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* Option 1: Remove Contractor / Dismiss Employee */}
        <button
          type="button"
          className="btn sm"
          onClick={() => {
            setError(null)
            setShowDismissModal(true)
          }}
          style={{
            background: isExited ? '#f4efe8' : '#2d3748',
            color: isExited ? '#333' : '#fff',
            border: isExited ? '1px solid #dcd3c7' : 'none',
            fontWeight: 600,
          }}
        >
          🚪{' '}
          {isContractor
            ? isExited
              ? 'Edit Contract Exit Details'
              : 'Remove Contractor'
            : isExited
              ? 'Edit Exit Details'
              : 'Dismiss Employee'}
        </button>

        {/* Option 2: Stop Salary / Resume Salary — ONLY FOR FULL-TIME EMPLOYEES */}
        {!isContractor && (
          <button
            type="button"
            className="btn sm"
            onClick={() => {
              setError(null)
              if (isSalaryStopped) {
                void handleToggleSalary()
              } else {
                setShowSalaryModal(true)
              }
            }}
            disabled={submitting}
            style={{
              background: isSalaryStopped ? '#0fa968' : '#fff',
              color: isSalaryStopped ? '#fff' : '#b45309',
              border: isSalaryStopped ? 'none' : '1px solid #f6cf86',
              fontWeight: 600,
            }}
          >
            {isSalaryStopped ? '▶ Resume Salary' : '⏸ Stop Salary'}
          </button>
        )}

        {/* Option 3: Disable Login / Enable Login */}
        <button
          type="button"
          className="btn sm"
          onClick={() => {
            setError(null)
            if (isLoginDisabled) {
              void handleToggleLogin()
            } else {
              setShowLoginModal(true)
            }
          }}
          disabled={submitting}
          style={{
            background: isLoginDisabled ? '#2563eb' : '#fff',
            color: isLoginDisabled ? '#fff' : '#c53030',
            border: isLoginDisabled ? 'none' : '1px solid #fca5a5',
            fontWeight: 600,
          }}
        >
          {isLoginDisabled ? '🔓 Enable Login' : '🔒 Disable Login'}
        </button>

        {/* Option 4: Delete Contractor / Delete Employee */}
        <button
          type="button"
          className="btn sm"
          onClick={() => {
            setError(null)
            setDeleteConfirmCode('')
            setShowDeleteModal(true)
          }}
          style={{
            background: '#fff',
            color: 'var(--red)',
            border: '1px solid var(--red)',
            marginLeft: 'auto',
            fontWeight: 600,
          }}
        >
          🗑 {isContractor ? 'Delete Contractor' : 'Delete Employee'}
        </button>
      </div>

      {/* Dismissal / Contract Summary Box if already exited */}
      {isExited && (
        <div
          style={{
            marginTop: 14,
            padding: '12px 14px',
            background: '#fff',
            borderRadius: 10,
            border: '1px solid var(--line)',
            fontSize: 12.5,
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
            📋 {isContractor ? 'Recorded Contract End Information:' : 'Recorded Exit Information:'}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 8,
            }}
          >
            <div>
              <b>{isContractor ? 'Contract Notice Date:' : 'Resignation Date:'}</b>{' '}
              {employee.resignationDate ? fmtDate(employee.resignationDate) : 'Not recorded'}
            </div>
            <div>
              <b>{isContractor ? 'Contract End Date:' : 'Last Working Day:'}</b>{' '}
              {employee.lastWorkingDay
                ? fmtDate(employee.lastWorkingDay)
                : employee.dateOfLeaving
                  ? fmtDate(employee.dateOfLeaving)
                  : '—'}
            </div>
            <div>
              <b>Notice / Handover Period:</b>{' '}
              {employee.isNoticeServing ? 'Yes' : 'No'}
            </div>
            <div>
              <b>{isContractor ? 'Eligible for Re-engagement:' : 'Eligible for Rehire:'}</b>{' '}
              {employee.isRehireEligible ? 'Yes' : 'No'}
            </div>
          </div>
          {employee.resignationReason && (
            <div style={{ marginTop: 6 }}>
              <b>{isContractor ? 'Reason for Termination / Removal:' : 'Reason:'}</b>{' '}
              {employee.resignationReason}
            </div>
          )}
          {employee.exitNotes && (
            <div style={{ marginTop: 4, color: 'var(--muted2)' }}>
              <b>Notes:</b> {employee.exitNotes}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL 1: REMOVE CONTRACTOR / DISMISS EMPLOYEE FORM
          ========================================================================= */}
      <div className={`modal ${showDismissModal ? 'on' : ''}`}>
        <div className="box" style={{ maxWidth: 540 }}>
          <div className="mh">
            <div>
              <h3 style={{ margin: 0, fontSize: 17 }}>
                {isContractor
                  ? isExited
                    ? 'Update Contract Exit Details'
                    : 'Remove Contractor — End of Contract / Termination Form'
                  : isExited
                    ? 'Update Exit Details'
                    : 'Dismiss Employee — Resignation / Exit Form'}
              </h3>
              <div style={{ fontSize: 12.5, color: 'var(--muted2)', marginTop: 3 }}>
                Recording {isContractor ? 'contract exit' : 'exit'} details for{' '}
                <b>{employee.fullName}</b> ({employee.employeeCode})
              </div>
            </div>
            <button
              type="button"
              className="x"
              onClick={() => setShowDismissModal(false)}
              disabled={submitting}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleDismissSubmit}>
            {/* Field 1: Date of resignation / notice */}
            <div className="f" style={{ marginBottom: 14 }}>
              <label htmlFor="resignationDate" style={{ fontWeight: 600, fontSize: 12 }}>
                {isContractor ? 'Date of Contract Termination / Notice' : 'Date of Resignation'}{' '}
                <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <input
                id="resignationDate"
                type="date"
                value={resignationDate}
                onChange={(e) => setResignationDate(e.target.value)}
                required
              />
            </div>

            {/* Field 2: Reason */}
            <div className="f" style={{ marginBottom: 14 }}>
              <label htmlFor="resignationReason" style={{ fontWeight: 600, fontSize: 12 }}>
                {isContractor ? 'Reason for Contract Termination / Removal' : 'Reason of Resignation'}{' '}
                <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <textarea
                id="resignationReason"
                rows={3}
                placeholder={
                  isContractor
                    ? 'Enter reason for contract termination or non-renewal...'
                    : 'Enter detailed reason for resignation / termination...'
                }
                value={resignationReason}
                onChange={(e) => setResignationReason(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 11,
                  border: '1px solid var(--line)',
                  font: '400 13px Inter, sans-serif',
                  outline: 'none',
                }}
              />
            </div>

            {/* Field 3: Notice period */}
            <div className="f" style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, display: 'block' }}>
                {isContractor ? 'Is Notice / Handover Period Serving?' : 'Is Notice Period Serving?'}{' '}
                <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="radio"
                    name="isNoticeServing"
                    checked={isNoticeServing === true}
                    onChange={() => setIsNoticeServing(true)}
                    style={{ width: 'auto' }}
                  />
                  <span>
                    {isContractor ? 'Yes, serving notice / handover' : 'Yes, serving notice period'}
                  </span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="radio"
                    name="isNoticeServing"
                    checked={isNoticeServing === false}
                    onChange={() => setIsNoticeServing(false)}
                    style={{ width: 'auto' }}
                  />
                  <span>
                    {isContractor ? 'No (Immediate / contract ended)' : 'No (Immediate / waived)'}
                  </span>
                </label>
              </div>
            </div>

            {/* Field 4: Last working day / contract end date */}
            <div className="f" style={{ marginBottom: 14 }}>
              <label htmlFor="lastWorkingDay" style={{ fontWeight: 600, fontSize: 12 }}>
                {isContractor ? 'What is Last Working Day / Contract End Date?' : 'What is Last Working Day?'}{' '}
                <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <input
                id="lastWorkingDay"
                type="date"
                value={lastWorkingDay}
                onChange={(e) => setLastWorkingDay(e.target.value)}
                required
              />
            </div>

            {/* Field 5: Eligible for rehire / re-engagement */}
            <div className="f" style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, display: 'block' }}>
                {isContractor ? 'Eligible for Re-engagement / Rehire?' : 'Eligible for Rehire?'}{' '}
                <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="radio"
                    name="isRehireEligible"
                    checked={isRehireEligible === true}
                    onChange={() => setIsRehireEligible(true)}
                    style={{ width: 'auto' }}
                  />
                  <span>
                    {isContractor ? 'Yes, eligible for future contracts' : 'Yes, eligible for rehire'}
                  </span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="radio"
                    name="isRehireEligible"
                    checked={isRehireEligible === false}
                    onChange={() => setIsRehireEligible(false)}
                    style={{ width: 'auto' }}
                  />
                  <span>No, not eligible</span>
                </label>
              </div>
            </div>

            {/* Field 6: Exit notes (optional) */}
            <div className="f" style={{ marginBottom: 18 }}>
              <label htmlFor="exitNotes" style={{ fontWeight: 600, fontSize: 12 }}>
                {isContractor
                  ? 'Contract Notes / Handover Remarks (Optional)'
                  : 'Exit Remarks / Handover Notes (Optional)'}
              </label>
              <input
                id="exitNotes"
                type="text"
                placeholder="Any special remarks or handover notes..."
                value={exitNotes}
                onChange={(e) => setExitNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
              <button
                type="button"
                className="btn ghost"
                onClick={() => setShowDismissModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn primary"
                disabled={submitting}
                style={{ background: '#2d3748' }}
              >
                {submitting ? 'Saving…' : isContractor ? 'Save Contract Details' : 'Save Exit Details'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* =========================================================================
          MODAL 2: STOP SALARY (Non-contract only)
          ========================================================================= */}
      {!isContractor && (
        <div className={`modal ${showSalaryModal ? 'on' : ''}`}>
          <div className="box" style={{ maxWidth: 460 }}>
            <div className="mh">
              <div>
                <h3 style={{ margin: 0, fontSize: 17 }}>Stop Salary Disbursement</h3>
                <div style={{ fontSize: 12.5, color: 'var(--muted2)', marginTop: 3 }}>
                  For <b>{employee.fullName}</b> ({employee.employeeCode})
                </div>
              </div>
              <button
                type="button"
                className="x"
                onClick={() => setShowSalaryModal(false)}
                disabled={submitting}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleToggleSalary}>
              <p style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 14, lineHeight: 1.5 }}>
                Putting salary on hold suspends automatic salary disbursements and payroll processing for this employee (e.g. pending clearance, notice period verification).
              </p>

              <div className="f" style={{ marginBottom: 18 }}>
                <label htmlFor="salaryReason" style={{ fontWeight: 600, fontSize: 12 }}>
                  Reason for Stopping Salary (Optional)
                </label>
                <input
                  id="salaryReason"
                  type="text"
                  placeholder="e.g. Exit clearance pending, Notice period hold"
                  value={salaryReason}
                  onChange={(e) => setSalaryReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setShowSalaryModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  disabled={submitting}
                  style={{ background: '#dd8b08', color: '#fff' }}
                >
                  {submitting ? 'Processing…' : 'Confirm Stop Salary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: DISABLE LOGIN CONFIRMATION
          ========================================================================= */}
      <div className={`modal ${showLoginModal ? 'on' : ''}`}>
        <div className="box" style={{ maxWidth: 460 }}>
          <div className="mh">
            <div>
              <h3 style={{ margin: 0, fontSize: 17 }}>
                {isContractor ? 'Disable Contractor Login' : 'Disable Employee Login'}
              </h3>
              <div style={{ fontSize: 12.5, color: 'var(--muted2)', marginTop: 3 }}>
                For <b>{employee.fullName}</b> ({employee.employeeCode})
              </div>
            </div>
            <button
              type="button"
              className="x"
              onClick={() => setShowLoginModal(false)}
              disabled={submitting}
            >
              ✕
            </button>
          </div>

          <p style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 16, lineHeight: 1.5 }}>
            Are you sure you want to disable login for <b>{employee.fullName}</b>?
          </p>
          <ul style={{ fontSize: 12.5, color: 'var(--muted2)', paddingLeft: 18, marginBottom: 18, lineHeight: 1.6 }}>
            <li>All active sessions on web and mobile will be terminated immediately.</li>
            <li>The {isContractor ? 'contractor' : 'employee'} will not be able to sign in to the portal.</li>
            <li>You can re-enable login anytime by clicking <b>Enable Login</b>.</li>
          </ul>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              className="btn ghost"
              onClick={() => setShowLoginModal(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => void handleToggleLogin()}
              disabled={submitting}
              style={{ background: 'var(--red)', color: '#fff' }}
            >
              {submitting ? 'Disabling…' : 'Yes, Disable Login'}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL 4: DELETE RECORD (DANGER ZONE)
          ========================================================================= */}
      <div className={`modal ${showDeleteModal ? 'on' : ''}`}>
        <div className="box" style={{ maxWidth: 480 }}>
          <div className="mh">
            <div>
              <h3 style={{ margin: 0, fontSize: 17, color: 'var(--red)' }}>
                ⚠️ {isContractor ? 'Delete Contractor Record' : 'Delete Employee Record'}
              </h3>
              <div style={{ fontSize: 12.5, color: 'var(--muted2)', marginTop: 3 }}>
                Soft delete for <b>{employee.fullName}</b> ({employee.employeeCode})
              </div>
            </div>
            <button
              type="button"
              className="x"
              onClick={() => setShowDeleteModal(false)}
              disabled={submitting}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleDeleteSubmit}>
            <div
              style={{
                background: '#fcebeb',
                border: '1px solid #fad2d2',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 12.5,
                color: '#991b1b',
                lineHeight: 1.5,
                marginBottom: 16,
              }}
            >
              <b>Important:</b> This {isContractor ? 'contractor' : 'employee'} will be immediately removed from the Team Directory, reporting lines, and regular company views. Historical leaves, attendance, and documents are retained in the database records (`deleted_at`).
            </div>

            <div className="f" style={{ marginBottom: 18 }}>
              <label htmlFor="deleteConfirmCode" style={{ fontWeight: 600, fontSize: 12 }}>
                Type {isContractor ? 'contractor' : 'employee'} code <b>{employee.employeeCode}</b> to confirm deletion:
              </label>
              <input
                id="deleteConfirmCode"
                type="text"
                placeholder={employee.employeeCode}
                value={deleteConfirmCode}
                onChange={(e) => setDeleteConfirmCode(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn ghost"
                onClick={() => setShowDeleteModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn"
                disabled={submitting || deleteConfirmCode.trim() !== employee.employeeCode.trim()}
                style={{
                  background:
                    deleteConfirmCode.trim() === employee.employeeCode.trim()
                      ? 'var(--red)'
                      : '#fca5a5',
                  color: '#fff',
                  cursor:
                    deleteConfirmCode.trim() === employee.employeeCode.trim()
                      ? 'pointer'
                      : 'not-allowed',
                }}
              >
                {submitting
                  ? 'Deleting…'
                  : isContractor
                    ? 'Delete Contractor'
                    : 'Permanently Delete'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
