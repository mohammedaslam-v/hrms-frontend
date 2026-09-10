import { useState, type FormEvent } from 'react'
import { feedbackApi } from './feedback.api'
import type { FeedbackRecord, FeedbackVisibility } from './feedback.types'
import { Modal } from '../../shared/ui/Modal'
import { messageOf } from '../../shared/api/errors'

interface AddFeedbackModalProps {
  employeeId: number
  employeeName: string
  onAdded: (feedback: FeedbackRecord[]) => void
  onClose: () => void
}

export function AddFeedbackModal({
  employeeId,
  employeeName,
  onAdded,
  onClose,
}: AddFeedbackModalProps) {
  const [body, setBody] = useState('')
  const [visibility, setVisibility] = useState<FeedbackVisibility>('employee')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      onAdded(await feedbackApi.add(employeeId, { body, visibility }))
      onClose()
    } catch (err) {
      setError(messageOf(err, 'Could not save that.'))
      setSaving(false)
    }
  }

  const shared = visibility === 'employee'

  return (
    <Modal
      title={`Feedback for ${employeeName}`}
      onClose={onClose}
      onSubmit={submit}
      busy={saving}
      error={error}
      maxWidth={520}
      confirm={
        <button className="btn primary" type="submit" disabled={saving || !body.trim()}>
          {saving ? 'Saving…' : 'Save feedback'}
        </button>
      }
    >
      <div className="f">
        <label htmlFor="feedbackBody">What you want to say</label>
        <textarea
          id="feedbackBody"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Specific and about the work — what went well, or what to aim at next"
          rows={5}
          disabled={saving}
          required
        />
      </div>

      <div className="f mt">
        <label htmlFor="feedbackVisibility">Who can read this</label>
        <select
          id="feedbackVisibility"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as FeedbackVisibility)}
          disabled={saving}
        >
          <option value="employee">{employeeName} and their managers</option>
          <option value="managers_only">Managers only — {employeeName} will not see it</option>
        </select>
      </div>

      {/* The choice is consequential and irreversible from the reader's side,
          so it is spelled out rather than left to the dropdown wording. */}
      <div className={`notice ${shared ? 'blue' : ''}`} style={{ marginTop: 14 }}>
        {shared ? (
          <>
            <b>{employeeName} will see this</b> on their page, with your name against it.
          </>
        ) : (
          <>
            <b>{employeeName} will never see this.</b> Only their managers and admins can. Use
            this for notes about someone rather than for them.
          </>
        )}
      </div>
    </Modal>
  )
}
