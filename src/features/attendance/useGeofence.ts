import { useEffect, useState } from 'react'
import type { DeviceFix, Geofence } from './attendance.types'

/**
 * Where the browser says this device is, judged against the office geofence.
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
  | { kind: 'checking' }
  | { kind: 'unsupported' }
  | { kind: 'denied' }
  | { kind: 'unavailable' }
  | { kind: 'inaccurate' | 'outside' | 'inside'; fix: DeviceFix; distanceM: number }

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

function judge(fix: DeviceFix, fence: Geofence): GeofenceState {
  const distanceM = distanceMeters(fix, fence)
  if (fix.accuracy > fence.maxAccuracyM) return { kind: 'inaccurate', fix, distanceM }
  if (distanceM > fence.radiusM) return { kind: 'outside', fix, distanceM }
  return { kind: 'inside', fix, distanceM }
}

function messageFor(state: GeofenceState, fence: Geofence | null): string | null {
  switch (state.kind) {
    case 'off':
    case 'inside':
      return null
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
    case 'outside':
      return `You are ${formatDistance(state.distanceM)} from the office. Check-in and check-out are only allowed within ${fence?.radiusM ?? 0} m of the office.`
  }
}

export function useGeofence(fence: Geofence | null): GeofenceCheck {
  const [state, setState] = useState<GeofenceState>({ kind: fence ? 'checking' : 'off' })

  // Primitives, not the object: every Today reload brings a new fence object
  // with the same numbers, and restarting the watch each time would flicker.
  const lat = fence?.lat
  const lng = fence?.lng
  const radiusM = fence?.radiusM
  const maxAccuracyM = fence?.maxAccuracyM

  useEffect(() => {
    if (lat === undefined || lng === undefined || radiusM === undefined || maxAccuracyM === undefined) {
      // oxlint-disable-next-line react/set-state-in-effect
      setState({ kind: 'off' })
      return
    }
    // Browsers only offer location on HTTPS (and localhost).
    if (!('geolocation' in navigator) || !window.isSecureContext) {
      setState({ kind: 'unsupported' })
      return
    }

    const current: Geofence = { lat, lng, radiusM, maxAccuracyM }
    setState({ kind: 'checking' })

    const id = navigator.geolocation.watchPosition(
      (position) =>
        setState(
          judge(
            {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
            },
            current,
          ),
        ),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setState({ kind: 'denied' })
        // A timeout keeps the last good reading if there was one; the watch
        // carries on and the next fix replaces it.
        else setState((prev) => ('fix' in prev ? prev : { kind: 'unavailable' }))
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [lat, lng, radiusM, maxAccuracyM])

  return {
    state,
    allowed: state.kind === 'off' || state.kind === 'inside',
    message: messageFor(state, fence),
    fix: 'fix' in state ? state.fix : null,
  }
}
