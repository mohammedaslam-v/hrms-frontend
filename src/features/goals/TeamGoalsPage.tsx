import { useCallback, useEffect, useState } from 'react'
import { PageHero } from '../../shared/ui/PageHero'
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
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')

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

  if (loading) return <div className="boot">Loading team goals…</div>

  const memberOptions =
    summary?.members.map((m) => ({
      id: m.employeeId,
      fullName: m.fullName,
      employeeCode: m.employeeCode,
      designation: m.designation,
    })) || []

  const filteredMembers = (summary?.members || []).filter((m) => {
    if (!search.trim()) return true
    const q = search.trim().toLowerCase()
    return m.fullName.toLowerCase().includes(q) || m.employeeCode.toLowerCase().includes(q)
  })

  return (
    <div className="page">
      <PageHero navKey="teamgoals" eyebrow="Manager access / Team goals">
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

          {/* Filters and CSV toolbar */}
          <div
            className="card"
            style={{
              padding: '12px 18px',
              marginBottom: 24,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--panel)',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                  Period:
                </span>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: 12.5, borderRadius: 8, border: '1px solid var(--line)' }}
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

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                  Person:
                </span>
                <select
                  value={person}
                  onChange={(e) => setPerson(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: 12.5, borderRadius: 8, border: '1px solid var(--line)' }}
                >
                  <option value="all">All team members</option>
                  {memberOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                  Status:
                </span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: 12.5, borderRadius: 8, border: '1px solid var(--line)' }}
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

              <div style={{ position: 'relative', width: 210 }}>
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
                  placeholder="Search by name..."
                  aria-label="Search employee by name"
                  style={{
                    width: '100%',
                    padding: '6px 26px 6px 28px',
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
                      fontSize: 13,
                      lineHeight: 1,
                      padding: '2px 4px',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div>
              <button
                type="button"
                className="btn ghost sm"
                onClick={downloadCsv}
                style={{ fontSize: 12 }}
              >
                Download CSV
              </button>
            </div>
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
              filteredMembers.map((member) => (
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
