import { useState } from 'react'
import { GOAL_CHIP, GOAL_TONE, type GoalView } from './goals.types'

interface GoalItemProps {
  goal: GoalView
  canManage?: boolean
  onUpdateMetric?: (goalId: number, value: number) => Promise<void>
  onToggleMilestone?: (goalId: number, milestoneId: number, isDone: boolean) => Promise<void>
  onDelete?: (goalId: number) => Promise<void>
  onEdit?: (goal: GoalView) => void
  onApprove?: (goalId: number) => Promise<void>
  onReject?: (goalId: number, reason?: string) => Promise<void>
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
  onEdit,
  onApprove,
  onReject,
}: GoalItemProps) {
  const [metricInput, setMetricInput] = useState<string>(
    goal.currentValue !== null ? String(goal.currentValue) : '0',
  )
  const [isUpdating, setIsUpdating] = useState(false)
  const [isToggling, setIsToggling] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isApproved = goal.approvalStatus === 'approved'

  const handleApprove = async () => {
    if (!onApprove) return
    setIsApproving(true)
    setError(null)
    try {
      await onApprove(goal.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve goal')
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!onReject) return
    const reason = window.prompt(`Enter rejection reason for "${goal.title}" (optional):`)
    if (reason === null) return // User cancelled prompt
    setIsRejecting(true)
    setError(null)
    try {
      await onReject(goal.id, reason.trim() || undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject goal')
    } finally {
      setIsRejecting(false)
    }
  }

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

            {goal.approvalStatus !== 'approved' && (
              <span
                className={`chip ${goal.approvalStatus === 'pending' ? 'c-wfo' : 'c-abs'}`}
                style={{ padding: '3px 9px', borderRadius: 99, fontSize: 11.5, fontWeight: 700 }}
              >
                {goal.approvalStatus === 'pending' ? 'Pending Approval' : 'Rejected'}
              </span>
            )}

            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {goal.goalType === 'milestone'
                ? `${goal.milestonesDone} of ${goal.milestonesTotal} milestones complete`
                : `${fmtValue(goal.currentValue, goal.unit)} of ${fmtValue(goal.targetValue, goal.unit)} target`}
            </span>

            {goal.note && (
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: isExpanded ? '#e8e2d8' : '#f1ede7',
                  border: 'none',
                  color: 'var(--ink2)',
                  padding: '3px 8px',
                  borderRadius: 99,
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title={isExpanded ? 'Hide details' : 'Show details'}
              >
                <span>💡 Details</span>
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ font: "800 24px 'Plus Jakarta Sans', sans-serif", color: tone, letterSpacing: '-0.03em' }}>
            {goal.progress}%
          </div>

          {goal.note && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              title={isExpanded ? 'Hide details' : 'Show details'}
              aria-label={isExpanded ? 'Hide details' : 'Show details'}
              style={{
                background: isExpanded ? '#efeae1' : '#f8f6f2',
                border: '1px solid var(--line, #e2e8f0)',
                borderRadius: 8,
                width: 32,
                height: 32,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--ink2, #334155)',
                transition: 'all 0.15s ease',
                padding: 0,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}
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

      {/* Pending Manager Approval banner */}
      {goal.approvalStatus === 'pending' && canManage && (onApprove || onReject) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#fffbe6',
            border: '1px solid #ffe58f',
            borderRadius: 10,
            padding: '10px 14px',
            gap: 10,
          }}
        >
          <div style={{ fontSize: 12.5, color: '#874d00', fontWeight: 600 }}>
            ⚡ Goal awaiting your review
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {onApprove && (
              <button
                type="button"
                className="btn sm primary"
                disabled={isApproving || isRejecting}
                onClick={handleApprove}
                style={{ background: 'var(--green)', borderColor: 'var(--green)' }}
              >
                {isApproving ? 'Approving…' : '✓ Approve'}
              </button>
            )}
            {onReject && (
              <button
                type="button"
                className="btn sm ghost"
                disabled={isApproving || isRejecting}
                onClick={handleReject}
                style={{ color: 'var(--red)', borderColor: '#ffa39e' }}
              >
                {isRejecting ? 'Rejecting…' : '✕ Reject'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pending status notification for employee */}
      {goal.approvalStatus === 'pending' && !canManage && (
        <div
          style={{
            background: '#faf8f5',
            border: '1px dashed #e4ded5',
            borderRadius: 8,
            padding: '9px 12px',
            fontSize: 12,
            color: 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>⏳</span>
          <span>Awaiting approval from your reporting manager. Progress tracking will unlock once approved.</span>
        </div>
      )}

      {/* Rejected status banner */}
      {goal.approvalStatus === 'rejected' && (
        <div
          style={{
            background: '#fff2f0',
            border: '1px solid #ffccc7',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 12.5,
            color: '#cf1322',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div>
            <b>Rejected by {goal.approverName || 'Manager'}:</b> {goal.rejectionReason || 'No feedback provided.'}
          </div>
          {onEdit && (
            <button
              type="button"
              className="btn sm primary"
              onClick={() => onEdit(goal)}
              style={{ background: '#cf1322', borderColor: '#cf1322' }}
            >
              ✏️ Edit & Resubmit
            </button>
          )}
        </div>
      )}

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
                cursor: isApproved && onToggleMilestone ? 'pointer' : 'default',
                opacity: isToggling === m.id || !isApproved ? 0.6 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={m.isDone}
                disabled={!isApproved || !onToggleMilestone || isToggling === m.id}
                onChange={() => handleToggle(m.id, m.isDone)}
                style={{
                  width: 16,
                  height: 16,
                  cursor: isApproved ? 'pointer' : 'not-allowed',
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
      {goal.goalType === 'metric' && onUpdateMetric && isApproved && (
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

      {/* Note / Guidance if expanded */}
      {goal.note && isExpanded && (
        <div
          style={{
            background: '#faf8f5',
            border: '1px solid #efeae1',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 12.5,
            color: 'var(--ink2)',
            lineHeight: 1.55,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            wordBreak: 'break-word',
          }}
        >
          <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>💡</span>
          <div style={{ flex: 1, whiteSpace: 'pre-wrap' }}>{goal.note}</div>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onEdit && goal.approvalStatus !== 'rejected' && (
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => onEdit(goal)}
              style={{
                padding: '4px 8px',
                fontSize: 11,
                color: 'var(--ink2)',
                border: 'none',
                background: 'transparent',
              }}
            >
              ✏️ Edit goal
            </button>
          )}

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
    </div>
  )
}
