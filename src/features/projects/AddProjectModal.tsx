import { useState, type FormEvent } from 'react'
import { projectsApi } from './projects.api'
import type { ProjectRecord, ProjectStatus, ProjectType } from './projects.types'
import { Modal } from '../../shared/ui/Modal'
import { messageOf } from '../../shared/api/errors'

const STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'In progress', label: 'In progress' },
  { value: 'Live', label: 'Live — shipped and running' },
  { value: 'Done', label: 'Done — finished' },
]

interface AddProjectModalProps {
  employeeId: number
  employeeName: string
  isSelf?: boolean
  onAdded: (projects: ProjectRecord[]) => void
  onClose: () => void
}

export function AddProjectModal({
  employeeId,
  employeeName,
  isSelf = false,
  onAdded,
  onClose,
}: AddProjectModalProps) {
  const [type, setType] = useState<ProjectType>('project')
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('In progress')
  const [startedOn, setStartedOn] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      onAdded(
        await projectsApi.add(employeeId, {
          type,
          title,
          status: type === 'achievement' ? 'Done' : status,
          note: note.trim() || null,
          startedOn: startedOn || null,
        }),
      )
      onClose()
    } catch (err) {
      setError(messageOf(err, 'Could not save that.'))
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isSelf ? 'Add a project or achievement' : `Add for ${employeeName}`}
      onClose={onClose}
      onSubmit={submit}
      busy={saving}
      error={error}
      maxWidth={520}
      confirm={
        <button className="btn primary" type="submit" disabled={saving || !title.trim()}>
          {saving ? 'Saving…' : type === 'achievement' ? 'Add achievement' : 'Add project'}
        </button>
      }
    >
      {/* Type Selector Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          background: 'var(--bg)',
          padding: '4px',
          borderRadius: '8px',
          marginBottom: '16px',
        }}
      >
        <button
          type="button"
          className={`btn sm ${type === 'project' ? 'primary' : 'ghost'}`}
          style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}
          onClick={() => {
            setType('project')
            setStatus('In progress')
          }}
        >
          🚀 Project
        </button>
        <button
          type="button"
          className={`btn sm ${type === 'achievement' ? 'primary' : 'ghost'}`}
          style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}
          onClick={() => {
            setType('achievement')
            setStatus('Done')
          }}
        >
          🏆 Key Achievement
        </button>
      </div>

      <div className="f">
        <label htmlFor="projectTitle">
          {type === 'achievement' ? 'What was the achievement / win' : 'What was the work'}
        </label>
        <input
          id="projectTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            type === 'achievement'
              ? 'e.g. Cut blended CAC by 18% in one quarter'
              : 'e.g. HRMS leave and attendance module'
          }
          disabled={saving}
          required
        />
      </div>

      <div className="grid g2 mt">
        {type === 'project' ? (
          <div className="f">
            <label htmlFor="projectStatus">Where it stands</label>
            <select
              id="projectStatus"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              disabled={saving}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="f">
            <label htmlFor="achievementTag">Category</label>
            <div
              style={{
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 10px',
                background: 'var(--bg)',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--amber)',
              }}
            >
              🏆 Milestone Win
            </div>
          </div>
        )}

        <div className="f">
          <label htmlFor="projectStarted">
            {type === 'achievement' ? 'Date achieved — optional' : 'Started — optional'}
          </label>
          <input
            id="projectStarted"
            type="date"
            value={startedOn}
            onChange={(e) => setStartedOn(e.target.value)}
            disabled={saving}
          />
        </div>
      </div>

      <div className="f mt">
        <label htmlFor="projectNote">
          {type === 'achievement' ? 'Impact & details — optional' : 'A line of context — optional'}
        </label>
        <textarea
          id="projectNote"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={
            type === 'achievement'
              ? 'Key results, metrics or why this made a difference'
              : 'What it involved, or why it mattered'
          }
          disabled={saving}
        />
      </div>

      <div className="hint mt8">
        {isSelf
          ? 'This will appear on your profile under Projects & achievements.'
          : `This appears on ${employeeName}’s page with your name against it.`}
      </div>
    </Modal>
  )
}

