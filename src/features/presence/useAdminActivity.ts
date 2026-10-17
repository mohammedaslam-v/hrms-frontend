import { useEffect, useState } from 'react'
import { presenceApi } from './presence.api'
import type { AdminPanelActivity } from './presence.types'

/**
 * Admin-panel time for a range of days. Null until loaded, and stays null when
 * the server refuses (a viewer outside the pilot) or fails — the caller then
 * simply shows nothing extra, so the week chart is never broken by it.
 */
export function useAdminActivity(
  from: string | null,
  to: string | null,
  employeeId?: number,
): AdminPanelActivity | null {
  const [activity, setActivity] = useState<AdminPanelActivity | null>(null)

  useEffect(() => {
    if (!from || !to) return
    let live = true
    presenceApi
      .days(from, to, employeeId)
      .then((a) => {
        if (live) setActivity(a)
      })
      .catch(() => {
        if (live) setActivity(null)
      })
    return () => {
      live = false
    }
  }, [from, to, employeeId])

  return activity
}
