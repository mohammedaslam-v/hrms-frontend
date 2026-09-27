import { useState } from 'react'
import { AddFeedbackModal } from './AddFeedbackModal'
import { feedbackApi } from './feedback.api'
import type { FeedbackRecord } from './feedback.types'
import { fmtDate } from '../../shared/lib/date'
// oxlint-disable-next-line eslint/no-restricted-imports
import { useAuth } from '../../app/auth-context'

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
  const { employee } = useAuth()
  const [writing, setWriting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const canDelete = (note: FeedbackRecord): boolean => {
    if (note.authorId && note.authorId === employee.id) return true
    return employee.tiers.includes('admin')
  }

  const handleDelete = async (noteId: number) => {
    if (!window.confirm('Are you sure you want to remove this feedback note?')) return
    setDeletingId(noteId)
    try {
      const updated = await feedbackApi.delete(noteId)
      onChange(updated)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete feedback.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0 }}>Feedback from manager</h3>
          {feedback.length > 0 && (
            <span
              className="tag"
              style={{
                fontSize: 11,
              }}
            >
              {feedback.length} {feedback.length === 1 ? 'note' : 'notes'}
            </span>
          )}
        </div>

        {canRecord && (
          <button
            type="button"
            className="btn ghost sm"
            onClick={() => setWriting(true)}
            style={{ fontSize: 11.5 }}
          >
            + Leave feedback
          </button>
        )}
      </div>

      {feedback.length === 0 ? (
        <div
          className="empty"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <b>No feedback yet</b>
          {isSelf ? (
            <span>Notes and guidance your manager writes for you will appear here.</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <span>Be the first to leave praise, coaching or project notes for {employeeName}.</span>
              {canRecord && (
                <button
                  type="button"
                  className="btn primary sm"
                  onClick={() => setWriting(true)}
                  style={{ marginTop: 4 }}
                >
                  Leave first feedback
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="fb-scroll" style={{ flex: 1 }}>
          {feedback.map((note) => (
            <div className="fb" key={note.id}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <div>
                  <span className="who">{note.authorName ?? 'Someone who has left'}</span>
                  <span className="when">{fmtDate(note.givenOn)}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {note.visibility === 'managers_only' && (
                    <span
                      className="chip c-abs"
                      style={{ fontSize: 10.5, padding: '1px 7px' }}
                      title="This note is confidential and hidden from the employee"
                    >
                      🔒 Managers only
                    </span>
                  )}

                  {canDelete(note) && (
                    <button
                      type="button"
                      className="btn ghost sm"
                      onClick={() => handleDelete(note.id)}
                      disabled={deletingId === note.id}
                      style={{
                        padding: '2px 6px',
                        fontSize: 11,
                        color: 'var(--red)',
                        borderColor: 'transparent',
                      }}
                      title="Delete note"
                    >
                      {deletingId === note.id ? '…' : '✕'}
                    </button>
                  )}
                </div>
              </div>

              <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5, color: 'var(--ink2)' }}>
                {note.body}
              </p>
            </div>
          ))}
        </div>
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
