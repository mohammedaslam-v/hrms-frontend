import { useCallback, useEffect, useState } from 'react'
import type { DeviceFix, GeofencePolicy, GeofenceZone, ZoneKind } from './attendance.types'

/**
 * Where the browser says this device is, judged against the places this person
 * may punch from — the office and/or their saved home location.
 *
 * The same rule the server applies (geofence.domain.ts in hrms-backend), so the
 * buttons grey out for exactly the punches the server would refuse. The server
 * still decides — this only spares the person a click that cannot succeed.
 *
 * Uses progressive multi-tier location acquisition:
 *   1. Fast immediate fix via low-accuracy / cached network location (< 300ms)
 *   2. Parallel background refinement via high-accuracy watchPosition
 *   3. Graceful fallback to network/Wi-Fi positioning if high accuracy times out (vital for laptops without GPS)
 *   4. Automatic retry on initial lock failures before marking unavailable
 *   5. Seamless permission-change listener & manual retry trigger
 */
export type GeofenceState =
  | { kind: 'off' }
  /** WFH with no saved home location — no reading can help, so none is taken. */
  | { kind: 'no-home' }
  | { kind: 'checking' }
  | { kind: 'unsupported' }
  | { kind: 'denied' }
  | { kind: 'unavailable' }
  | {
      kind: 'inaccurate' | 'outside' | 'inside'
      fix: DeviceFix
      /** Inside: the zone containing the device. Otherwise: the nearest one. */
      zone: ZoneKind
      distanceM: number
      /** That zone's stated radius — for display, which never reveals the margin. */
      radiusM: number
    }

export interface GeofenceCheck {
  state: GeofenceState
  /** True when a punch may be attempted — always true for someone not fenced. */
  allowed: boolean
  /** Why the buttons are grey, in words. Null when there is nothing to say. */
  message: string | null
  /** The fix to send with the punch. */
  fix: DeviceFix | null
  /** Retrigger location detection without needing a page refresh. */
  retry: () => void
  /** True while actively locating the device. */
  isChecking: boolean
}

const EARTH_RADIUS_M = 6_371_000
const toRadians = (degrees: number) => (degrees * Math.PI) / 180

/** Great-circle distance in metres (haversine). */
function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

