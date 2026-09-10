/**
 * The rail's icons — one 24×24 line drawing per nav entry, traced from the
 * approved design.
 *
 * They live apart from the item list because they are the bulk of it and none of
 * the meaning: with the paths inline, the shape of the navigation was buried
 * under two hundred lines of `<path d="…">`. Named for what they depict rather
 * than for where they are used, so two entries can share one drawing.
 */

import type { ReactNode } from 'react'

const svg = (paths: ReactNode) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {paths}
  </svg>
)

export const calendarTick = svg(
  <>
    <rect x="3" y="5" width="18" height="16" rx="3.2" />
    <path d="M3 10h18M8 3v4M16 3v4M8.8 15.2l2.2 2.2 4.2-4.2" />
  </>,
)

export const calendar = svg(
  <>
    <rect x="3" y="5" width="18" height="16" rx="3.2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </>,
)

export const target = svg(
  <>
    <circle cx="12" cy="12" r="8.6" />
    <circle cx="12" cy="12" r="4.6" />
    <circle cx="12" cy="12" r=".9" fill="currentColor" />
  </>,
)

export const crosshair = svg(
  <>
    <path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3" />
    <circle cx="12" cy="12" r="5.2" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </>,
)

export const wallet = svg(
  <>
    <path d="M20 8.5V6.6A2.6 2.6 0 0 0 17.4 4H6.6A2.6 2.6 0 0 0 4 6.6v10.8A2.6 2.6 0 0 0 6.6 20h10.8a2.6 2.6 0 0 0 2.6-2.6V15.5" />
    <path d="M21.2 8.5h-4.4a3.5 3.5 0 0 0 0 7h4.4z" />
  </>,
)

export const percent = svg(
  <>
    <path d="M19 5L5 19" />
    <circle cx="7.6" cy="7.6" r="2.6" />
    <circle cx="16.4" cy="16.4" r="2.6" />
  </>,
)

export const person = svg(
  <>
    <circle cx="12" cy="8.2" r="3.7" />
    <path d="M4.6 20a7.4 7.4 0 0 1 14.8 0" />
  </>,
)

export const people = svg(
  <>
    <path d="M16 19.5v-1.6a4 4 0 0 0-4-4H6.5a4 4 0 0 0-4 4v1.6" />
    <circle cx="9.2" cy="7.2" r="3.3" />
    <path d="M17.2 13.9a4 4 0 0 1 3 3.9v1.7" />
    <path d="M15.6 4.3a3.3 3.3 0 0 1 0 5.9" />
  </>,
)

export const personPlus = svg(
  <>
    <path d="M14.5 19.5v-1.6a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1.6" />
    <circle cx="8.2" cy="7.2" r="3.3" />
    <path d="M18.5 7.5v6M15.5 10.5h6" />
  </>,
)

export const clock = svg(
  <>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 7.2V12l3.2 1.9" />
  </>,
)

export const barChart = svg(
  <>
    <path d="M4 20h16" />
    <rect x="5" y="10.5" width="3.6" height="6.5" rx="1.2" />
    <rect x="10.2" y="6.5" width="3.6" height="10.5" rx="1.2" />
    <rect x="15.4" y="13" width="3.6" height="4" rx="1.2" />
  </>,
)

export const tiles = svg(
  <>
    <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
  </>,
)

export const banknote = svg(
  <>
    <rect x="2.5" y="5.5" width="19" height="13" rx="2.6" />
    <circle cx="12" cy="12" r="2.7" />
    <path d="M6 9.6v4.8M18 9.6v4.8" />
  </>,
)

export const receipt = svg(
  <>
    <path d="M7 3.5h10a2 2 0 0 1 2 2v15l-3-2-2 2-2-2-2 2-2-2-3 2v-15a2 2 0 0 1 2-2z" />
    <path d="M9.5 8.5h5M9.5 12h5" />
  </>,
)
