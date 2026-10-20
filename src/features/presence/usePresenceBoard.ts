import { useCallback, useEffect, useState } from 'react'
import { ApiRequestError } from '../../shared/api/client'
import { presenceApi } from './presence.api'
import type { PresenceBoard } from './presence.types'

/*
 * Two reads, sized to what is on screen — the lesson of the admin panel's
 * request storm, where several copies of a list each polled and re-polled on
 * every ping:
 *
 *   · closed: one COUNT a minute, only while the tab is visible
 *   · open:   the full board, loaded on opening and every 30 s while open
 *
 * One component owns both (the header pill), so there is one request each,
 * never one per card. Nothing else triggers a reload.
 */

export const COUNT_REFRESH_MS = 60 * 1000
export const BOARD_REFRESH_MS = 30 * 1000

const visible = () => document.visibilityState === 'visible'

/**
 * The pill's number. `forbidden` stops polling for an account that is refused;
 * any other failure is kept in `error` and retried on the next tick.
 */
export function usePresenceCount() {
  const [online, setOnline] = useState<number | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (forbidden) return
    let live = true
    const load = async () => {
      try {
        const { online: n } = await presenceApi.count()
        if (live) {
          setOnline(n)
          setError(null)
        }
      } catch (err) {
        if (!live) return
        if (err instanceof ApiRequestError && err.status === 403) setForbidden(true)
        else setError(err instanceof Error ? err.message : 'Could not load who is online.')
      }
    }
    void load()
    const t = window.setInterval(() => {
      if (visible()) void load()
    }, COUNT_REFRESH_MS)
    return () => {
      live = false
      window.clearInterval(t)
    }
  }, [forbidden])

  return { online, forbidden, error }
}

/** The full board, only while `open`. Keeps the last good copy on a failed refresh. */
export function usePresenceBoard(open: boolean) {
  const [board, setBoard] = useState<PresenceBoard | null>(null)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    try {
      setBoard(await presenceApi.board())
      setFailed(false)
    } catch {
      setFailed(true)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
    const t = window.setInterval(() => {
      if (visible()) void load()
    }, BOARD_REFRESH_MS)
    return () => window.clearInterval(t)
  }, [open, load])

  return { board, failed }
}