const formatDistance = (meters: number) =>
  meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`

export const PLACE: Record<ZoneKind, string> = {
  office: 'the office',
  home: 'your home location',
  second: 'your second location',
}

const placesOf = (zones: GeofenceZone[]) => zones.map((z) => PLACE[z.kind]).join(' or ')

/**
 * One pass over the zones (at most two): the first that contains the device,
 * and the nearest overall for the message when none does.
 */
function judge(fix: DeviceFix, policy: GeofencePolicy): GeofenceState {
  let inside: { zone: GeofenceZone; distanceM: number } | null = null
  let nearest: { zone: GeofenceZone; distanceM: number } | null = null
  for (const zone of policy.zones) {
    const distanceM = distanceMeters(fix, zone)
    if (!nearest || distanceM < nearest.distanceM) nearest = { zone, distanceM }
    // Decided on radius + hidden margin; the message below states radius only.
    if (!inside && distanceM <= zone.radiusM + (zone.graceM ?? 0)) inside = { zone, distanceM }
  }
  const near = { zone: nearest!.zone.kind, distanceM: nearest!.distanceM, radiusM: nearest!.zone.radiusM }
  if (fix.accuracy > policy.maxAccuracyM) return { kind: 'inaccurate', fix, ...near }
  if (inside) {
    return {
      kind: 'inside',
      fix,
      zone: inside.zone.kind,
      distanceM: inside.distanceM,
      radiusM: inside.zone.radiusM,
    }
  }
  return { kind: 'outside', fix, ...near }
}

function messageFor(state: GeofenceState, policy: GeofencePolicy | null): string | null {
  switch (state.kind) {
    case 'off':
    case 'inside':
      return null
    case 'no-home':
      return 'Save your home location before checking in or out: My page → Edit personal details → Home location.'
    case 'checking':
      return 'Locating your device… Allow location access if your browser asks.'
    case 'unsupported':
      return 'This browser cannot share your location, so check-in is unavailable here. Use Chrome, Safari or Edge, or check in from your phone.'
    case 'denied':
      return 'Location access is blocked for this site. Click the site settings icon next to the address → Location → Allow, then retry.'
    case 'unavailable':
      return 'Your device could not find its location. Ensure location services and Wi-Fi are turned on.'
    case 'inaccurate':
      return `Your location is not precise enough (±${Math.round(state.fix.accuracy)} m). Turn on Wi-Fi or location services, or check in from your phone.`
    case 'outside': {
      const zones = policy?.zones ?? []
      const radii = [...new Set(zones.map((z) => z.radiusM))].join('/')
      return `You are ${formatDistance(state.distanceM)} from ${PLACE[state.zone]}. Check-in and check-out are only allowed within ${radii} m of ${placesOf(zones)}.`
    }
  }
}

/** Readings are kept this long, and the most accurate of them is the one judged. */
const WINDOW_MS = 60_000
/** A confirmed "inside" survives a run of vague readings for this long. */
const STICKY_MS = 5 * 60_000

interface Reading {
  fix: DeviceFix
  at: number
}

function settle(
  readings: Reading[],
  lastInside: { state: GeofenceState; at: number } | null,
  now: number,
  policy: GeofencePolicy,
): { state: GeofenceState; lastInside: { state: GeofenceState; at: number } | null } {
  const best = readings.reduce((a, b) => (b.fix.accuracy < a.fix.accuracy ? b : a))
  const verdict = judge(best.fix, policy)

  if (verdict.kind === 'inside') return { state: verdict, lastInside: { state: verdict, at: now } }
  if (verdict.kind === 'inaccurate' && lastInside && now - lastInside.at <= STICKY_MS) {
    return { state: lastInside.state, lastInside }
  }
  // A confident reading outside every zone, or nothing good to fall back on.
  return { state: verdict, lastInside: verdict.kind === 'outside' ? null : lastInside }
}

/** A policy the browser can use: an older server sends a different shape, read as "off". */
const usable = (policy: GeofencePolicy | null): policy is GeofencePolicy =>
  Boolean(policy && Array.isArray(policy.zones) && (policy.zones.length > 0 || policy.homeMissing))

export function useGeofence(policy: GeofencePolicy | null): GeofenceCheck {
  const active = usable(policy) ? policy : null
  const [state, setState] = useState<GeofenceState>({ kind: active ? 'checking' : 'off' })
  const [retryNonce, setRetryNonce] = useState(0)

  const retry = useCallback(() => {
    setRetryNonce((n) => n + 1)
  }, [])

  // A string, not the object: every Today reload brings a new object with the
  // same numbers, and restarting the watch each time would flicker.
  const key = active ? JSON.stringify(active) : ''

  useEffect(() => {
    if (!key) {
      // oxlint-disable-next-line react/set-state-in-effect
      setState({ kind: 'off' })
      return
    }
    // Blocked until a home location is saved; asking for location would only
    // pop a permission prompt that cannot change the answer.
    if ((JSON.parse(key) as GeofencePolicy).homeMissing) {
      setState({ kind: 'no-home' })
      return
    }
    // Browsers only offer location on HTTPS (and localhost).
    if (!('geolocation' in navigator) || !window.isSecureContext) {
      setState({ kind: 'unsupported' })
      return
    }

    const current = JSON.parse(key) as GeofencePolicy
    setState({ kind: 'checking' })

    let cancelled = false
    let watchId: number | null = null
    let retryTimeoutId: ReturnType<typeof setTimeout> | null = null
    let autoRetriesLeft = 2
    let readings: Reading[] = []
    let lastInside: { state: GeofenceState; at: number } | null = null

    const handlePosition = (position: GeolocationPosition) => {
      if (cancelled) return
      const now = Date.now()
      readings = [
        ...readings.filter((r) => now - r.at <= WINDOW_MS),
        {
          fix: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          },
          at: now,
        },
      ]
      const next = settle(readings, lastInside, now, current)
      lastInside = next.lastInside
      setState(next.state)
    }

    const startFallbackWatch = () => {
      if (cancelled) return
      // If we already have readings from fast cache, keep it
      if (readings.length > 0) return

      // Attempt low accuracy / cached fix
      navigator.geolocation.getCurrentPosition(
        (pos) => handlePosition(pos),
        (err) => {
          if (cancelled) return
          if (err.code === err.PERMISSION_DENIED) {
            setState({ kind: 'denied' })
          } else if (readings.length === 0) {
            if (autoRetriesLeft > 0) {
              autoRetriesLeft--
              setState({ kind: 'checking' })
              retryTimeoutId = setTimeout(startPipeline, 2500)
            } else {
              setState({ kind: 'unavailable' })
            }
          }
        },
        { enableHighAccuracy: false, timeout: 12_000, maximumAge: 300_000 },
      )

      // And keep watching with enableHighAccuracy: false
      watchId = navigator.geolocation.watchPosition(
        (pos) => handlePosition(pos),
        (err) => {
          if (cancelled) return
          if (err.code === err.PERMISSION_DENIED) {
            setState({ kind: 'denied' })
          } else if (readings.length === 0 && autoRetriesLeft <= 0) {
            setState({ kind: 'unavailable' })
          }
        },
        { enableHighAccuracy: false, timeout: 20_000, maximumAge: 60_000 },
      )
    }

    const startPipeline = () => {
      if (cancelled) return
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
        watchId = null
      }

      // Step 1: Fast cached / network fix (typically < 300ms)
      navigator.geolocation.getCurrentPosition(
        (pos) => handlePosition(pos),
        (err) => {
          if (cancelled) return
          if (err.code === err.PERMISSION_DENIED) {
            setState({ kind: 'denied' })
          }
          // Do not fail here on timeout/unavailable; let the watch handle it
        },
        { enableHighAccuracy: false, timeout: 6_000, maximumAge: 120_000 },
      )

      // Step 2: High accuracy refinement watch
      watchId = navigator.geolocation.watchPosition(
        (pos) => handlePosition(pos),
        (err) => {
          if (cancelled) return
          if (err.code === err.PERMISSION_DENIED) {
            setState({ kind: 'denied' })
            return
          }
          // If high accuracy fails/times out and we have no fix yet, downgrade gracefully
          if (readings.length === 0) {
            if (watchId !== null) {
              navigator.geolocation.clearWatch(watchId)
              watchId = null
            }
            startFallbackWatch()
          }
        },
        { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 },
      )
    }

    // React automatically to browser permission status changes (e.g., user just clicked Allow)
    if (typeof navigator !== 'undefined' && 'permissions' in navigator && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((permissionStatus) => {
          if (cancelled) return
          permissionStatus.onchange = () => {
            if (cancelled) return
            if (permissionStatus.state === 'granted') {
              startPipeline()
            } else if (permissionStatus.state === 'denied') {
              setState({ kind: 'denied' })
            }
          }
        })
        .catch(() => {})
    }

    startPipeline()

    return () => {
      cancelled = true
      if (watchId !== null) navigator.geolocation.clearWatch(watchId)
      if (retryTimeoutId !== null) clearTimeout(retryTimeoutId)
    }
  }, [key, retryNonce])

  return {
    state,
    allowed: state.kind === 'off' || state.kind === 'inside',
    message: messageFor(state, active),
    fix: 'fix' in state ? state.fix : null,
    retry,
    isChecking: state.kind === 'checking',
  }
}
