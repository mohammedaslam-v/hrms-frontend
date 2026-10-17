import { useState, type FormEvent } from 'react'
import { Modal } from '../../shared/ui/Modal'
import { fmtShort } from '../../shared/lib/date'
import { workActivityApi } from './work-activity.api'
import { ACTIVITY_LABEL, type WorkActivityType } from './work-activity.types'

const NOTE_MAX = 500

/** Recording a phone call, outside meeting or other work done away from the system. */
export function AddActivityModal({
  dates,
  onClose,
  onSaved,
}: {
  /** Days that may be recorded for, newest (today) first. */
  dates: string[]
  onClose: () => void
  onSaved: () => void
}) {
  const [date, setDate] = useState(dates[0] ?? '')
  const [type, setType] = useState<WorkActivityType>('phone_call')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!startTime || !endTime) return setError('Enter both a start and an end time.')
    if (endTime <= startTime) return setError('The end time must be after the start time.')
    if (type === 'other' && !note.trim()) return setError('Add a short note saying what the activity was.')
    setBusy(true)
    setError(null)
    try {
      await workActivityApi.create({ date, type, startTime, endTime, note: note.trim() })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the activity.')
    } finally {
      setBusy(false)
    }
  }

  const dayLabel = (d: string, i: number) =>
    i === 0 ? `Today (${fmtShort(d)})` : i === 1 ? `Yesterday (${fmtShort(d)})` : fmtShort(d)

  return (
    <Modal
      title="Add activity"
      onClose={onClose}
      onSubmit={submit}
      error={error}
      busy={busy}
      maxWidth={440}
      confirm={
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save activity'}
        </button>
      }
    >
      <div className="grid g2">
        <div className="f">
          <label>Day</label>
          <select value={date} onChange={(e) => setDate(e.target.value)}>
            {dates.map((d, i) => (
              <option key={d} value={d}>
                {dayLabel(d, i)}
              </option>
            ))}
          </select>
        </div>
        <div className="f">
          <label>Activity</label>
          <select value={type} onChange={(e) => setType(e.target.value as WorkActivityType)}>
            {(Object.keys(ACTIVITY_LABEL) as WorkActivityType[]).map((t) => (
              <option key={t} value={t}>
                {ACTIVITY_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="f">
          <label>From</label>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        </div>
        <div className="f">
          <label>To</label>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
        </div>
      </div>
      <div className="f" style={{ marginTop: 10 }}>
        <label>Note {type === 'other' ? '*' : '(optional)'}</label>
        <textarea
          rows={2}
          maxLength={NOTE_MAX}
          value={note}
          placeholder={type === 'external_meeting' ? 'e.g. Client visit — Acme School' : 'What was it about?'}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="hint">
          {note.length}/{NOTE_MAX}
        </div>
      </div>
    </Modal>
  )
}
