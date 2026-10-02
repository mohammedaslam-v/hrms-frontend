import { useCallback, useEffect, useState } from 'react'
import { PageHero } from '../../../shared/ui/PageHero'
import { useNavigate, useParams } from 'react-router-dom'
import { profileApi } from '../profile.api'
import { FeedbackCard } from '../../feedback'
import { GoalsCard } from '../../goals'
import { ProjectsCard } from '../../projects'
import { CompensationCard } from '../components/CompensationCard'
import { DocumentsCard } from '../components/DocumentsCard'
import { TodayCard, WeekCard } from '../../attendance'
import { AdminLifecycleControls } from '../components/AdminLifecycleControls'
import { EditPersonalDetailsModal } from '../components/EditPersonalDetailsModal'
import { Toast, type ToastMessage } from '../../../shared/ui/Toast'
import { WORK_MODE_CLASS, type ProfileView, type WorkMode } from '../profile.types'
import { fmtDate } from '../../../shared/lib/date'
import { initials } from '../../../shared/lib/format'
import { DEPT_COLOR } from '../../../shared/lib/departments'

/**
 * Department colours from the design. A person with no department falls back to
 * a neutral rather than picking an arbitrary one — and today that is almost
 * everyone, since only one record has a department set.
 */

/** One label/value row. A missing value says so rather than showing a blank. */
function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="kv">
      <b>{label}</b>
      <span style={value ? undefined : { color: 'var(--muted2)' }}>{value ?? 'Not on file'}</span>
    </div>
  )
}

function fmtDob(dob?: string | null): string | null {
  if (!dob) return null
  if (/^\d{4}-\d{2}-\d{2}/.test(dob)) {
    return fmtDate(dob.slice(0, 10))
  }
  const d = new Date(dob)
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return fmtDate(`${y}-${m}-${day}`)
  }
  return dob
}

