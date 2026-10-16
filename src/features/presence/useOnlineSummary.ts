import { useCallback, useEffect, useState } from 'react'
import { ApiRequestError } from '../../shared/api/client'
import { presenceApi } from './presence.api'
import type { PresenceSummary } from './presence.types'

/** Default refresh (the server counts "online" as 3 minutes), as on the admin panel. */
export const ONLINE_REFRESH_MS = 60 * 1000

/**
 * Who is on the admin panel now / in the last hour. Re-reads every `everyMs`
 * while the tab is visible; a failed read keeps the last list and tries again
 * on the next tick.
 *
 * A 403 means this account is not allowed the list (it is a pilot for now):
 * `forbidden` turns on and polling stops, rather than asking again every minute.
 */
export function useOnlineSummary(everyMs = ONLINE_REFRESH_MS) {
  const [summary, setSummary] = useState<PresenceSummary | null>(null)
  const [failed, setFailed] = useState(false)
  const [forbidden, setForbidden] = useState(false)

  const load = useCallback(async () => {
    try {
      setSummary(await presenceApi.online())
      setFailed(false)
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 403) setForbidden(true)
      setFailed(true)
    }
  }, [])

  useEffect(() => {
    if (forbidden) return
    void load()
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load()
    }, everyMs)
    return () => window.clearInterval(t)
  }, [everyMs, load, forbidden])

  return { summary, failed, forbidden, reload: load }
}
