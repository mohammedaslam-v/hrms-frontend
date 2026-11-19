import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '../../shared/ui/Modal'
import { teamApi } from './team.api'
import type { EmployeeLocations } from './team.types'

/**
 * The admin's Locations popup, opened from the Team directory.
 *
 * Two places, each with its own switch: a place counts for check-in only while
 * its switch is on. Switching off keeps the saved point, so switching back on
 * restores it. With both off, a WFH employee is not location-checked at all.
 * For WFO the office always counts on top — enforced on the server, stated here.
 */
interface LocationsModalProps {
  employeeId: number
  employeeName: string
  onClose: () => void
}

const asText = (n: number | undefined) => (n === undefined ? '' : String(n))

/** A sliding on/off switch in the portal's colours. */
function Switch({
  on,
  onChange,
  label,
}: {
  on: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      style={{
        position: 'relative',
        width: 40,
        height: 22,
        flexShrink: 0,
        padding: 0,
        border: 'none',
        borderRadius: 999,
        cursor: 'pointer',
        background: on ? 'var(--blue)' : '#d6d0c6',
        transition: 'background 0.15s ease',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: on ? 21 : 3,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
          transition: 'left 0.15s ease',
        }}
      />
    </button>
  )
}

/** One place: title and switch on a line, coordinates and map link below. */
function LocationSection({
  idPrefix,
  title,
  caption,
  on,
  onToggle,
  lat,
  lng,
  onLat,
  onLng,
  savedNote,
  missing = false,
}: {
  idPrefix: string
  title: string
  caption: string
  on: boolean
  onToggle: (next: boolean) => void
  lat: string
  lng: string
  onLat: (v: string) => void
  onLng: (v: string) => void
  savedNote?: string | null
  /** Shown after a Save attempt with this place on and a field empty. */
  missing?: boolean
}) {
  const hasPoint = lat.trim() !== '' && lng.trim() !== ''
  const redIf = (empty: boolean) =>
    missing && empty ? { borderColor: 'var(--red)', boxShadow: '0 0 0 3px rgba(220, 62, 67, 0.12)' } : undefined

  return (
    <section
      style={{
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: '14px 16px',
        background: on ? '#fff' : 'var(--panel)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{title}</div>
          <div style={{ fontSize: 12, color: 'var(--muted2)', marginTop: 2 }}>
            {on ? caption : 'Off — not used for check-in'}
          </div>
        </div>
        <Switch on={on} onChange={onToggle} label={`${title} ${on ? 'on' : 'off'}`} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginTop: 12,
          opacity: on ? 1 : 0.55,
        }}
      >
        <div>
          <label htmlFor={`${idPrefix}Lat`}>Latitude</label>
          <input
            id={`${idPrefix}Lat`}
            inputMode="decimal"
            placeholder="12.910486"
            value={lat}
            onChange={(e) => onLat(e.target.value)}
            disabled={!on}
            aria-invalid={missing && !lat.trim()}
            style={redIf(!lat.trim())}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}Lng`}>Longitude</label>
          <input
            id={`${idPrefix}Lng`}
            inputMode="decimal"
            placeholder="77.648218"
            value={lng}
            onChange={(e) => onLng(e.target.value)}
            disabled={!on}
            aria-invalid={missing && !lng.trim()}
            style={redIf(!lng.trim())}
          />
        </div>
      </div>

      {missing && (
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--red)' }}>
          Enter both latitude and longitude, or switch this location off.
        </div>
      )}

      {(hasPoint || savedNote) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
            marginTop: 8,
            fontSize: 12,
          }}
        >
          {hasPoint ? (
            <a
              href={`https://www.google.com/maps?q=${encodeURIComponent(lat.trim())},${encodeURIComponent(lng.trim())}`}
              target="_blank"
              rel="noreferrer"
              style={{ fontWeight: 600 }}
            >
              View on map ↗
            </a>
          ) : (
            <span />
          )}
          {savedNote && <span style={{ color: 'var(--muted2)' }}>{savedNote}</span>}
        </div>
      )}
    </section>
  )
}

/** "Saved 23 Oct by Sajan Tomar" for a place that has been saved. */
const savedNoteOf = (place: EmployeeLocations['home']) =>
  place?.setAt ? `Saved ${place.setAt.slice(0, 10)}${place.setByName ? ` by ${place.setByName}` : ''}` : null

