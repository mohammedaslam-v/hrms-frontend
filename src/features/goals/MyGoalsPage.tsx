import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHero } from '../../shared/ui/PageHero'
import { goalsApi } from './goals.api'
import { GoalItem } from './GoalItem'
import { SetGoalModal } from './SetGoalModal'
import type { GoalView, MyGoalsSummaryView } from './goals.types'

export function MyGoalsPage() {
  const [summary, setSummary] = useState<MyGoalsSummaryView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<GoalView | null>(null)

  const loadGoals = useCallback(async () => {
    try {
      const data = await goalsApi.getMyGoals()
      setSummary(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your goals.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadGoals()
  }, [loadGoals])

  const handleUpdateMetric = async (goalId: number, value: number) => {
    try {
      await goalsApi.updateMetric(goalId, value)
      await loadGoals()
      setToast('Goal progress updated successfully!')
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
      await loadGoals()
      setToast('Milestone status updated!')
      setTimeout(() => setToast(null), 3000)
    } catch (err) {
      throw err instanceof Error ? err : new Error('Could not update milestone.')
    }
  }

  if (loading) return <div className="boot">Loading your goals…</div>

  const pendingCount = summary?.goals.filter((g) => g.approvalStatus === 'pending').length || 0

  return (
    <div className="page">
      <PageHero navKey="mygoals" eyebrow="Individual / My goals">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            className="btn primary sm"
            onClick={() => {
              setEditingGoal(null)
              setModalOpen(true)
            }}
          >
            + Set a goal
          </button>
          <Link to="/me" className="btn ghost sm">
            View on my page
          </Link>
        </div>
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
          {/* 4 Stat Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 14,
              marginBottom: 24,
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
                Goals this year
              </div>
              <div
                style={{
                  font: "800 28px 'Plus Jakarta Sans', sans-serif",
                  marginTop: 6,
                  color: 'var(--ink)',
                }}
              >
                {summary.goalsThisYear}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--muted2)', marginTop: 4 }}>
                Current financial year
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
                Average progress
              </div>
              <div
                style={{
                  font: "800 28px 'Plus Jakarta Sans', sans-serif",
                  marginTop: 6,
                  color: 'var(--blue)',
                }}
              >
                {summary.averageProgress}%
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--muted2)', marginTop: 4 }}>
                Across {summary.goalsThisYear} active goals
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
                Needing attention
              </div>
              <div
                style={{
                  font: "800 28px 'Plus Jakarta Sans', sans-serif",
                  marginTop: 6,
                  color: summary.needingAttention > 0 ? 'var(--amber)' : 'var(--ink)',
                }}
              >
                {summary.needingAttention}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--muted2)', marginTop: 4 }}>
                At risk or missed
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
                Achieved
              </div>
              <div
                style={{
                  font: "800 28px 'Plus Jakarta Sans', sans-serif",
                  marginTop: 6,
                  color: summary.achieved > 0 ? 'var(--green)' : 'var(--ink)',
                }}
              >
                {summary.achieved}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--muted2)', marginTop: 4 }}>
                Target reached
              </div>
            </div>
          </div>

          {/* Pending approval notification banner */}
          {pendingCount > 0 && (
            <div
              className="notice blue"
              style={{
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>
                ⏳ You have <b>{pendingCount}</b> goal{pendingCount === 1 ? '' : 's'} waiting for manager approval.
              </span>
            </div>
          )}

          {/* Goals List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {summary.goals.length === 0 ? (
              <div className="card empty" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <b style={{ fontSize: 16 }}>No goals set for this year</b>
                <p style={{ color: 'var(--muted)', marginTop: 6, fontSize: 13, marginBottom: 14 }}>
                  Set your own goals to track your impact, or your manager can assign them.
                </p>
                <button
                  type="button"
                  className="btn primary sm"
                  onClick={() => {
                    setEditingGoal(null)
                    setModalOpen(true)
                  }}
                >
                  + Set a goal
                </button>
              </div>
            ) : (
              summary.goals.map((goal) => (
                <GoalItem
                  key={goal.id}
                  goal={goal}
                  onUpdateMetric={handleUpdateMetric}
                  onToggleMilestone={handleToggleMilestone}
                  onEdit={(g) => {
                    setEditingGoal(g)
                    setModalOpen(true)
                  }}
                />
              ))
            )}
          </div>
        </>
      )}

      {modalOpen && (
        <SetGoalModal
          isSelf={true}
          editGoal={editingGoal}
          onSaved={() => {
            setToast(
              editingGoal
                ? 'Goal updated successfully!'
                : 'Goal submitted for manager approval!',
            )
            setTimeout(() => setToast(null), 3000)
            void loadGoals()
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

