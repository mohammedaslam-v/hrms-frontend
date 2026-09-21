import { useState, type FormEvent } from 'react'
import { Modal } from '../../shared/ui/Modal'
import { messageOf } from '../../shared/api/errors'
import { goalsApi } from './goals.api'
import type { CreateGoalDto, GoalDirection, GoalPeriod, GoalType, GoalView } from './goals.types'

interface MemberOption {
  id: number
  fullName: string
  employeeCode?: string
  designation?: string | null
}

interface SetGoalModalProps {
  members: MemberOption[]
  initialEmployeeId?: number
  onCreated: (created: GoalView) => void
  onClose: () => void
}

const PERIODS: { value: GoalPeriod; label: string }[] = [
  { value: 'Q1', label: 'Q1 · Apr–Jun' },
  { value: 'Q2', label: 'Q2 · Jul–Sep' },
  { value: 'Q3', label: 'Q3 · Oct–Dec' },
  { value: 'Q4', label: 'Q4 · Jan–Mar' },
  { value: 'H1', label: 'H1 · Apr–Sep' },
  { value: 'H2', label: 'H2 · Oct–Mar' },
  { value: 'FY', label: 'Full financial year (FY)' },
]

export function SetGoalModal({
  members,
  initialEmployeeId,
  onCreated,
  onClose,
}: SetGoalModalProps) {
  const [employeeId, setEmployeeId] = useState<number>(
    initialEmployeeId ?? (members[0]?.id || 0),
  )
  const [title, setTitle] = useState('')
  const [goalType, setGoalType] = useState<GoalType>('metric')
  const [period, setPeriod] = useState<GoalPeriod>('Q2')

  // Metric fields
  const [targetValue, setTargetValue] = useState<string>('100')
  const [currentValue, setCurrentValue] = useState<string>('0')
  const [unit, setUnit] = useState<string>('%')
  const [direction, setDirection] = useState<GoalDirection>('up')

  // Milestone fields
  const [milestones, setMilestones] = useState<string[]>([
    'Research and scoping',
    'Design implementation',
    'Review and signoff',
  ])

  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const addMilestone = () => {
    setMilestones([...milestones, ''])
  }

  const updateMilestone = (index: number, val: string) => {
    const next = [...milestones]
    next[index] = val
    setMilestones(next)
  }

  const removeMilestone = (index: number) => {
    if (milestones.length <= 1) return
    setMilestones(milestones.filter((_, i) => i !== index))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!employeeId) {
      setError('Please select an employee.')
      return
    }
    if (!title.trim()) {
      setError('Please enter a goal title.')
      return
    }

    if (goalType === 'metric') {
      const targetNum = Number(targetValue)
      if (isNaN(targetNum) || targetNum <= 0) {
        setError('Please enter a valid target value greater than 0.')
        return
      }
    } else {
      const validMilestones = milestones.map((m) => m.trim()).filter(Boolean)
      if (validMilestones.length === 0) {
        setError('Please enter at least one milestone for the checklist.')
        return
      }
    }

    setError(null)
    setBusy(true)

    try {
      const dto: CreateGoalDto = {
        employeeId,
        title: title.trim(),
        goalType,
        period,
        note: note.trim() || null,
        targetValue: goalType === 'metric' ? Number(targetValue) : null,
        currentValue: goalType === 'metric' ? Number(currentValue) || 0 : null,
        unit: goalType === 'metric' ? unit.trim() || null : null,
        direction: goalType === 'metric' ? direction : 'up',
        milestones:
          goalType === 'milestone'
            ? milestones.map((m) => m.trim()).filter(Boolean)
            : [],
      }

      const created = await goalsApi.create(dto)
      onCreated(created)
      onClose()
    } catch (err) {
      setError(messageOf(err, 'Could not set this goal.'))
      setBusy(false)
    }
  }

  return (
    <Modal
      title="Set a goal"
      onClose={onClose}
      onSubmit={submit}
      busy={busy}
      error={error}
      maxWidth={580}
      confirm={
        <button
          className="btn primary"
          type="submit"
          disabled={busy || !title.trim()}
        >
          {busy ? 'Setting goal…' : 'Set goal'}
        </button>
      }
    >
      <div className="grid g2" style={{ marginBottom: 14 }}>
        <div className="f">
          <label htmlFor="goalEmployee">Team member</label>
          <select
            id="goalEmployee"
            value={employeeId}
            onChange={(e) => setEmployeeId(Number(e.target.value))}
            disabled={busy || members.length <= 1}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName} {m.designation ? `(${m.designation})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="f">
          <label htmlFor="goalPeriod">Period</label>
          <select
            id="goalPeriod"
            value={period}
            onChange={(e) => setPeriod(e.target.value as GoalPeriod)}
            disabled={busy}
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="f" style={{ marginBottom: 14 }}>
        <label htmlFor="goalTitle">Goal title</label>
        <input
          id="goalTitle"
          type="text"
          placeholder="e.g. Conduct 12 customer interviews and document ICP synthesis"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={busy}
          required
        />
      </div>

      <div className="f" style={{ marginBottom: 14 }}>
        <label>Goal type</label>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button
            type="button"
            className={`btn ${goalType === 'metric' ? 'primary' : 'ghost'} sm`}
            onClick={() => setGoalType('metric')}
          >
            Metric target (Number / %)
          </button>
          <button
            type="button"
            className={`btn ${goalType === 'milestone' ? 'primary' : 'ghost'} sm`}
            onClick={() => setGoalType('milestone')}
          >
            Milestone checklist
          </button>
        </div>
      </div>

      {goalType === 'metric' ? (
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 14,
          }}
        >
          <div className="grid g2" style={{ marginBottom: 12 }}>
            <div className="f">
              <label htmlFor="targetVal">Target value</label>
              <input
                id="targetVal"
                type="number"
                step="any"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="e.g. 100"
                disabled={busy}
                required
              />
            </div>
            <div className="f">
              <label htmlFor="currentVal">Current value</label>
              <input
                id="currentVal"
                type="number"
                step="any"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="e.g. 0"
                disabled={busy}
              />
            </div>
          </div>

          <div className="grid g2">
            <div className="f">
              <label htmlFor="unit">Unit (optional)</label>
              <input
                id="unit"
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. %, ₹, demos, bugs"
                disabled={busy}
              />
            </div>
            <div className="f">
              <label htmlFor="direction">Target direction</label>
              <select
                id="direction"
                value={direction}
                onChange={(e) => setDirection(e.target.value as GoalDirection)}
                disabled={busy}
              >
                <option value="up">Higher is better (Growth, revenue)</option>
                <option value="down">Lower is better (CAC, defects, latency)</option>
              </select>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 14,
          }}
        >
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12.5, fontWeight: 600 }}>
            Milestones (Key milestones to achieve this goal)
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {milestones.map((m, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--muted)', width: 20 }}>
                  {idx + 1}.
                </span>
                <input
                  type="text"
                  value={m}
                  onChange={(e) => updateMilestone(idx, e.target.value)}
                  placeholder={`Milestone ${idx + 1}`}
                  disabled={busy}
                  style={{ flex: 1 }}
                />
                {milestones.length > 1 && (
                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={() => removeMilestone(idx)}
                    style={{ padding: '6px 10px', color: 'var(--red)' }}
                    title="Remove milestone"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn ghost sm"
            onClick={addMilestone}
            style={{ marginTop: 10, fontSize: 12 }}
          >
            + Add milestone
          </button>
        </div>
      )}

      <div className="f">
        <label htmlFor="goalNote">Notes or guidance (optional)</label>
        <textarea
          id="goalNote"
          rows={2}
          placeholder="Any specific context, instructions or key stakeholders..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={busy}
        />
      </div>
    </Modal>
  )
}
