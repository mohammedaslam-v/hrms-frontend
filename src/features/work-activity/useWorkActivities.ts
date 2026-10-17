import { useCallback, useEffect, useState } from 'react'
import { workActivityApi } from './work-activity.api'
import type { WorkActivityRange } from './work-activity.types'

/** Fired after an activity is added or deleted, so every card showing them reloads. */
export const WORK_ACTIVITIES_CHANGED = 'work-activities:changed'

export const announceActivitiesChanged = (): void => {
  window.dispatchEvent(new Event(WORK_ACTIVITIES_CHANGED))
}

/**
 * Recorded activities for a range of days. Null until loaded; stays null if the
 * request fails (with `error` set), so the card it sits in carries on without them.
 */
export function useWorkActivities(from: string | null, to: string | null, employeeId?: number) {
  const [range, setRange] = useState<WorkActivityRange | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!from || !to) return
    try {
      setRange(await workActivityApi.list(from, to, employeeId))
      setError(null)
    } catch (err) {
      setRange(null)
      setError(err instanceof Error ? err.message : 'Could not load activities.')
    }
  }, [from, to, employeeId])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
    const reload = () => void load()
    window.addEventListener(WORK_ACTIVITIES_CHANGED, reload)
    return () => window.removeEventListener(WORK_ACTIVITIES_CHANGED, reload)
  }, [load])

  return { range, error, reload: load }
}
