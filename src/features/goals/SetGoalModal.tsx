import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Modal } from '../../shared/ui/Modal'
import { messageOf } from '../../shared/api/errors'
import { goalsApi } from './goals.api'
import type {
  CreateGoalDto,
  GoalDirection,
  GoalPeriod,
  GoalType,
  GoalView,
  UpdateGoalDto,
} from './goals.types'

interface MemberOption {
  id: number
  fullName: string
  employeeCode?: string
  designation?: string | null
}

interface SetGoalModalProps {
  members?: MemberOption[]
  initialEmployeeId?: number
  isSelf?: boolean
  editGoal?: GoalView | null
  onCreated?: (created: GoalView) => void
  onSaved?: (saved: GoalView) => void
  onClose: () => void
}

const PERIODS: { value: GoalPeriod; label: string }[] = [
  { value: 'Q1', label: 'Q1 · Jan–Mar' },
  { value: 'Q2', label: 'Q2 · Apr–Jun' },
  { value: 'Q3', label: 'Q3 · Jul–Sep' },
  { value: 'Q4', label: 'Q4 · Oct–Dec' },
  { value: 'H1', label: 'H1 · Jan–Jun' },
  { value: 'H2', label: 'H2 · Jul–Dec' },
  { value: 'FY', label: 'Full year · Jan–Dec' },
]

interface CleanSelectProps<T extends string | number> {
  id?: string
  value: T
  options: { value: T; label: string }[]
  onChange: (val: T) => void
  disabled?: boolean
}

function CleanSelect<T extends string | number>({
  id,
  value,
  options,
  onChange,
  disabled = false,
}: CleanSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const selected = options.find((o) => o.value === value)

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          height: 38,
          padding: '8px 12px',
          borderRadius: 8,
          border: isOpen ? '1px solid var(--blue, #2563eb)' : '1px solid var(--line, #e2e8f0)',
          boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : 'none',
          backgroundColor: disabled ? '#f8fafc' : '#ffffff',
          color: 'var(--ink, #0f172a)',
          fontSize: 13,
          fontFamily: "'Inter', sans-serif",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: 500,
          }}
        >
          {selected ? selected.label : String(value)}
        </span>
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--muted2, #64748b)"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
            flexShrink: 0,
            marginLeft: 8,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            border: '1px solid var(--line, #e2e8f0)',
            borderRadius: 10,
            boxShadow: '0 10px 25px -4px rgba(24, 19, 13, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 1000,
            maxHeight: 230,
            overflowY: 'auto',
            padding: '4px 0',
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <div
                key={String(opt.value)}
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                style={{
                  padding: '9px 12px',
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: isSelected ? '#f1f5f9' : 'transparent',
                  color: isSelected ? 'var(--blue, #2563eb)' : 'var(--ink, #0f172a)',
                  fontWeight: isSelected ? 600 : 400,
                  transition: 'background-color 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc'
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function SetGoalModal({
  members = [],
  initialEmployeeId,
  isSelf = false,
  editGoal = null,
  onCreated,
  onSaved,
  onClose,
}: SetGoalModalProps) {
  const isEdit = Boolean(editGoal)

  const [employeeId, setEmployeeId] = useState<number>(
    editGoal?.employeeId ?? initialEmployeeId ?? (members[0]?.id || 0),
  )
  const [title, setTitle] = useState(editGoal?.title ?? '')
  const [goalType, setGoalType] = useState<GoalType>(editGoal?.goalType ?? 'metric')
  const [period, setPeriod] = useState<GoalPeriod>(editGoal?.period ?? 'Q2')

  // Metric fields
  const [targetValue, setTargetValue] = useState<string>(
    editGoal?.targetValue !== null && editGoal?.targetValue !== undefined
      ? String(editGoal.targetValue)
      : '100',
  )
  const [currentValue, setCurrentValue] = useState<string>(
    editGoal?.currentValue !== null && editGoal?.currentValue !== undefined
      ? String(editGoal.currentValue)
      : '0',
  )
  const [unit, setUnit] = useState<string>(editGoal?.unit ?? '%')
  const [direction, setDirection] = useState<GoalDirection>(editGoal?.direction ?? 'up')

  // Milestone fields
  const [milestones, setMilestones] = useState<string[]>(
    editGoal?.milestones && editGoal.milestones.length > 0
      ? editGoal.milestones.map((m) => m.title)
      : ['Research and scoping', 'Design implementation', 'Review and signoff'],
  )

  const [note, setNote] = useState(editGoal?.note ?? '')
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
    if (!employeeId && !isSelf && !isEdit) {
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
      if (isEdit && editGoal) {
        const dto: UpdateGoalDto = {
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

        const updated = await goalsApi.update(editGoal.id, dto)
        if (onSaved) onSaved(updated)
        else if (onCreated) onCreated(updated)
        onClose()
      } else {
        const dto: CreateGoalDto = {
          employeeId: employeeId || initialEmployeeId || 0,
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
        if (onSaved) onSaved(created)
        else if (onCreated) onCreated(created)
        onClose()
      }
    } catch (err) {
      setError(messageOf(err, isEdit ? 'Could not update this goal.' : 'Could not set this goal.'))
      setBusy(false)
    }
  }

  const modalTitle = isEdit
    ? 'Edit goal'
    : isSelf
      ? 'Set my goal'
      : 'Set a goal'

  const confirmText = isEdit
    ? editGoal?.approvalStatus === 'rejected'
      ? 'Save & Resubmit'
      : 'Save changes'
    : isSelf
      ? 'Submit for approval'
      : 'Set goal'

  return (
    <Modal
      title={modalTitle}
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
          {busy ? 'Saving…' : confirmText}
        </button>
      }
    >
      {isSelf && !isEdit && (
        <div
          style={{
            background: '#eef6fc',
            border: '1px solid #c9e0f5',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 12.5,
            color: '#1a568c',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>ℹ️</span>
          <span>
            This goal will be submitted to your reporting manager for approval. Once approved, you can track progress.
          </span>
        </div>
      )}

      {isEdit && editGoal?.approvalStatus === 'rejected' && (
        <div
          style={{
            background: '#fff2f0',
            border: '1px solid #ffccc7',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 12.5,
            color: '#cf1322',
            marginBottom: 14,
          }}
        >
          <b>Manager Feedback:</b> {editGoal.rejectionReason || 'No reason provided.'}
          <div style={{ marginTop: 4, fontSize: 12, color: '#8c1a1a' }}>
            Updating this goal will automatically resubmit it for your manager’s approval.
          </div>
        </div>
      )}

      <div className={`grid ${!isSelf && !isEdit && members.length > 0 ? 'g2' : 'g1'}`} style={{ marginBottom: 14 }}>
        {!isSelf && !isEdit && members.length > 0 && (
          <div className="f">
            <label htmlFor="goalEmployee">Team member</label>
            <CleanSelect
              id="goalEmployee"
              value={employeeId}
              onChange={(val) => setEmployeeId(Number(val))}
              disabled={busy || members.length <= 1}
              options={members.map((m) => ({
                value: m.id,
                label: `${m.fullName}${m.designation ? ` (${m.designation})` : ''}`,
              }))}
            />
          </div>
        )}

        <div className="f">
          <label htmlFor="goalPeriod">Period</label>
          <CleanSelect
            id="goalPeriod"
            value={period}
            onChange={(val) => setPeriod(val as GoalPeriod)}
            disabled={busy}
            options={PERIODS}
          />
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
