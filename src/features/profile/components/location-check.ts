/**
 * Has this place changed, and is the change valid? Sent only when it changed,
 * and never once it is locked. Returns an error message, or null when fine.
 */
export function checkLocationChange(
  name: string,
  lat: string,
  lng: string,
  initialLat: string,
  initialLng: string,
  locked: boolean,
): { changed: boolean; error: string | null } {
  const changed = !locked && (lat !== initialLat || lng !== initialLng)
  if (!changed) return { changed, error: null }
  if (Boolean(lat) !== Boolean(lng)) {
    return { changed, error: `Enter both latitude and longitude for the ${name}.` }
  }
  if (lat) {
    const latNum = Number(lat)
    const lngNum = Number(lng)
    if (!Number.isFinite(latNum) || Math.abs(latNum) > 90) {
      return { changed, error: `${name}: latitude must be a number between -90 and 90 (e.g. 12.910486).` }
    }
    if (!Number.isFinite(lngNum) || Math.abs(lngNum) > 180) {
      return { changed, error: `${name}: longitude must be a number between -180 and 180 (e.g. 77.648218).` }
    }
  }
  return { changed, error: null }
}
