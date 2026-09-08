import { useEffect, useState, type FormEvent } from 'react'
import { feedbackApi } from './feedback.api'
import type { FeedbackRecord, FeedbackVisibility } from './feedback.types'

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, saving])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      onAdded(await feedbackApi.add(employeeId, { body, visibility }))
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that.')
      setSaving(false)
    }
  }

  const shared = visibility === 'employee'

  return (
    <div className="modal on" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="box" onSubmit={submit} style={{ maxWidth: 520 }}>
        <div className="mh">
          <h3>Feedback for {employeeName}</h3>
          <button className="x" type="button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {error && (
          <div className="notice bad" style={{ marginBottom: 14 }} role="alert">
            {error}
          </div>
        )}

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

        <div className="mfoot">
          <button className="btn ghost" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn primary" type="submit" disabled={saving || !body.trim()}>
            {saving ? 'Saving…' : 'Save feedback'}
          </button>
        </div>
      </form>
    </div>
  )
}