export function MyPage() {
  // The same screen serves your own profile and a team member's.
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [view, setView] = useState<ProfileView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditDetails, setShowEditDetails] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const next = id ? await profileApi.getOne(Number(id)) : await profileApi.getMine()
      setView(next)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this profile.')
      if (!silent) setView(null)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [id])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [load])

  if (loading) return <div className="boot">Loading profile…</div>

  if (!view) {
    return (
      <div className="page">
        <div className="notice bad" role="alert">
          {error ?? 'Could not load this profile.'}
        </div>
      </div>
    )
  }

  // Mirrors the server's rule: a manager or admin, and never on their own record.
  // The server refuses regardless — this only decides whether a button is offered.
  const canRecord = view.access === 'manager' || view.access === 'admin'

  const color = (view.department && DEPT_COLOR[view.department]) || 'var(--muted2)'
  const reportsTo = view.managerName ? `reports to ${view.managerName}` : 'reports to the board'

  return (
    <div className="page">
      <PageHero
        navKey="me"
        title={view.isSelf ? undefined : view.fullName}
        eyebrow={[view.employeeCode, view.department].filter(Boolean).join(' · ')}
      />

      <div className="phead">
        <span className="avatar" style={{ background: color }}>
          {initials(view.fullName)}
        </span>
        <div>
          <h2>{view.fullName}</h2>
          <div className="sub">
            {[view.designation, view.department, reportsTo].filter(Boolean).join(' · ')}
          </div>
        </div>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {!view.isSelf && view.access === 'admin' ? (
            <select
              value={view.workMode}
              onChange={async (e) => {
                const nextMode = e.target.value as WorkMode
                try {
                  await profileApi.updateWorkMode(view.employeeId, nextMode)
                  await load(true)
                } catch (err) {
                  console.error('Failed to update work mode', err)
                }
              }}
              className={`chip ${WORK_MODE_CLASS[view.workMode]}`}
              style={{
                cursor: 'pointer',
                border: '1px solid currentColor',
                fontWeight: 600,
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                outline: 'none',
              }}
              title="Admin: Click to edit Mode of Work"
            >
              <option value="WFO">WFO</option>
              <option value="WFH">WFH</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          ) : (
            <span className={`chip ${WORK_MODE_CLASS[view.workMode]}`}>{view.workMode}</span>
          )}
          {view.isContractor && (
            <span
              className="chip"
              style={{ background: '#f3e8ff', color: '#7e22ce', borderColor: '#d8b4fe', fontWeight: 600 }}
            >
              📋 Contractor
            </span>
          )}
          {view.isLoginDisabled && (
            <span
              className="chip"
              style={{ background: '#fcebeb', color: 'var(--red)', borderColor: '#fad2d2', fontWeight: 600 }}
            >
              🔒 Login Disabled
            </span>
          )}
          {!view.isContractor && view.isSalaryStopped && (
            <span
              className="chip"
              style={{ background: '#fdf3e0', color: 'var(--amber)', borderColor: '#fae2b8', fontWeight: 600 }}
            >
              ⏸ Salary On Hold
            </span>
          )}
          {(view.lastWorkingDay || view.dateOfLeaving) && (
            <span className="chip c-abs" style={{ fontWeight: 600 }}>
              {view.isContractor ? 'Contract Ended ' : 'Exited '}
              {fmtDate(view.lastWorkingDay || view.dateOfLeaving!)}
            </span>
          )}
        </span>
      </div>

      {/* A manager is looking at someone else's record — say so, so nobody
          mistakes a report's page for their own. */}
      {!view.isSelf && (
        <div
          className="notice blue"
          style={{
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div>
            You are viewing <b>{view.fullName}</b>’s page
            {view.access === 'manager' && ' as their manager'}. Pay and personal documents are not
            shown.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn sm"
              onClick={() => navigate(`/leave/${view.employeeId}`)}
              style={{
                background: 'var(--blue)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 500,
              }}
            >
              📅 View Leave & Apply
            </button>
            <button
              type="button"
              className="btn sm ghost"
              onClick={() => navigate('/me')}
              style={{ background: '#ffffff' }}
            >
              Switch to my page
            </button>
          </div>
        </div>
      )}

      {/* Admin Controls: Dismiss Employee, Stop Salary, Disable Login, Delete Employee */}
      {!view.isSelf && view.access === 'admin' && (
        <AdminLifecycleControls employee={view} onRefresh={() => load(true)} />
      )}

      <div className="grid g3">
        <TodayCard employeeId={view.employeeId} isSelf={view.isSelf} employeeName={view.fullName} />

        <div
          className="card"
          style={{
            height: 360,
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
              flexShrink: 0,
            }}
          >
            <h3 style={{ margin: 0 }}>Personal details</h3>
            {(view.isSelf || view.access === 'admin') && (
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => setShowEditDetails(true)}
                style={{
                  padding: '3px 10px',
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--blue)',
                  borderColor: 'var(--line2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
                title={view.access === 'admin' ? 'Admin: Edit all personal and employment details' : 'Edit personal details'}
              >
                ✎ Edit
              </button>
            )}
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              paddingRight: 6,
              marginRight: -4,
              scrollbarWidth: 'thin',
            }}
          >
            <Row label="Employee code" value={view.employeeCode} />
            <Row label="Email" value={view.workEmail} />
            <Row label="Phone" value={view.mobile} />
            <Row
              label="Role"
              value={
                view.role
                  ? view.role.charAt(0).toUpperCase() + view.role.slice(1)
                  : view.isContractor
                    ? 'Contractor'
                    : 'Employee'
              }
            />
            <Row label="Reporting manager" value={view.managerName} />
            {(view.isSelf || view.access === 'admin') && (
              <>
                <Row
                  label="Date of birth"
                  value={fmtDob(view.dateOfBirth)}
                />
                <Row
                  label="PAN"
                  value={
                    view.panNumber ||
                    view.documents.find((d) => d.key === 'pan')?.docNumber ||
                    null
                  }
                />
                <Row
                  label="Aadhaar"
                  value={
                    view.aadharNumber ||
                    view.documents.find((d) => d.key === 'aadhaar')?.docNumber ||
                    null
                  }
                />
              </>
            )}
            <Row label="Shift" value={`${view.shiftStart}–${view.shiftEnd}`} />
            <Row
              label="Weekly off"
              value={view.weeklyOff.length ? view.weeklyOff.join(' + ') : null}
            />
            <Row label="Date of joining" value={fmtDate(view.dateOfJoining)} />
            <Row label="Work location" value={view.workState} />
            <Row label="Leave balance" value={`${view.leaveBalance} days`} />
          </div>

          <div
            style={{
              marginTop: 'auto',
              paddingTop: 8,
              borderTop: '1px solid var(--line2)',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => navigate(view.isSelf ? '/leave' : `/leave/${view.employeeId}`)}
              style={{ width: '100%', justifyContent: 'center', fontSize: 11.5 }}
            >
              {view.isSelf ? 'View My Leave →' : `View ${view.fullName.split(' ')[0]}’s Leave & Apply →`}
            </button>
          </div>
        </div>

        <CompensationCard
          canSee={view.canSeeCompensation}
          compensation={view.compensation}
          employeeId={view.employeeId}
          employeeName={view.fullName}
          isAdmin={view.access === 'admin'}
          isContractor={view.isContractor}
          onRefresh={() => load(true)}
        />
      </div>

      <div className="grid g23 mt">
        <WeekCard employeeId={view.employeeId} isSelf={view.isSelf} />
        <GoalsCard goals={view.goals} isSelf={view.isSelf} />
      </div>

      <div className="grid g3 mt">
        <ProjectsCard
          projects={view.projects}
          isSelf={view.isSelf}
          canRecord={canRecord}
          employeeId={view.employeeId}
          employeeName={view.fullName}
          onChange={(projects) => setView({ ...view, projects })}
        />
        <FeedbackCard
          feedback={view.feedback}
          isSelf={view.isSelf}
          canRecord={canRecord}
          employeeId={view.employeeId}
          employeeName={view.fullName}
          onChange={(feedback) => setView({ ...view, feedback })}
        />
        <DocumentsCard
          documents={view.documents}
          isSelf={view.isSelf}
          access={view.access}
          employeeId={view.employeeId}
          onRefresh={load}
        />
      </div>

      {showEditDetails && view && (
        <EditPersonalDetailsModal
          employee={view}
          onClose={() => setShowEditDetails(false)}
          onSuccess={() => {
            void load(true)
            setToast({
              text: 'Personal details updated successfully.',
              tone: 'good',
            })
          }}
        />
      )}

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
