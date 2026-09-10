/** Display formatting that is not about dates. */

/**
 * `8.75` → `8h 45m`.
 *
 * Hours reach the browser as a decimal because that is what arithmetic wants;
 * nobody reads their day as "8.75", so every screen that shows a duration shows
 * it like this. Negative input clamps to zero rather than printing `-1h 45m`.
 */
export const asHours = (hours: number): string => {
  const total = Math.max(0, Math.round(hours * 60))
  return `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, '0')}m`
}

/** `Sajan Tomar` → `ST`. The avatar fallback, wherever there is no photograph. */
export const initials = (name: string): string =>
  name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
