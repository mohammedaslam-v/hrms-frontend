import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { profileApi } from '../profile.api'

/** How long the reminder stays on screen each visit. */
const VISIBLE_MS = 5_000

/**
 * "Save your home location" — shown for 5 seconds on every visit to the HRMS
 * until the employee has saved one. Only WFO and WFH are asked: their check-in
 * geofence uses it (WFH: their only place; WFO: their second, after the office).
 *
 * Asks the server once per visit rather than reading the whole profile, and
 * stays silent if that call fails — a reminder is never worth an error.
 */
export function HomeLocationReminder() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let alive = true
    let timer: ReturnType<typeof setTimeout> | undefined
    profileApi
      .getHomeLocationStatus()
      .then((status) => {
        if (!alive || !status.required || status.saved) return
        setVisible(true)
        timer = setTimeout(() => setVisible(false), VISIBLE_MS)
      })
      .catch(() => {
        // Older server or a blip: no reminder this visit.
      })
    return () => {
      alive = false
      if (timer) clearTimeout(timer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className="notice"
      role="alert"
      style={{
        position: 'fixed',
        top: 70,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 80,
        width: 'min(560px, calc(100vw - 32px))',
        boxShadow: '0 12px 32px rgba(24, 19, 13, 0.18)',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        fontSize: 13,
      }}
    >
      <span style={{ flex: 1, lineHeight: 1.45 }}>
        📍 <b>Add your home location.</b> It is needed for check-in. Go to{' '}
        <b>My page → Edit personal details → Home location</b> and save it while you are at
        home. You can set it only once.
      </span>
      <button
        type="button"
        className="btn primary sm"
        onClick={() => {
          setVisible(false)
          navigate('/me?edit=personal')
        }}
        style={{ whiteSpace: 'nowrap' }}
      >
        Set it now
      </button>
      <button
        type="button"
        className="x"
        aria-label="Dismiss"
        onClick={() => setVisible(false)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}
      >
        ✕
      </button>
    </div>
  )
}
