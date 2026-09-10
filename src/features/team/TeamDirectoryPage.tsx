import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHero } from '../../shared/ui/PageHero'
import { Pagination, usePage } from '../../shared/ui/Pagination'
import { WORK_MODE_CLASS } from '../profile'
import { teamApi } from './team.api'
import type { DirectoryMember, DirectoryView } from './team.types'
import { fmtDateShortYear } from '../../shared/lib/date'
import { initials } from '../../shared/lib/format'

/** Department colours from the design. Unset falls back to neutral, not random. */
const DEPT_COLOR: Record<string, string> = {
  Leadership: '#6C5CE7',
  Sales: '#3777FF',
  Marketing: '#E8613A',
  Curriculum: '#F4A93A',
  Tech: '#8B2E2E',
  Operations: '#159A9C',
  People: '#34C77B',
}

/**
 * ₹11.0L, ₹1.25Cr — the way pay is spoken about here. A raw ₹1,100,000 is
 * accurate and nobody reads it at a glance in a table of 450 rows.
 */
const lakh = (n: number): string => {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)}Cr`
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`
  return `₹${n.toLocaleString('en-IN')}`
}

function Row({
  member,
  canSeePay,
  onOpen,
}: {
  member: DirectoryMember
  canSeePay: boolean
  onOpen: (id: number) => void
}) {
  const colour = (member.department && DEPT_COLOR[member.department]) || 'var(--muted2)'
  const hasLeft = Boolean(member.dateOfLeaving)

  return (
    // Reachable by keyboard as well as by mouse: a row that only responds to a
    // click is invisible to anyone tabbing through, and this is the only way to
    // reach a colleague's page.
    <tr
      className="row"
      tabIndex={0}
      role="link"
      aria-label={`Open ${member.fullName}'s page`}
      onClick={() => onOpen(member.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(member.id)
        }
      }}
    >
      <td>
        <div className="stack">
          <span>EMP</span>
          <b>{member.employeeCode}</b>
        </div>
      </td>
      <td>
        <span className="avatar sm" style={{ background: colour }}>
          {initials(member.fullName)}
        </span>
        {member.fullName}
        {hasLeft && (
          <span className="chip c-abs" style={{ marginLeft: 6 }}>
            Exited
          </span>
        )}
      </td>
      <td>{member.designation ?? '—'}</td>
      <td className="hide-md">
        {member.department ? (
          <span className="dept">
            <span className="dot" style={{ background: colour }} />
            {member.department}
          </span>
        ) : (
          '—'
        )}
      </td>
      <td className="hide-sm">{member.managerName ?? '—'}</td>
      <td className="hide-sm">
        <span className={`chip ${WORK_MODE_CLASS[member.workMode]}`}>{member.workMode}</span>
      </td>
      <td className="hide-lg">
        {member.shiftStart}–{member.shiftEnd}
      </td>
      <td className="hide-lg">{member.weeklyOff.length ? member.weeklyOff.join(' + ') : '—'}</td>
      <td className="hide-md">{fmtDateShortYear(member.dateOfJoining)}</td>
      {canSeePay && (
        <td className="num-col">
          {member.ctc == null ? <span style={{ color: 'var(--muted2)' }}>—</span> : lakh(member.ctc)}
        </td>
      )}
    </tr>
  )
}

/**
 * Team directory.
 *
 * The list of people you are responsible for — the company for an admin, your
 * reporting tree for a manager. The pay column is drawn only when the server
 * says so; for a manager the figures were never sent.
 */
type StatusFilter = '' | 'active' | 'exited'

