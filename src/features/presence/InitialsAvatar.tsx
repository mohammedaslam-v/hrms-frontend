import type { PresenceStatus } from './presence.types'

// The new admin's avatar (admin-frontend InitialsAvatar.tsx): the same palette
// and the same name hash, so a person has the same colour in both headers.
const PALETTE = [
  '#2563eb', // blue-600
  '#7c3aed', // violet-600
  '#059669', // emerald-600
  '#f59e0b', // amber-500
  '#f43f5e', // rose-500
  '#0891b2', // cyan-600
  '#4f46e5', // indigo-600
  '#0d9488', // teal-600
  '#f97316', // orange-500
  '#c026d3', // fuchsia-600
]

const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  const first = parts[0][0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : ''
  return (first + last).toUpperCase()
}

// Same name -> same colour, every time, on every screen.
const colourFor = (name: string): string => {
  let h = 0
  for (const ch of name.trim().toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return PALETTE[h % PALETTE.length]
}

/** A small status dot on the corner: green = online, amber = idle, grey = logged out. */
export function InitialsAvatar({ name, dot }: { name: string; dot?: PresenceStatus }) {
  return (
    <span className="on-av" style={{ background: colourFor(name) }} aria-hidden="true">
      {initialsOf(name)}
      {dot ? <span className={`on-av-dot ${dot}`} /> : null}
    </span>
  )
}
