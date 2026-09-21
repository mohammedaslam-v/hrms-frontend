import { useState } from 'react'
import { GOAL_CHIP, GOAL_TONE, type GoalView } from './goals.types'

interface GoalItemProps {
  goal: GoalView
  canManage?: boolean
  onUpdateMetric?: (goalId: number, value: number) => Promise<void>
  onToggleMilestone?: (goalId: number, milestoneId: number, isDone: boolean) => Promise<void>
  onDelete?: (goalId: number) => Promise<void>
}

const fmtValue = (value: number | null, unit: string | null): string => {
  if (value === null) return '—'
  if (unit === '₹') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value)
  }
  const n = value % 1 ? value.toFixed(1) : value.toLocaleString('en-IN')
  return unit === '%' || unit === '×' ? `${n}${unit}` : unit ? `${n} ${unit}` : n
}

const fmtDate = (dateStr: string): string => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  } catch {
    return dateStr
  }
}

export function GoalItem({
  goal,
  canManage = false,
  onUpdateMetric,
  onToggleMilestone,
  onDelete,
}: GoalItemProps) {
  const [metricInput, setMetricInput] = useState<string>(
    goal.currentValue !== null ? String(goal.currentValue) : '0',
  )
  const [isUpdating, setIsUpdating] = useState(false)
  const [isToggling, setIsToggling] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tone = GOAL_TONE[goal.status]
  const chipClass = GOAL_CHIP[goal.status]

  const handleUpdate = async () => {
    if (!onUpdateMetric) return
    const val = Number(metricInput)
    if (isNaN(val) || val < 0) {
      setError('Please enter a valid non-negative number')
      return
    }
    setError(null)
    setIsUpdating(true)
    try {
      await onUpdateMetric(goal.id, val)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleToggle = async (milestoneId: number, currentDone: boolean) => {
    if (!onToggleMilestone) return
    setIsToggling(milestoneId)
    try {
      await onToggleMilestone(goal.id, milestoneId, !currentDone)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle milestone')
    } finally {
      setIsToggling(null)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    if (!window.confirm(`Are you sure you want to delete goal "${goal.title}"?`)) {
      return
    }
    setIsDeleting(true)
    try {
      await onDelete(goal.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete goal')
      setIsDeleting(false)
    }
  }

  return (
    <div
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'all 0.15s ease',
      }}
    >
      {/* Top row: Title and Progress % */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
            {goal.title}
          </h4>

          {/* Badges and metadata */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <span
              style={{
                background: '#f1ede7',
                color: 'var(--ink2)',
                padding: '3px 9px',
                borderRadius: 99,
                fontSize: 11.5,
                fontWeight: 600,
              }}
            >
              {goal.periodLabel}
            </span>

            <span
              className={`chip ${chipClass}`}
              style={{ padding: '3px 9px', borderRadius: 99, fontSize: 11.5, fontWeight: 700 }}
            >
              {goal.status}
            </span>

            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {goal.goalType === 'milestone'
                ? `${goal.milestonesDone} of ${goal.milestonesTotal} milestones complete`
                : `${fmtValue(goal.currentValue, goal.unit)} of ${fmtValue(goal.targetValue, goal.unit)} target`}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ font: "800 24px 'Plus Jakarta Sans', sans-serif", color: tone, letterSpacing: '-0.03em' }}>
            {goal.progress}%
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bar" style={{ height: 7, borderRadius: 99, background: '#eee8e0', overflow: 'hidden' }}>
        <i
          style={{
            display: 'block',
            height: '100%',
            width: `${Math.min(100, Math.max(0, goal.progress))}%`,
            background: tone,
            transition: 'width 0.3s ease',
            borderRadius: 99,
          }}
        />
      </div>

      {/* Checklist section */}
      {goal.goalType === 'milestone' && goal.milestones && goal.milestones.length > 0 && (
        <div
          style={{
            marginTop: 4,
            background: '#faf8f5',
            border: '1px solid #efeae1',
            borderRadius: 10,
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {goal.milestones.map((m) => (
            <label
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 13,
                cursor: onToggleMilestone ? 'pointer' : 'default',
                opacity: isToggling === m.id ? 0.5 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={m.isDone}
                disabled={!onToggleMilestone || isToggling === m.id}
                onChange={() => handleToggle(m.id, m.isDone)}
                style={{
                  width: 16,
                  height: 16,
                  cursor: 'pointer',
                  accentColor: 'var(--green)',
                }}
              />
              <span
                style={{
                  color: m.isDone ? 'var(--muted)' : 'var(--ink)',
                  textDecoration: m.isDone ? 'line-through' : 'none',
                }}
              >
                {m.title}
              </span>
            </label>
          ))}
        </div>
      )}

      {/* Metric update inline section */}
      {goal.goalType === 'metric' && onUpdateMetric && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: '#faf8f5',
            border: '1px solid #efeae1',
            borderRadius: 10,
            padding: '8px 12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
              Update progress:
            </span>
            <input
              type="number"
              step="any"
              value={metricInput}
              onChange={(e) => setMetricInput(e.target.value)}
              disabled={isUpdating}
              style={{
                width: 90,
                padding: '4px 8px',
                fontSize: 12.5,
                borderRadius: 6,
                border: '1px solid var(--line)',
                background: 'white',
              }}
            />
            {goal.unit && (
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                {goal.unit}
              </span>
            )}
          </div>

          <button
            type="button"
            className="btn ghost sm"
            onClick={handleUpdate}
            disabled={isUpdating || metricInput === String(goal.currentValue)}
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {isUpdating ? 'Saving…' : 'Update'}
          </button>
        </div>
      )}

      {/* Note / Guidance if present */}
      {goal.note && (
        <div style={{ fontSize: 12, color: 'var(--ink2)', fontStyle: 'italic', paddingLeft: 2 }}>
          💡 {goal.note}
        </div>
      )}

      {error && (
        <div className="notice bad" style={{ padding: '6px 10px', fontSize: 11.5 }}>
          {error}
        </div>
      )}

      {/* Footer: Attribution & Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 4,
          borderTop: '1px dashed #efeae1',
          fontSize: 11.5,
          color: 'var(--muted)',
        }}
      >
        <div>
          Set by <b>{goal.setterName || 'Board'}</b>
          {goal.setOn ? ` on ${fmtDate(goal.setOn)}` : ''}
        </div>

        {canManage && onDelete && (
          <button
            type="button"
            className="btn ghost sm"
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              padding: '4px 8px',
              fontSize: 11,
              color: 'var(--red)',
              border: 'none',
              background: 'transparent',
            }}
          >
            {isDeleting ? 'Deleting…' : 'Delete goal'}
          </button>
        )}
      </div>
    </div>
  )
}
