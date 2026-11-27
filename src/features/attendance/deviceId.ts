const KEY = 'hrms_device_id'

/** Kept for this page's life when the browser refuses storage (private mode). */
let fallback: string | null = null

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`

/**
 * A random id this browser keeps for itself, so a break started here can only
 * be ended here. Not a secret and not a fingerprint: it identifies nothing but
 * "the same browser as before". Clearing site data makes a new one, and a break
 * started under the old one then ends by itself when its hour runs out.
 */
export function deviceId(): string {
  try {
    const stored = localStorage.getItem(KEY)
    if (stored) return stored
    const id = newId()
    localStorage.setItem(KEY, id)
    return id
  } catch {
    fallback ??= newId()
    return fallback
  }
}
