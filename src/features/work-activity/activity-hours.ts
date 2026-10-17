/**
 * Merging recorded activities into a day's active time.
 *
 * Time is counted once however many records cover it: a call taken while
 * checked in adds nothing, a meeting after check-out adds its full length, and
 * one that runs past check-out adds only the part outside it.
 */
export interface Span {
  from: string
  /** Null while still checked in — read as `now`. */
  to: string | null
}

const toMinutes = (t: string): number => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))

/** [start, end) in minutes; a span that wraps past midnight is cut at 24:00. */
const toRange = (s: Span, now: string): [number, number] => {
  const start = toMinutes(s.from)
  const end = toMinutes(s.to ?? now)
  return [start, end >= start ? end : 24 * 60]
}

/** Total minutes covered by the spans, overlaps counted once. */
export function coveredMinutes(spans: Span[], now: string): number {
  const ranges = spans.map((s) => toRange(s, now)).sort((a, b) => a[0] - b[0])
  let total = 0
  let curStart = -1
  let curEnd = -1
  for (const [start, end] of ranges) {
    if (start > curEnd) {
      if (curEnd > curStart) total += curEnd - curStart
      curStart = start
      curEnd = end
    } else if (end > curEnd) {
      curEnd = end
    }
  }
  if (curEnd > curStart) total += curEnd - curStart
  return total
}

/** Minutes the activities add on top of the check-in time. */
export function addedMinutes(punches: Span[], activities: Span[], now: string): number {
  if (activities.length === 0) return 0
  return Math.max(0, coveredMinutes([...punches, ...activities], now) - coveredMinutes(punches, now))
}
