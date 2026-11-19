import { asHours } from '../../shared/lib/format'
import type { AdminPanelActivity } from './presence.types'

/**
 * One line's worth of a day on the admin panel, for the week chart's compact
 * hover box: the time, and the single most useful fact beside it. The full
 * picture is AdminPanelLines, in the day's detail window.
 */
export function adminDaySummary(
  activity: AdminPanelActivity,
  date: string,
  isToday: boolean,
): { value: string; detail: string; live: boolean } {
  if (!activity.linked) return { value: '—', detail: 'No account linked', live: false }
  const day = activity.days.find((d) => d.date === date)
  const live = isToday && activity.now?.status === 'online'
  const value = day ? asHours(day.activeSeconds / 3600) : '—'
  if (live) {
    const target = activity.now?.page.panelName ?? (activity.now?.page.panel === 'admin' ? 'the panel' : 'panels')
    return { value, detail: `On ${target} now`, live }
  }
  if (day) return { value, detail: `${day.firstSeen} – ${day.lastSeen}`, live }
  return { value, detail: 'Not recorded', live }
}