export function TeamDirectoryPage() {
  const navigate = useNavigate()
  const [view, setView] = useState<DirectoryView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [dept, setDept] = useState('')
  const [mode, setMode] = useState('')
  const [status, setStatus] = useState<StatusFilter>('active')

  const load = useCallback(async () => {
    try {
      // People who have left are fetched too, and hidden by the Status filter
      // below. One request, and switching to Exited is instant rather than a
      // round trip — the alternative is a reload every time the filter moves.
      setView(await teamApi.getDirectory(true))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the directory.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [load])

  // Built from the people actually visible, so a filter is never offered that
  // would return nothing.
  const departments = useMemo(
    () => [...new Set((view?.members ?? []).map((m) => m.department).filter(Boolean))].sort(),
    [view],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (view?.members ?? []).filter((m) => {
      const matchesText =
        !q ||
        m.fullName.toLowerCase().includes(q) ||
        (m.designation ?? '').toLowerCase().includes(q) ||
        m.employeeCode.toLowerCase().includes(q)

      const hasLeft = Boolean(m.dateOfLeaving)

      return (
        matchesText &&
        (!dept || m.department === dept) &&
        (!mode || m.workMode === mode) &&
        (!status || (status === 'active' ? !hasLeft : hasLeft))
      )
    })
  }, [view, query, dept, mode, status])

  const page = usePage(filtered)

  // 'active' is the default, so having it set is not "filtered".
  const isFiltered = query.trim() !== '' || dept !== '' || mode !== '' || status !== 'active'

  const clearFilters = () => {
    setQuery('')
    setDept('')
    setMode('')
    setStatus('active')
  }

  if (loading) return <div className="boot">Loading the directory…</div>

  if (!view) {
    return (
      <div className="page">
        <PageHero navKey="team" />
        <div className="notice bad" role="alert">
          {error ?? 'Could not load the directory.'}
        </div>
      </div>
    )
  }

  const { members, canSeePay, scope } = view
  const columns = canSeePay ? 10 : 9

  return (
    <div className="page">
      <PageHero
        navKey="team"
        eyebrow={
          // Compare what is on screen with what exists, rather than asking
          // whether a filter is set: the default Active filter already hides
          // anyone who has left, and a header that says 450 above 449 rows is
          // wrong however defensible the reason.
          filtered.length !== members.length
            ? `${filtered.length} of ${members.length} shown`
            : scope === 'company'
              ? `${members.length} people across the company`
              : `${members.length} in your team`
        }
      />

      <div className="filters">
        <div className="f">
          <label htmlFor="teamSearch">Search</label>
          <input
            id="teamSearch"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, title or code…"
          />
        </div>
        <div className="f">
          <label htmlFor="teamDept">Department</label>
          <select id="teamDept" value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d as string}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="f">
          <label htmlFor="teamMode">Work mode</label>
          <select id="teamMode" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="">All modes</option>
            <option value="WFO">WFO</option>
            <option value="WFH">WFH</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>
        <div className="f">
          <label htmlFor="teamStatus">Status</label>
          <select
            id="teamStatus"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
          >
            <option value="active">Active</option>
            <option value="exited">Exited</option>
            <option value="">All</option>
          </select>
        </div>
        <button className="btn ghost" onClick={clearFilters} disabled={!isFiltered}>
          Clear all
        </button>
      </div>

      <div className="card">
        <div className="scroll">
          <table className="table-narrows">
            <thead>
              <tr>
                <th>Code</th>
                <th>Member</th>
                <th>Title</th>
                <th className="hide-md">Department</th>
                <th className="hide-sm">Manager</th>
                <th className="hide-sm">Mode</th>
                <th className="hide-lg">Shift</th>
                <th className="hide-lg">Weekly off</th>
                <th className="hide-md">Joined</th>
                {canSeePay && <th className="num-col">CTC</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns}>
                    {/* Two different situations, and they need different words:
                        an empty team is not the same as a filter that matched
                        nothing, and telling someone to clear their filters when
                        they have none is worse than saying nothing. */}
                    {members.length === 0 ? (
                      <div className="empty">
                        <b>Nobody reports to you yet</b>
                        Once your reporting line is set up in HRMS, your team appears here.
                      </div>
                    ) : (
                      <div className="empty">
                        <b>No one matches those filters</b>
                        Try clearing the search or the department.
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                page.items.map((member) => (
                  <Row
                    member={member}
                    canSeePay={canSeePay}
                    onOpen={(id) => navigate(`/me/${id}`)}
                    key={member.id}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} unit="people" />
      </div>
    </div>
  )
}
