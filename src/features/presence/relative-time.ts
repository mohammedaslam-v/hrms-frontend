// Copied from the new admin (admin-frontend src/lib/relativeTime.ts) so both
// headers word times the same way.

/** "just now", "3 min ago", "1 hr ago" — for the who-is-online lists. */
export function agoLabel(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  if (s < 45) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest ? `${h} hr ${rest} min ago` : `${h} hr ago`
}

/** "under a minute", "12 min", "1 hr 05 min" — how long a visit has lasted. */
export function durationLabel(minutes: number): string {
  const m = Math.max(0, Math.floor(minutes))
  if (m < 1) return 'under a minute'
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest ? `${h} hr ${String(rest).padStart(2, '0')} min` : `${h} hr`
}
