import { useState, type FormEvent } from 'react'
import { projectsApi } from './projects.api'
import type { ProjectRecord, ProjectStatus } from './projects.types'
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
  onAdded: (projects: ProjectRecord[]) => void
  onClose: () => void
}

export function AddProjectModal({
  employeeId,
  employeeName,
  onAdded,
  onClose,
}: AddProjectModalProps) {
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
          title,
          status,
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
      title={`Add a project for ${employeeName}`}
      onClose={onClose}
      onSubmit={submit}
      busy={saving}
      error={error}
      maxWidth={520}
      confirm={
        <button className="btn primary" type="submit" disabled={saving || !title.trim()}>
          {saving ? 'Saving…' : 'Add project'}
        </button>
      }
    >
      <div className="f">
        <label htmlFor="projectTitle">What was the work</label>
        <input
          id="projectTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. HRMS leave and attendance module"
          disabled={saving}
          required
        />
      </div>

      <div className="grid g2 mt">
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
        <div className="f">
          <label htmlFor="projectStarted">Started — optional</label>
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
        <label htmlFor="projectNote">A line of context — optional</label>
        <textarea
          id="projectNote"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What it involved, or why it mattered"
          disabled={saving}
        />
      </div>

      <div className="hint mt8">
        This appears on {employeeName}’s page with your name against it.
      </div>
    </Modal>
  )
}
