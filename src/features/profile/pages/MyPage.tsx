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
import { WORK_MODE_CLASS, type ProfileView } from '../profile.types'
import { fmtDate } from '../../../shared/lib/date'
import { initials } from '../../../shared/lib/format'

/**
 * Department colours from the design. A person with no department falls back to
 * a neutral rather than picking an arbitrary one — and today that is almost
 * everyone, since only one record has a department set.
 */
const DEPT_COLOR: Record<string, string> = {
  Leadership: '#6C5CE7',
  Sales: '#3777FF',
  Marketing: '#E8613A',
  Curriculum: '#F4A93A',
  Tech: '#8B2E2E',
  Operations: '#159A9C',
  People: '#34C77B',
}

/** One label/value row. A missing value says so rather than showing a blank. */
function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="kv">
      <b>{label}</b>
      <span style={value ? undefined : { color: 'var(--muted2)' }}>{value ?? 'Not on file'}</span>
    </div>
  )
}

export function MyPage() {
  // The same screen serves your own profile and a team member's.
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [view, setView] = useState<ProfileView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
          <span className={`chip ${WORK_MODE_CLASS[view.workMode]}`}>{view.workMode}</span>
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

        <div className="card">
          <h3>Personal details</h3>
          <Row label="Employee code" value={view.employeeCode} />
          <Row label="Email" value={view.workEmail} />
          <Row label="Phone" value={view.mobile} />
          <Row label="Shift" value={`${view.shiftStart}–${view.shiftEnd}`} />
          <Row
            label="Weekly off"
            value={view.weeklyOff.length ? view.weeklyOff.join(' + ') : null}
          />
          <Row label="Date of joining" value={fmtDate(view.dateOfJoining)} />
          <Row label="Work location" value={view.workState} />
          <Row label="Leave balance" value={`${view.leaveBalance} days`} />
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--line2)' }}>
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

        <CompensationCard canSee={view.canSeeCompensation} compensation={view.compensation} />
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
    </div>
  )
}
