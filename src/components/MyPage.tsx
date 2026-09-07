import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { profileApi } from '../api/profile'
import { TodayCard } from './TodayCard'
import { WeekCard } from './WeekCard'
import { WORK_MODE_CLASS, type PendingBlock, type ProfileView } from '../types/profile'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const fmtDate = (iso: string): string => {
  const [y, m, d] = iso.split('-')
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`
}

/** Initials for the avatar — two letters at most, as in the design. */
const initials = (name: string): string =>
  name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

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

/**
 * A card the design draws that has nothing behind it yet. The reason comes from
 * the server, so it stays accurate as each phase lands instead of going stale
 * here.
 */
function Waiting({ reason }: { reason: string }) {
  return (
    <div className="empty">
      <b>Nothing here yet</b>
      {reason}
    </div>
  )
}

export function MyPage() {
  // The same screen serves your own profile and a team member's.
  const { id } = useParams<{ id: string }>()
  const [view, setView] = useState<ProfileView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const next = id ? await profileApi.getOne(Number(id)) : await profileApi.getMine()
      setView(next)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this profile.')
      setView(null)
    } finally {
      setLoading(false)
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

  const reasonFor = (block: string): string =>
    view.pending.find((p: PendingBlock) => p.block === block)?.reason ?? 'Not available yet.'

  const color = (view.department && DEPT_COLOR[view.department]) || 'var(--muted2)'
  const reportsTo = view.managerName ? `reports to ${view.managerName}` : 'reports to the board'

  return (
    <div className="page">
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
        <span style={{ marginLeft: 'auto' }}>
          <span className={`chip ${WORK_MODE_CLASS[view.workMode]}`}>{view.workMode}</span>
          {view.dateOfLeaving && (
            <span className="chip c-abs" style={{ marginLeft: 6 }}>
              Exited {fmtDate(view.dateOfLeaving)}
            </span>
          )}
        </span>
      </div>

      {/* A manager is looking at someone else's record — say so, so nobody
          mistakes a report's page for their own. */}
      {!view.isSelf && (
        <div className="notice blue" style={{ marginBottom: 14 }}>
          You are viewing <b>{view.fullName}</b>’s page
          {view.access === 'manager' && ' as their manager'}. Pay and personal documents are not
          shown.
        </div>
      )}

      <div className="grid g3">
        <TodayCard isSelf={view.isSelf} />

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
        </div>

        <div className="card">
          <h3>Compensation</h3>
          <Waiting reason={reasonFor('compensation')} />
        </div>
      </div>

      <div className="grid g23 mt">
        <WeekCard isSelf={view.isSelf} reason={reasonFor('week')} />
        <div className="card">
          <h3>Goals</h3>
          <Waiting reason={reasonFor('goals')} />
        </div>
      </div>

      <div className="grid g3 mt">
        <div className="card">
          <h3>Projects &amp; achievements</h3>
          <Waiting reason={reasonFor('projects')} />
        </div>
        <div className="card">
          <h3>Feedback from manager</h3>
          <Waiting reason={reasonFor('feedback')} />
        </div>
        <div className="card">
          <h3>Documents</h3>
          {view.documents.length === 0 ? (
            <div className="empty">
              <b>No documents on file</b>
              {view.isSelf || view.access === 'admin'
                ? 'Onboarding paperwork uploaded through the admin portal appears here.'
                : 'Documents are visible to the employee and HR only.'}
            </div>
          ) : (
            view.documents.map((doc) => (
              <div className="doc" key={doc.key}>
                <span style={{ flex: 1 }}>📄 {doc.label}</span>
                <span className="tag">On file</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
