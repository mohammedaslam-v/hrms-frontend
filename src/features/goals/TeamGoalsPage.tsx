import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHero } from '../../shared/ui/PageHero'
import { usePage } from '../../shared/ui/Pagination'
import { SearchableDropdown, type SearchableDropdownOption } from '../../shared/ui/SearchableDropdown'
import { goalsApi } from './goals.api'
import { GoalItem } from './GoalItem'
import { SetGoalModal } from './SetGoalModal'
import type { GoalView, TeamGoalsFilter, TeamGoalsSummaryView } from './goals.types'

export function TeamGoalsPage() {
  const [summary, setSummary] = useState<TeamGoalsSummaryView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Filters
  const [period, setPeriod] = useState('all')
  const [person, setPerson] = useState('all')
  const [manager, setManager] = useState('all')
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')

  // Pagination & card expansion
  const [pageSize, setPageSize] = useState(10)
  const [expandedGoalIds, setExpandedGoalIds] = useState<Record<number, boolean>>({})

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<number | undefined>(undefined)
  const [editingGoal, setEditingGoal] = useState<GoalView | null>(null)

  const loadTeamGoals = useCallback(async () => {
    try {
      const filters: TeamGoalsFilter = {
        period: period !== 'all' ? period : undefined,
        status: status !== 'all' ? status : undefined,
        employeeId: person !== 'all' ? Number(person) : undefined,
      }
      const data = await goalsApi.getTeamGoals(filters)
      setSummary(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load team goals.')
    } finally {
      setLoading(false)
    }
  }, [period, person, status])

  useEffect(() => {
    void loadTeamGoals()
  }, [loadTeamGoals])

  const handleUpdateMetric = async (goalId: number, value: number) => {
    try {
      await goalsApi.updateMetric(goalId, value)
      await loadTeamGoals()
      setToast('Goal progress updated!')
      setTimeout(() => setToast(null), 3000)
    } catch (err) {
      throw err instanceof Error ? err : new Error('Could not update goal progress.')
    }
  }

  const handleToggleMilestone = async (
    goalId: number,
    milestoneId: number,
    isDone: boolean,
  ) => {
    try {
      await goalsApi.toggleMilestone(goalId, milestoneId, isDone)
      await loadTeamGoals()
      setToast('Milestone status updated!')
      setTimeout(() => setToast(null), 3000)
    } catch (err) {
      throw err instanceof Error ? err : new Error('Could not update milestone.')
    }
  }

  const handleDeleteGoal = async (goalId: number) => {
    try {
      await goalsApi.delete(goalId)
      await loadTeamGoals()
      setToast('Goal deleted.')
      setTimeout(() => setToast(null), 3000)
    } catch (err) {
      throw err instanceof Error ? err : new Error('Could not delete goal.')
    }
  }

  const handleApproveGoal = async (goalId: number) => {
    try {
      await goalsApi.approve(goalId)
      await loadTeamGoals()
      setToast('Goal approved successfully!')
      setTimeout(() => setToast(null), 3000)
    } catch (err) {
      throw err instanceof Error ? err : new Error('Could not approve goal.')
    }
  }

  const handleRejectGoal = async (goalId: number, reason?: string) => {
    try {
      await goalsApi.reject(goalId, reason)
      await loadTeamGoals()
      setToast('Goal rejected.')
      setTimeout(() => setToast(null), 3000)
    } catch (err) {
      throw err instanceof Error ? err : new Error('Could not reject goal.')
    }
  }

  const openSetGoal = (memberId?: number) => {
    setEditingGoal(null)
    setSelectedMemberId(memberId)
    setModalOpen(true)
  }

  const openEditGoal = (goal: GoalView) => {
    setEditingGoal(goal)
    setSelectedMemberId(goal.employeeId)
    setModalOpen(true)
  }

  const downloadCsv = () => {
    if (!summary || filteredMembers.length === 0) return
    const headers = [
      'Employee Code',
      'Employee Name',
      'Department',
      'Designation',
      'Goal Title',
      'Goal Type',
      'Period',
      'Progress %',
      'Status',
      'Current',
      'Target',
      'Unit',
      'Set On',
      'Set By',
    ]

    const rows: string[][] = []
    for (const member of filteredMembers) {
      for (const g of member.goals) {
        rows.push([
          member.employeeCode,
          `"${member.fullName.replace(/"/g, '""')}"`,
          `"${(member.department || '').replace(/"/g, '""')}"`,
          `"${(member.designation || '').replace(/"/g, '""')}"`,
          `"${g.title.replace(/"/g, '""')}"`,
          g.goalType,
          g.period,
          String(g.progress),
          g.status,
          String(g.currentValue ?? ''),
          String(g.targetValue ?? ''),
          `"${(g.unit || '').replace(/"/g, '""')}"`,
          g.setOn || '',
          `"${(g.setterName || '').replace(/"/g, '""')}"`,
        ])
      }
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `team_goals_${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Unique reporting managers from the team roster
  const managerOptions = useMemo(() => {
    const map = new Map<string, { key: string; id?: number; name: string }>()
    for (const m of summary?.members || []) {
      if (m.managerName && m.managerName.trim()) {
        const name = m.managerName.trim()
        const key = m.managerId ? String(m.managerId) : name.toLowerCase()
        if (!map.has(key)) {
          map.set(key, { key, id: m.managerId ?? undefined, name })
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [summary?.members])

  // Set of employee IDs belonging to the selected reporting manager's team
  const managerTeamEmployeeIds = useMemo(() => {
    if (manager === 'all' || !summary?.members) return null

    const allMembers = summary.members
    const selectedOpt = managerOptions.find((opt) => opt.key === manager)
    const mgrId = selectedOpt?.id
    const mgrName = (selectedOpt?.name || manager).toLowerCase()

    // Find the manager's own employee record if they are on the team
    const managerMember = allMembers.find(
      (m) => (mgrId !== undefined && m.employeeId === mgrId) || m.fullName.toLowerCase() === mgrName,
    )

    const teamIds = new Set<number>()
    if (managerMember) {
      teamIds.add(managerMember.employeeId)
    } else if (mgrId !== undefined) {
      teamIds.add(mgrId)
    }

    // Direct reports and recursive reporting tree
    let added = true
    while (added) {
      added = false
      for (const m of allMembers) {
        if (teamIds.has(m.employeeId)) continue

        const reportsDirectly =
          (mgrId !== undefined && m.managerId === mgrId) ||
          (m.managerName && m.managerName.toLowerCase() === mgrName)

        const reportsIndirectly =
          m.managerId !== null && m.managerId !== undefined && teamIds.has(m.managerId)

        if (reportsDirectly || reportsIndirectly) {
          teamIds.add(m.employeeId)
          added = true
        }
      }
    }

    return teamIds
  }, [manager, summary?.members, managerOptions])

  const memberOptions = useMemo(() => {
    const list = summary?.members || []
    const scoped =
      managerTeamEmployeeIds !== null
        ? list.filter((m) => managerTeamEmployeeIds.has(m.employeeId))
        : list
    return scoped.map((m) => ({
      id: m.employeeId,
      fullName: m.fullName,
      employeeCode: m.employeeCode,
      designation: m.designation,
    }))
  }, [summary?.members, managerTeamEmployeeIds])

  const personDropdownOptions = useMemo<SearchableDropdownOption[]>(() => {
    const opts: SearchableDropdownOption[] = [
      { value: 'all', label: 'All team members' },
    ]
    for (const m of memberOptions) {
      opts.push({
        value: String(m.id),
        label: m.fullName,
        subLabel: `${m.employeeCode}${m.designation ? ` · ${m.designation}` : ''}`,
      })
    }
    return opts
  }, [memberOptions])

  const managerDropdownOptions = useMemo<SearchableDropdownOption[]>(() => {
    const opts: SearchableDropdownOption[] = [
      { value: 'all', label: 'All managers' },
    ]
    for (const mgr of managerOptions) {
      opts.push({
        value: mgr.key,
        label: mgr.name,
        subLabel: mgr.id ? `Manager #${mgr.id}` : undefined,
      })
    }
    return opts
  }, [managerOptions])

  const filteredMembers = (summary?.members || []).filter((m) => {
    // Reporting Manager filter
    if (managerTeamEmployeeIds !== null && !managerTeamEmployeeIds.has(m.employeeId)) {
      return false
    }

    // Live search query (by employee name, code, or reporting manager name)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      const matchesName = m.fullName.toLowerCase().includes(q)
      const matchesCode = m.employeeCode.toLowerCase().includes(q)
      const matchesMgr = (m.managerName || '').toLowerCase().includes(q)
      if (!matchesName && !matchesCode && !matchesMgr) return false
    }

    return true
  })

  const page = usePage(filteredMembers, pageSize)

  // Reset to first page whenever search query or filters change
  useEffect(() => {
    page.setPage(1)
  }, [search, period, person, manager, status, pageSize])

  const handleToggleGoal = (goalId: number) => {
    setExpandedGoalIds((prev) => ({
      ...prev,
      [goalId]: !prev[goalId],
    }))
  }

  // Goal IDs currently visible on the page
  const currentPageGoalIds = page.items.flatMap((m) => m.goals.map((g) => g.id))
  const allExpanded =
    currentPageGoalIds.length > 0 &&
    currentPageGoalIds.every((id) => expandedGoalIds[id] === true)

  const toggleExpandAll = () => {
    const nextState = !allExpanded
    const next: Record<number, boolean> = { ...expandedGoalIds }
    for (const id of currentPageGoalIds) {
      next[id] = nextState
    }
    setExpandedGoalIds(next)
  }

  if (loading) return <div className="boot">Loading team goals…</div>

  return (
    <div className="page">
      <PageHero navKey="teamgoals" eyebrow="Manager access / Team goals">
        <button
          type="button"
          className="btn ghost sm"
          onClick={downloadCsv}
          disabled={!summary || filteredMembers.length === 0}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Download CSV</span>
        </button>
        <button
          className="btn primary sm"
          type="button"
          onClick={() => openSetGoal()}
        >
          + Set a goal
        </button>
      </PageHero>

      {error && (
        <div className="notice bad" style={{ marginBottom: 16 }} role="alert">
          {error}
        </div>
      )}

      {toast && (
        <div className="notice blue" style={{ marginBottom: 16 }} role="status">
          {toast}
        </div>
      )}

      {summary && (
        <>
          {/* 4 Team Stat Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 14,
              marginBottom: 20,
            }}
          >
            <div
              className="card"
              style={{ padding: '16px 18px', background: 'var(--panel)' }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--muted)',
                }}
              >
                Goals set for your team
              </div>
              <div
                style={{
                  font: "800 28px 'Plus Jakarta Sans', sans-serif",
                  marginTop: 6,
                  color: 'var(--ink)',
                }}
              >
                {summary.totalGoals}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--muted2)', marginTop: 4 }}>
                Across {summary.members.length} team members
              </div>
            </div>

            <div
              className="card"
              style={{ padding: '16px 18px', background: 'var(--panel)' }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--muted)',
                }}
              >
                On track
              </div>
              <div
                style={{
                  font: "800 28px 'Plus Jakarta Sans', sans-serif",
                  marginTop: 6,
                  color: 'var(--blue)',
                }}
              >
                {summary.onTrack}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--muted2)', marginTop: 4 }}>
                Moving at expected pace
              </div>
            </div>

            <div
              className="card"
              style={{ padding: '16px 18px', background: 'var(--panel)' }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--muted)',
                }}
              >
                At risk
              </div>
              <div
                style={{
                  font: "800 28px 'Plus Jakarta Sans', sans-serif",
                  marginTop: 6,
                  color: summary.atRisk > 0 ? 'var(--amber)' : 'var(--ink)',
                }}
              >
                {summary.atRisk}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--muted2)', marginTop: 4 }}>
                Behind elapsed time
              </div>
            </div>

            <div
              className="card"
              style={{ padding: '16px 18px', background: 'var(--panel)' }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--muted)',
                }}
              >
                Achieved so far
              </div>
              <div
                style={{
                  font: "800 28px 'Plus Jakarta Sans', sans-serif",
                  marginTop: 6,
                  color: summary.achievedSoFar > 0 ? 'var(--green)' : 'var(--ink)',
                }}
              >
                {summary.achievedSoFar}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--muted2)', marginTop: 4 }}>
                Target reached
              </div>
            </div>
          </div>

          {/* Filters toolbar (full width) */}
          <div
            className="card"
            style={{
              padding: '12px 18px',
              marginBottom: 20,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              alignItems: 'center',
              width: '100%',
              boxSizing: 'border-box',
              background: 'var(--panel)',
            }}
          >
            {/* Period */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 130px', minWidth: 120 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', flexShrink: 0 }}>
                Period:
              </span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                style={{
                  width: '100%',
                  height: 32,
                  padding: '5px 8px',
                  fontSize: 12.5,
                  borderRadius: 8,
                  border: '1px solid var(--line)',
                  backgroundColor: '#fff',
                  color: 'var(--ink)',
                  boxSizing: 'border-box',
                }}
              >
                <option value="all">All periods</option>
                <option value="Q1">Q1 (Jan–Mar)</option>
                <option value="Q2">Q2 (Apr–Jun)</option>
                <option value="Q3">Q3 (Jul–Sep)</option>
                <option value="Q4">Q4 (Oct–Dec)</option>
                <option value="H1">H1 (Jan–Jun)</option>
                <option value="H2">H2 (Jul–Dec)</option>
                <option value="FY">Full year</option>
              </select>
            </div>

            {/* Person (Searchable Dropdown) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1.8 1 200px', minWidth: 160 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', flexShrink: 0 }}>
                Person:
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <SearchableDropdown
                  value={person}
                  onChange={(val) => setPerson(val)}
                  options={personDropdownOptions}
                  placeholder="All team members"
                  searchPlaceholder="Search by name or code..."
                />
              </div>
            </div>

            {/* Manager (Searchable Dropdown) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1.6 1 180px', minWidth: 150 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', flexShrink: 0 }}>
                Manager:
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <SearchableDropdown
                  value={manager}
                  onChange={(val) => {
                    setManager(val)
                    setPerson('all')
                  }}
                  options={managerDropdownOptions}
                  placeholder="All managers"
                  searchPlaceholder="Search reporting manager..."
                />
              </div>
            </div>

            {/* Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1.2 1 140px', minWidth: 125 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', flexShrink: 0 }}>
                Status:
              </span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  height: 32,
                  padding: '5px 8px',
                  fontSize: 12.5,
                  borderRadius: 8,
                  border: '1px solid var(--line)',
                  backgroundColor: '#fff',
                  color: 'var(--ink)',
                  boxSizing: 'border-box',
                }}
              >
                <option value="all">All statuses</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="On track">On track</option>
                <option value="At risk">At risk</option>
                <option value="Achieved">Achieved</option>
                <option value="Missed">Missed</option>
                <option value="Not started">Not started</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Live Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '2 1 210px', minWidth: 170 }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--muted, #94a3b8)',
                    pointerEvents: 'none',
                  }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, BAM code..."
                  aria-label="Search employee by name"
                  style={{
                    width: '100%',
                    padding: '5px 26px 5px 30px',
                    fontSize: 12.5,
                    borderRadius: 8,
                    border: '1px solid var(--line)',
                    backgroundColor: '#fff',
                    outline: 'none',
                    color: 'var(--ink)',
                    boxSizing: 'border-box',
                    height: 32,
                  }}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="Clear search"
                    title="Clear search"
                    style={{
                      position: 'absolute',
                      right: 6,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--muted, #94a3b8)',
                      cursor: 'pointer',
                      fontSize: 12,
                      lineHeight: 1,
                      padding: '2px 4px',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Reset Filters (when active) */}
            {(period !== 'all' || person !== 'all' || manager !== 'all' || status !== 'all' || Boolean(search.trim())) && (
              <div style={{ flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={() => {
                    setPeriod('all')
                    setPerson('all')
                    setManager('all')
                    setStatus('all')
                    setSearch('')
                  }}
                  title="Reset all filters"
                  style={{
                    fontSize: 11.5,
                    height: 32,
                    padding: '5px 10px',
                    color: 'var(--rose, #e11d48)',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  <span>Reset</span>
                </button>
              </div>
            )}

            {/* Expand / Collapse All */}
            {currentPageGoalIds.length > 0 && (
              <div style={{ flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={toggleExpandAll}
                  title={allExpanded ? 'Collapse all visible goals' : 'Expand all visible goals'}
                  style={{
                    fontSize: 11.5,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 10px',
                    height: 32,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transform: allExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  <span>{allExpanded ? 'Collapse all' : 'Expand all'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Member Groups */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {filteredMembers.length === 0 ? (
              <div className="card empty" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <b style={{ fontSize: 16 }}>
                  {search.trim()
                    ? `No team members found matching "${search.trim()}"`
                    : 'No team members or goals found'}
                </b>
                <p style={{ color: 'var(--muted)', marginTop: 6, fontSize: 13 }}>
                  {search.trim()
                    ? 'Try checking the name or clearing the search field.'
                    : 'Try changing your filter settings or set a new goal for your team.'}
                </p>
              </div>
            ) : (
              page.items.map((member) => (
                <div
                  key={member.employeeId}
                  className="card"
                  style={{
                    padding: '20px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  {/* Member Header */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      paddingBottom: 14,
                      borderBottom: '1px solid var(--line)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: '#e9e4dc',
                          color: 'var(--ink)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {member.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>
                          {member.fullName}{' '}
                          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
                            · {member.employeeCode}
                          </span>
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                          {member.designation || 'Team Member'}
                          {member.department ? ` · ${member.department}` : ''}
                          {member.managerName ? ` · Reports to: ${member.managerName}` : ''}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span
                        style={{
                          background: '#f1ede7',
                          color: 'var(--ink2)',
                          padding: '4px 10px',
                          borderRadius: 99,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {member.goalsCount} goal{member.goalsCount === 1 ? '' : 's'} ·{' '}
                        {member.averageProgress}% avg
                      </span>
                      <button
                        type="button"
                        className="btn ghost sm"
                        onClick={() => openSetGoal(member.employeeId)}
                      >
                        + Add goal
                      </button>
                    </div>
                  </div>

                  {/* Member's Goals */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {member.goals.length === 0 ? (
                      <div
                        style={{
                          fontSize: 13,
                          color: 'var(--muted)',
                          padding: '12px 14px',
                          background: '#faf8f5',
                          borderRadius: 8,
                        }}
                      >
                        No goals found matching current filters.{' '}
                        <button
                          type="button"
                          onClick={() => openSetGoal(member.employeeId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--brand)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          Set a goal
                        </button>
                      </div>
                    ) : (
                      member.goals.map((g) => (
                        <GoalItem
                          key={g.id}
                          goal={g}
                          canManage={true}
                          isExpanded={expandedGoalIds[g.id] ?? false}
                          onToggleExpand={() => handleToggleGoal(g.id)}
                          onUpdateMetric={handleUpdateMetric}
                          onToggleMilestone={handleToggleMilestone}
                          onDelete={handleDeleteGoal}
                          onEdit={openEditGoal}
                          onApprove={handleApproveGoal}
                          onReject={handleRejectGoal}
                        />
                      ))
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Pagination Controls */}
            {filteredMembers.length > 0 && (
              <div
                className="card"
                style={{
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                  background: '#fff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: 'var(--muted)' }}>
                  <span>
                    Showing <b style={{ color: 'var(--ink)' }}>{page.from}–{page.to}</b> of <b style={{ color: 'var(--ink)' }}>{page.total}</b> team members
                  </span>
                  <span style={{ color: 'var(--line2)' }}>•</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Show</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value))
                      }}
                      aria-label="Members per page"
                      style={{
                        padding: '3px 8px',
                        fontSize: 12,
                        borderRadius: 6,
                        border: '1px solid var(--line)',
                        background: '#fff',
                        color: 'var(--ink)',
                        cursor: 'pointer',
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span>per page</span>
                  </div>
                </div>

                {page.pageCount > 1 && (
                  <div className="pager-nav" style={{ margin: 0 }}>
                    <button
                      type="button"
                      className="btn ghost sm"
                      onClick={() => page.setPage(page.page - 1)}
                      disabled={page.page === 1}
                    >
                      ‹ Previous
                    </button>
                    <span className="hint" style={{ fontSize: 12.5, color: 'var(--muted)', minWidth: 80, textAlign: 'center' }}>
                      Page <b>{page.page}</b> of <b>{page.pageCount}</b>
                    </span>
                    <button
                      type="button"
                      className="btn ghost sm"
                      onClick={() => page.setPage(page.page + 1)}
                      disabled={page.page === page.pageCount}
                    >
                      Next ›
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {modalOpen && (
        <SetGoalModal
          members={memberOptions}
          initialEmployeeId={selectedMemberId}
          editGoal={editingGoal}
          onSaved={() => {
            setToast(editingGoal ? 'Goal updated successfully!' : 'Goal successfully created!')
            setTimeout(() => setToast(null), 3000)
            void loadTeamGoals()
          }}
          onClose={() => {
            setModalOpen(false)
            setEditingGoal(null)
          }}
        />
      )}
    </div>
  )
}
