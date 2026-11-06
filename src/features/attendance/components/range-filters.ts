import { MONTHS } from '../../../shared/lib/date'

/*
 * Date-range helpers shared by the Active time and Activities tabs, so both
 * offer the same presets and print times the same way.
 */

export type Preset = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom'

export const PRESETS: { key: Preset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'thisWeek', label: 'This week' },
  { key: 'lastWeek', label: 'Last week' },
  { key: 'thisMonth', label: 'This month' },
  { key: 'lastMonth', label: 'Last month' },
  { key: 'custom', label: 'Custom range' },
]

/** The server refuses more; about two months stays readable on screen. */
export const MAX_DAYS = 62
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Local calendar date as YYYY-MM-DD (toISOString would shift it to UTC). */
const iso = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function rangeOf(preset: Exclude<Preset, 'custom'>): { from: string; to: string } {
  const now = new Date()
  const day = (offset: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
  const sinceMonday = (now.getDay() + 6) % 7
  switch (preset) {
    case 'today':
      return { from: iso(now), to: iso(now) }
    case 'yesterday':
      return { from: iso(day(-1)), to: iso(day(-1)) }
    case 'thisWeek':
      return { from: iso(day(-sinceMonday)), to: iso(now) }
    case 'lastWeek':
      return { from: iso(day(-sinceMonday - 7)), to: iso(day(-sinceMonday - 1)) }
    case 'thisMonth':
      return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(now) }
    case 'lastMonth':
      return {
        from: iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: iso(new Date(now.getFullYear(), now.getMonth(), 0)),
      }
  }
}

export const daysBetween = (from: string, to: string): number =>
  Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1

/** Why a range cannot be loaded, or null when it can. */
export function rangeProblemOf(range: { from: string; to: string }): string | null {
  if (!range.from || !range.to) return 'Choose both dates.'
  const span = daysBetween(range.from, range.to)
  if (span < 1) return 'The end date must be on or after the start date.'
  if (span > MAX_DAYS) return `Choose at most ${MAX_DAYS} days.`
  return null
}

export const dayHead = (date: string) => {
  const [y, m, d] = date.split('-').map(Number)
  return { name: DAY_NAMES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()], label: `${d} ${MONTHS[m - 1]}` }
}

/** "6h 12m", "45m", "0m". */
export const hm = (minutes: number): string => {
  const m = Math.max(0, Math.round(minutes))
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`
}

export const csvCell = (v: string | number): string => {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Saves CSV lines as a file. A BOM so Excel reads names in other scripts correctly. */
export function saveCsv(lines: string[], filename: string): void {
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
