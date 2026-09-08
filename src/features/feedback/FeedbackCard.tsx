import { useState } from 'react'
import { AddFeedbackModal } from './AddFeedbackModal'
import type { FeedbackRecord } from './feedback.types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const fmtDate = (iso: string): string => {
  const [y, m, d] = iso.split('-')
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`
}

/**
 * Feedback from a manager.
 *
 * The list arrives already filtered — a note marked `managers_only` is absent
 * from the response for the person it is about, not hidden here. The badge below
 * is a courtesy to the manager reading it, so they know the subject cannot see
 * that note; it is not what enforces the rule.
 */
interface FeedbackCardProps {
  feedback: FeedbackRecord[]
  isSelf: boolean
  canRecord: boolean
  employeeId: number
  employeeName: string
  onChange: (feedback: FeedbackRecord[]) => void
}

export function FeedbackCard({
  feedback,
  isSelf,
  canRecord,
  employeeId,
  employeeName,
  onChange,
}: FeedbackCardProps) {
  const [writing, setWriting] = useState(false)

  return (
    <div className="card">
      <h3>Feedback from manager</h3>
      {feedback.length === 0 ? (
        <div className="empty">
          <b>No feedback yet</b>
          {isSelf
            ? 'Notes your manager writes for you appear here.'
            : 'Nothing has been written about this person yet.'}
        </div>
      ) : (
        feedback.map((note) => (
          <div className="fb" key={note.id}>
            <span className="who">{note.authorName ?? 'Someone who has left'}</span>
            <span className="when">{fmtDate(note.givenOn)}</span>
            {note.visibility === 'managers_only' && (
              <span className="chip c-abs" style={{ marginLeft: 6 }}>
                Not shown to them
              </span>
            )}
            <p>{note.body}</p>
          </div>
        ))
      )}

      {canRecord && (
        <button className="btn ghost sm mt" onClick={() => setWriting(true)}>
          Leave feedback
        </button>
      )}

      {writing && (
        <AddFeedbackModal
          employeeId={employeeId}
          employeeName={employeeName}
          onAdded={onChange}
          onClose={() => setWriting(false)}
        />
      )}
    </div>
  )
}
