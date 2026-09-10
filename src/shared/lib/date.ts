/**
 * Date formatting for display.
 *
 * Every date crossing the API is an ISO `YYYY-MM-DD` string — the pool is
 * configured with `dateStrings`, so nothing here ever sees a `Date` object and
 * nothing here can shift a day across a timezone. These functions slice the
 * string; they deliberately do not parse it.
 *
 * There are three widths rather than one because the screens need three. Merging
 * them would change what the team directory prints.
 */

export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** `2026-03-14` → `14 Mar`. Table columns where the year is already established. */
export const fmtShort = (iso: string): string => {
  const [, m, d] = iso.split('-')
  return `${d} ${MONTHS[Number(m) - 1]}`
}

/** `2026-03-14` → `14 Mar 2026`. The default: prose, cards, single dates. */
export const fmtDate = (iso: string): string => {
  const [y, m, d] = iso.split('-')
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`
}

/**
 * `2026-03-14` → `14 Mar 26`.
 *
 * Only the team directory's Joined column, where the year matters but the column
 * is one of ten and cannot afford four digits.
 */
export const fmtDateShortYear = (iso: string): string => {
  const [y, m, d] = iso.split('-')
  return `${d} ${MONTHS[Number(m) - 1]} ${y.slice(2)}`
}

/** `2026-03` or `2026-03-14` → `Mar 2026`. Month headings on the leave ledger. */
export const fmtMonth = (iso: string): string => {
  const [y, m] = iso.split('-')
  return `${MONTHS[Number(m) - 1]} ${y}`
}
