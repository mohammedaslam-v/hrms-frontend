import { GOAL_TONE, type GoalView } from './goals.types'

/**
 * A goal's figures, written the way the goal itself is written.
 *
 * The unit decides the formatting: ₹ gets Indian grouping and a symbol, % and ×
 * are suffixes, and everything else is a plain grouped number. A target of
 * "1400" means nothing without knowing it is rupees.
 */
const goalValue = (value: number | null, unit: string | null): string => {
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

/** "31 of 40" for a number, "2 of 4 milestones" for a checklist. */
const detailOf = (goal: GoalView): string =>
  goal.goalType === 'milestone'
    ? `${goal.milestonesDone} of ${goal.milestonesTotal} milestones`
    : `${goalValue(goal.currentValue, goal.unit)} of ${goalValue(goal.targetValue, goal.unit)}`

function Goal({ goal }: { goal: GoalView }) {
  const tone = GOAL_TONE[goal.status]
  return (
    <div className="goal">
      <div className="g-top">
        <span>{goal.title}</span>
        <b style={{ color: tone }}>{goal.progress}%</b>
      </div>
      <div className="bar">
        <i style={{ width: `${goal.progress}%`, background: tone }} />
      </div>
      <div className="hint" style={{ marginTop: 4 }}>
        {goal.periodLabel} · {goal.status} · {detailOf(goal)}
      </div>
    </div>
  )
}

/**
 * Goals, read only.
 *
 * Setting and editing goals belongs to the Goals page, so this list links out
 * rather than opening a form — one screen owns the writes, and the rules for
 * them live with it.
 */
export function GoalsCard({ goals, isSelf }: { goals: GoalView[]; isSelf: boolean }) {
  return (
    <div className="card">
      <h3>Goals</h3>
      {goals.length === 0 ? (
        <div className="empty">
          <b>No goals set for this year</b>
          {isSelf
            ? 'Your manager sets these, and progress appears here as it is updated.'
            : 'Nothing has been set for this person yet.'}
        </div>
      ) : (
        goals.map((goal) => <Goal goal={goal} key={goal.id} />)
      )}
    </div>
  )
}
