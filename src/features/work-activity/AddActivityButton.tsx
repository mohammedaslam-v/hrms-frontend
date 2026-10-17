import { useState } from 'react'
import { AddActivityModal } from './AddActivityModal'
import { announceActivitiesChanged, useWorkActivities } from './useWorkActivities'

/**
 * The Today card's "+ Add activity" button, for the person's own page only.
 * Sits in the card's header so the card does not grow to fit it.
 */
export function AddActivityButton({ today }: { today: string }) {
  const { range, error } = useWorkActivities(today, today)
  const [adding, setAdding] = useState(false)

  if (!range?.canEdit) {
    // Shown, not hidden, on failure: a missing button reads as a missing feature.
    return error ? (
      <span className="hint" style={{ color: 'var(--red)', fontSize: 11 }} title={error}>
        Activities unavailable
      </span>
    ) : null
  }

  return (
    <>
      <button type="button" className="btn ghost sm" onClick={() => setAdding(true)}>
        + Add activity
      </button>
      {adding && (
        <AddActivityModal
          dates={range.editableDates}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false)
            announceActivitiesChanged()
          }}
        />
      )}
    </>
  )
}
