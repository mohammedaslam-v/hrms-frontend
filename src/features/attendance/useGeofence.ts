import { useEffect, useState } from 'react'
import type { DeviceFix, GeofencePolicy, GeofenceZone, ZoneKind } from './attendance.types'

/**
 * Where the browser says this device is, judged against the places this person
 * may punch from — the office and/or their saved home location.
 *
 * The same rule the server applies (geofence.domain.ts in hrms-backend), so the
 * buttons grey out for exactly the punches the server would refuse. The server
 * still decides — this only spares the person a click that cannot succeed.
 *
 * Watches rather than reading once, so walking into the office turns the
 * buttons on without a refresh.
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

export const PLACE: Record<ZoneKind, string> = { office: 'the office', home: 'your home location' }

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
      return 'Checking your location… Allow location access if your browser asks.'
    case 'unsupported':
      return 'This browser cannot share your location, so check-in is unavailable here. Use Chrome, Safari or Edge, or check in from your phone.'
    case 'denied':
      return 'Location access is blocked for this site. Click the lock icon next to the website address → Site settings → Location → Allow, then refresh the page.'
    case 'unavailable':
      return 'Your device could not find its location. Turn on location services (and Wi-Fi on a laptop), then refresh the page.'
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

/**
 * Turns a stream of noisy GPS readings into a steady answer.
 *
 * A browser reports a new position every few seconds, each with its own ±
 * accuracy, and indoors that swings between ±15 m and ±150 m. Judging every
 * reading alone made the buttons flicker. Two rules stop it:
 *
 *   1. Best of the window — judge the MOST ACCURATE reading of the last minute,
 *      not the latest, so one bad reading cannot override a good one.
 *   2. Hysteresis — once a good reading puts you inside, only a CONFIDENT
 *      reading (precise enough) that is outside takes you out. Vague readings
 *      never do, for up to STICKY_MS. Like a thermostat that does not click on
 *      and off around one exact temperature.
 *
 * The fix this returns is the one the punch sends, so the server checks the
 * same reading the screen decided on.
 */
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

    // Lives for this watch only — a new policy starts a fresh history.
    let readings: Reading[] = []
    let lastInside: { state: GeofenceState; at: number } | null = null

    const id = navigator.geolocation.watchPosition(
      (position) => {
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
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setState({ kind: 'denied' })
        // A timeout keeps the last good reading if there was one; the watch
        // carries on and the next fix replaces it.
        else setState((prev) => ('fix' in prev ? prev : { kind: 'unavailable' }))
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [key])

  return {
    state,
    allowed: state.kind === 'off' || state.kind === 'inside',
    message: messageFor(state, active),
    fix: 'fix' in state ? state.fix : null,
  }
}
