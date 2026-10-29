import { useState, type CSSProperties, type ReactNode } from 'react'
import type { HomeLocation } from '../profile.types'

/**
 * One saved check-in place in Edit personal details — home, or the second
 * location HR switched on. Same rules for both: the employee may save it once,
 * then it is locked and only HR can change or clear it.
 */
interface LocationFieldsProps {
  /** Unique per section: "home" or "second". Used for input ids. */
  idPrefix: string
  title: string
  /** What this place is for, shown to an employee who has not saved it yet. */
  employeeHint: ReactNode
  saved: HomeLocation | null | undefined
  locked: boolean
  isAdmin: boolean
  lat: string
  lng: string
  onLat: (value: string) => void
  onLng: (value: string) => void
  inputStyle: CSSProperties
  labelStyle: CSSProperties
  sectionHeaderStyle: CSSProperties
}

export function LocationFields({
  idPrefix,
  title,
  employeeHint,
  saved,
  locked,
  isAdmin,
  lat,
  lng,
  onLat,
  onLng,
  inputStyle,
  labelStyle,
  sectionHeaderStyle,
}: LocationFieldsProps) {
  const [locating, setLocating] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  /** Fills the two fields from this device — the easy way to save "here". */
  const fillFromCurrentLocation = () => {
    if (!('geolocation' in navigator) || !window.isSecureContext) {
      setNote('This browser cannot share your location. Enter the coordinates by hand.')
      return
    }
    setLocating(true)
    setNote(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLat(position.coords.latitude.toFixed(6))
        onLng(position.coords.longitude.toFixed(6))
        const accuracy = Math.round(position.coords.accuracy)
        setNote(
          accuracy > 50
            ? `Filled, but only accurate to ±${accuracy} m. For a better reading try from your phone, or near a window.`
            : `Filled from this device (accurate to ±${accuracy} m).`,
        )
        setLocating(false)
      },
      (err) => {
        setNote(
          err.code === err.PERMISSION_DENIED
            ? 'Location access is blocked for this site. Allow it in the browser, or enter the coordinates by hand.'
            : 'Could not get your location. Turn on location services, or enter the coordinates by hand.',
        )
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
    )
  }

  const lockedStyle = locked ? { backgroundColor: 'var(--panel)' } : {}

  return (
    <>
      <div style={sectionHeaderStyle}>
        <span>{title}</span>
      </div>

      <div className="f" style={{ gridColumn: '1 / -1' }}>
        <div
          className={locked ? 'notice blue' : 'notice'}
          style={{ fontSize: 11.5, padding: '8px 12px', borderRadius: 8, lineHeight: 1.5 }}
        >
          {locked ? (
            <>
              Saved
              {saved?.setAt ? ` on ${saved.setAt.slice(0, 10)}` : ''}
              {saved?.setByName ? ` by ${saved.setByName}` : ''}. It can be set only once — ask HR if
              it needs to change.
            </>
          ) : isAdmin ? (
            <>
              HR can set, change or clear this at any time. Clearing it lets the employee save it
              again themselves.
            </>
          ) : (
            <>
              {employeeHint} Use “Use my current location” <b>while you are there</b>.{' '}
              <b>You can set it only once</b> — after that only HR can change it.
            </>
          )}
        </div>
      </div>

      <div className="f">
        <label htmlFor={`${idPrefix}Lat`} style={labelStyle}>
          Latitude
        </label>
        <input
          id={`${idPrefix}Lat`}
          type="text"
          inputMode="decimal"
          placeholder="e.g. 12.910486"
          value={lat}
          onChange={(e) => onLat(e.target.value)}
          disabled={locked}
          style={{ ...inputStyle, ...lockedStyle }}
        />
      </div>

      <div className="f">
        <label htmlFor={`${idPrefix}Lng`} style={labelStyle}>
          Longitude
        </label>
        <input
          id={`${idPrefix}Lng`}
          type="text"
          inputMode="decimal"
          placeholder="e.g. 77.648218"
          value={lng}
          onChange={(e) => onLng(e.target.value)}
          disabled={locked}
          style={{ ...inputStyle, ...lockedStyle }}
        />
      </div>

      <div
        className="f"
        style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}
      >
        {!locked && (
          <button
            type="button"
            className="btn ghost sm"
            onClick={fillFromCurrentLocation}
            disabled={locating}
            style={{ height: 30, padding: '0 12px', fontSize: 12, borderRadius: 8 }}
          >
            {locating ? 'Finding you…' : '📍 Use my current location'}
          </button>
        )}
        {lat.trim() && lng.trim() && (
          <a
            href={`https://www.google.com/maps?q=${encodeURIComponent(lat.trim())},${encodeURIComponent(lng.trim())}`}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 12 }}
          >
            View on map ↗
          </a>
        )}
        {note && (
          <span className="hint" style={{ fontSize: 11.5, flexBasis: '100%' }}>
            {note}
          </span>
        )}
      </div>
    </>
  )
}