export function LocationsModal({ employeeId, employeeName, onClose }: LocationsModalProps) {
  const [loaded, setLoaded] = useState<EmployeeLocations | null>(null)
  const [homeOn, setHomeOn] = useState(true)
  const [homeLat, setHomeLat] = useState('')
  const [homeLng, setHomeLng] = useState('')
  const [secondOn, setSecondOn] = useState(false)
  const [secondLat, setSecondLat] = useState('')
  const [secondLng, setSecondLng] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Field highlighting starts only after the first Save attempt.
  const [attempted, setAttempted] = useState(false)

  useEffect(() => {
    let alive = true
    teamApi
      .getLocations(employeeId)
      .then((data) => {
        if (!alive) return
        setLoaded(data)
        // Shown "on" only when it actually counts: switched on AND saved. An
        // empty first location opens switched off, so nothing looks set that isn't.
        setHomeOn(data.homeEnabled && data.home !== null)
        setHomeLat(asText(data.home?.lat))
        setHomeLng(asText(data.home?.lng))
        setSecondOn(data.secondEnabled && data.second !== null)
        setSecondLat(asText(data.second?.lat))
        setSecondLng(asText(data.second?.lng))
      })
      .catch((err: unknown) => {
        if (alive) setError(err instanceof Error ? err.message : 'Could not load the locations.')
      })
    return () => {
      alive = false
    }
  }, [employeeId])

  const pointOf = (lat: string, lng: string) =>
    lat.trim() || lng.trim() ? { lat: lat.trim(), lng: lng.trim() } : null

  // A switched-on place must have both numbers — an "on" place with nowhere on
  // the map would block a WFH employee from checking in at all.
  const incomplete = (on: boolean, lat: string, lng: string) => on && (!lat.trim() || !lng.trim())
  const homeMissing = incomplete(homeOn, homeLat, homeLng)
  const secondMissing = incomplete(secondOn, secondLat, secondLng)

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setAttempted(true)
    if (homeMissing || secondMissing) {
      setError(
        homeMissing && secondMissing
          ? 'Enter coordinates for both locations, or switch them off.'
          : `Enter the ${homeMissing ? 'first' : 'second'} location’s latitude and longitude, or switch it off.`,
      )
      return
    }
    setBusy(true)
    try {
      await teamApi.saveLocations(employeeId, {
        homeEnabled: homeOn,
        home: pointOf(homeLat, homeLng),
        secondEnabled: secondOn,
        second: pointOf(secondLat, secondLng),
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the locations.')
    } finally {
      setBusy(false)
    }
  }

  // What check-in will allow once saved, in one line — so the admin sees the
  // effect of the switches before pressing Save.
  // A place counts only when it is switched on AND has both numbers.
  const counts = (on: boolean, lat: string, lng: string) => on && lat.trim() !== '' && lng.trim() !== ''
  const places = [
    loaded?.officeAlwaysAllowed ? 'Office' : null,
    counts(homeOn, homeLat, homeLng) ? 'First location' : null,
    counts(secondOn, secondLat, secondLng) ? 'Second location' : null,
  ].filter(Boolean)
  const summary =
    loaded?.workMode === 'Hybrid'
      ? 'Hybrid employees are not location-checked.'
      : places.length > 0
        ? `Check-in allowed at: ${places.join(' · ')}`
        : homeMissing || secondMissing
          ? 'Fill in the coordinates for each location that is switched on.'
          : 'No location check — can check in from anywhere.'

  return (
    <Modal
      title="Check-in locations"
      onClose={onClose}
      onSubmit={save}
      error={error}
      busy={busy}
      maxWidth={520}
      confirm={
        <button className="btn primary" type="submit" disabled={busy || !loaded}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      }
    >
      {!loaded ? (
        !error && <div className="empty">Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink2)' }}>
            <b>{employeeName}</b>
            <span className="chip c-all nodot">{loaded.workMode}</span>
          </div>

          {/* Today's real state for a WFH employee with nothing saved: the
              default rule blocks them until a first location exists. Saving
              this popup replaces that with whatever the switches say. */}
          {loaded.workMode === 'WFH' && loaded.homeEnabled && !loaded.home && (
            <div className="notice" style={{ fontSize: 12.5 }}>
              No first location is saved, so <b>{employeeName} cannot check in right now</b>. Add
              one below, or save with both locations off to let them check in from anywhere.
            </div>
          )}

          {loaded.officeAlwaysAllowed && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid var(--line)',
                borderRadius: 14,
                padding: '12px 16px',
                background: 'var(--panel)',
                fontSize: 13,
              }}
            >
              <span>
                <b>Office</b>
                <span style={{ color: 'var(--muted2)' }}> · always allowed for WFO</span>
              </span>
              <span className="chip c-in nodot">Always on</span>
            </div>
          )}

          <LocationSection
            idPrefix="adminHome"
            title="First location"
            caption="Usually the employee's home"
            on={homeOn}
            onToggle={setHomeOn}
            lat={homeLat}
            lng={homeLng}
            onLat={setHomeLat}
            onLng={setHomeLng}
            savedNote={savedNoteOf(loaded.home)}
            missing={attempted && homeMissing}
          />

          <LocationSection
            idPrefix="adminSecond"
            title="Second location"
            caption="Any other place they may check in from"
            on={secondOn}
            onToggle={setSecondOn}
            lat={secondLat}
            lng={secondLng}
            onLat={setSecondLat}
            onLng={setSecondLng}
            savedNote={savedNoteOf(loaded.second)}
            missing={attempted && secondMissing}
          />

          <div style={{ fontSize: 12.5, color: 'var(--muted2)' }}>{summary}</div>
        </div>
      )}
    </Modal>
  )
}
