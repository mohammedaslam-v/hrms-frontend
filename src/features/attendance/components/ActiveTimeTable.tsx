import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { attendanceApi } from '../attendance.api'
import type { ActiveTimeDay, ActiveTimeRow, ActiveTimeView } from '../attendance.types'
import { MultiSelectDropdown, SelectDropdown } from '../../../shared/ui/MultiSelectDropdown'
import { MONTHS } from '../../../shared/lib/date'
import './active-time.css'

/*
 * Attendance & activity → Active time.
 *
 * Per person, per day, two figures:
 *   Panel — time actively used on the Bambinos panels (every tracked panel);
 *   Shift — time checked in, or the day's status where there were no working
 *           hours (Leave, Weekly off, Holiday, Absent).
 *
 * Who appears is decided by the server: an admin sees the whole company, a
 * manager their reporting tree. Picking nobody in Employees means everyone.
 */

type Preset = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom'

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'thisWeek', label: 'This week' },
  { key: 'lastWeek', label: 'Last week' },
  { key: 'thisMonth', label: 'This month' },
  { key: 'lastMonth', label: 'Last month' },
  { key: 'custom', label: 'Custom range' },
]

/** The server refuses more; about two months stays readable on screen. */
const MAX_DAYS = 62
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Local calendar date as YYYY-MM-DD (toISOString would shift it to UTC). */
const iso = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function rangeOf(preset: Exclude<Preset, 'custom'>): { from: string; to: string } {
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

const daysBetween = (from: string, to: string): number =>
  Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1

const dayHead = (date: string) => {
  const [y, m, d] = date.split('-').map(Number)
  return { name: DAY_NAMES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()], label: `${d} ${MONTHS[m - 1]}` }
}

/** "6h 12m", "45m", "0m". */
const hm = (minutes: number): string => {
  const m = Math.max(0, Math.round(minutes))
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`
}

/** What the Shift line says, and how it is coloured. */
function shiftCell(day: ActiveTimeDay, today: string): { text: string; tone: string; title?: string } {
  if (day.status === null) return { text: '—', tone: 'none', title: 'Not with the company on this date' }
  if (day.date > today) return { text: '—', tone: 'none' }
  switch (day.status) {
    case 'Leave':
      return { text: 'Leave', tone: 'leave' }
    case 'Weekly off':
      return { text: 'Weekly off', tone: 'off' }
    case 'Holiday':
      return { text: 'Holiday', tone: 'off' }
    case 'No login':
      return { text: 'Absent', tone: 'absent', title: 'A working day with no check-in' }
    case 'Not in yet':
      return { text: 'Not in yet', tone: 'none' }
    case 'Half day':
      return { text: day.shiftMinutes > 0 ? `Half day · ${hm(day.shiftMinutes)}` : 'Half day', tone: 'half' }
    case 'Late':
      return { text: hm(day.shiftMinutes), tone: 'late', title: 'Checked in late' }
    default:
      return { text: hm(day.shiftMinutes), tone: 'work' }
  }
}

/** A light green wash that deepens with panel time, full at 8 hours. */
const heat = (seconds: number): string | undefined =>
  seconds >= 60 ? `rgba(15, 169, 104, ${(Math.min(1, seconds / 28_800) * 0.22 + 0.04).toFixed(3)})` : undefined

const csvCell = (v: string | number): string => {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function downloadCsv(view: ActiveTimeView) {
  const header = [
    'Date', 'Day', 'Employee code', 'Employee', 'Department', 'Shift hours',
    'Panel active time', 'Panel active (minutes)', 'Shift status', 'Checked-in time', 'Checked-in (minutes)',
  ]
  const lines = [header.join(',')]
  for (const row of view.rows) {
    for (const day of row.days) {
      const shift = shiftCell(day, view.today)
      const panelMin = Math.round(day.panelSeconds / 60)
      lines.push(
        [
          day.date,
          dayHead(day.date).name,
          row.code,
          row.name,
          row.department ?? '',
          `${row.shiftStart}-${row.shiftEnd}`,
          day.date > view.today ? '' : hm(panelMin),
          day.date > view.today ? '' : panelMin,
          day.status === null ? 'Not employed' : day.date > view.today ? '' : day.status === 'No login' ? 'Absent' : day.status,
          shift.tone === 'work' || shift.tone === 'late' || shift.tone === 'half' ? hm(day.shiftMinutes) : '',
          shift.tone === 'work' || shift.tone === 'late' || shift.tone === 'half' ? day.shiftMinutes : '',
        ]
          .map(csvCell)
          .join(','),
      )
    }
  }
  // A BOM so Excel reads names in other scripts correctly.
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `active_time_${view.from}_to_${view.to}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ActiveTimeTable() {
  const navigate = useNavigate()
  const [preset, setPreset] = useState<Preset>('thisWeek')
  const [range, setRange] = useState(() => rangeOf('thisWeek'))
  const [employeeIds, setEmployeeIds] = useState<number[]>([])
  const [department, setDepartment] = useState('')
  const [view, setView] = useState<ActiveTimeView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const span = daysBetween(range.from, range.to)
  const rangeProblem =
    !range.from || !range.to
      ? 'Choose both dates.'
      : span < 1
        ? 'The end date must be on or after the start date.'
        : span > MAX_DAYS
          ? `Choose at most ${MAX_DAYS} days.`
          : null

  useEffect(() => {
    if (rangeProblem) return
    let live = true
    // oxlint-disable-next-line react/set-state-in-effect
    setLoading(true)
    attendanceApi
      .getActiveTime({ from: range.from, to: range.to, employeeIds, department: department || undefined })
      .then((v) => {
        if (!live) return
        setView(v)
        setError(null)
      })
      .catch((err) => live && setError(err instanceof Error ? err.message : 'Could not load active time.'))
      .finally(() => live && setLoading(false))
    return () => {
      live = false
    }
  }, [range.from, range.to, employeeIds, department, rangeProblem])

  const people = useMemo(() => view?.people ?? [], [view])
  const departments = useMemo(
    () => [...new Set(people.map((p) => p.department).filter((d): d is string => Boolean(d)))].sort(),
    [people],
  )
  const options = useMemo(
    () =>
      people
        .filter((p) => !department || p.department === department)
        .map((p) => ({ value: p.id, label: p.name })),
    [people, department],
  )

  const choosePreset = (next: Preset) => {
    setPreset(next)
    if (next !== 'custom') setRange(rangeOf(next))
  }

  const totals = useMemo(() => {
    const rows = view?.rows ?? []
    return {
      panel: rows.reduce((s, r) => s + r.totals.panelSeconds, 0),
      shift: rows.reduce((s, r) => s + r.totals.shiftMinutes, 0),
    }
  }, [view])

  return (
    <div className="at">
      <div className="card at-bar">
        <div className="at-filters">
          <div className="f at-f">
            <label htmlFor="atRange">Dates</label>
            <SelectDropdown
              id="atRange"
              value={preset}
              onChange={choosePreset}
              options={PRESETS.map((p) => ({ value: p.key, label: p.label }))}
            />
          </div>
          <div className="f at-f at-dates">
            <label htmlFor="atFrom">From</label>
            <input
              id="atFrom"
              type="date"
              value={range.from}
              onChange={(e) => {
                setPreset('custom')
                setRange((r) => ({ ...r, from: e.target.value }))
              }}
            />
          </div>
          <div className="f at-f at-dates">
            <label htmlFor="atTo">To</label>
            <input
              id="atTo"
              type="date"
              value={range.to}
              onChange={(e) => {
                setPreset('custom')
                setRange((r) => ({ ...r, to: e.target.value }))
              }}
            />
          </div>
          <div className="f at-f at-people">
            <label htmlFor="atPeople">Employees</label>
            <MultiSelectDropdown
              id="atPeople"
              options={options}
              selected={employeeIds}
              onChange={setEmployeeIds}
              allLabel={people.length ? `Everyone (${options.length})` : 'Everyone'}
              noun="employees"
              searchPlaceholder="Search by name"
            />
          </div>
          <div className="f at-f">
            <label htmlFor="atDept">Department</label>
            <SelectDropdown
              id="atDept"
              value={department}
              onChange={(next) => {
                setDepartment(next)
                setEmployeeIds([])
              }}
              options={[{ value: '', label: 'All departments' }, ...departments.map((d) => ({ value: d, label: d }))]}
            />
          </div>
        </div>
        <button
          type="button"
          className="btn outline sm"
          onClick={() => view && downloadCsv(view)}
          disabled={!view || view.rows.length === 0 || loading}
        >
          Download CSV
        </button>
      </div>

      {rangeProblem ? (
        <div className="notice bad">{rangeProblem}</div>
      ) : error ? (
        <div className="notice bad" role="alert">
          {error}
        </div>
      ) : !view ? (
        <div className="card">
          <div className="empty" style={{ padding: '36px 16px' }}>
            Loading active time…
          </div>
        </div>
      ) : view.rows.length === 0 ? (
        <div className="card">
          <div className="empty" style={{ padding: '36px 16px' }}>
            <b>No one to show</b>
            <p style={{ marginTop: 6, color: 'var(--muted2)' }}>Clear the filters above, or pick another range.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="at-meta">
            <span>
              {view.rows.length} {view.rows.length === 1 ? 'person' : 'people'} · {view.dates.length}{' '}
              {view.dates.length === 1 ? 'day' : 'days'} · Panel <b>{hm(totals.panel / 60)}</b> · Shift{' '}
              <b>{hm(totals.shift)}</b>
            </span>
            <span className="at-key">
              <i className="k-panel" /> Panel = active on Bambinos panels <i className="k-shift" /> Shift = checked in
            </span>
          </div>
          <div className={`card at-card${loading ? ' is-loading' : ''}`}>
            <div className="at-scroll">
              <table className="at-grid">
                <thead>
                  <tr>
                    <th className="at-name-h">Employee</th>
                    <th className="at-kind-h" aria-label="Measure" />
                    {view.dates.map((d) => {
                      const h = dayHead(d)
                      return (
                        <th key={d} className={d === view.today ? 'is-today' : undefined}>
                          <span>{h.name}</span>
                          {h.label}
                        </th>
                      )
                    })}
                    <th className="at-total-h">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {view.rows.map((row) => (
                    <PersonRows key={row.employeeId} row={row} today={view.today} onOpen={() => navigate(`/me/${row.employeeId}`)} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function PersonRows({ row, today, onOpen }: { row: ActiveTimeRow; today: string; onOpen: () => void }) {
  return (
    <>
      <tr className="at-panel">
        <th rowSpan={2} scope="rowgroup" className="at-name">
          <button type="button" onClick={onOpen} title="Open profile">
            {row.name}
          </button>
          <small>
            {row.code} · {row.shiftStart}–{row.shiftEnd}
          </small>
        </th>
        <td className="at-kind">Panel</td>
        {row.days.map((d) => (
          <td key={d.date} style={{ background: d.date > today ? undefined : heat(d.panelSeconds) }}>
            {d.date > today || d.status === null ? '—' : hm(d.panelSeconds / 60)}
          </td>
        ))}
        <td className="at-total">{hm(row.totals.panelSeconds / 60)}</td>
      </tr>
      <tr className="at-shift">
        <td className="at-kind">Shift</td>
        {row.days.map((d) => {
          const c = shiftCell(d, today)
          return (
            <td key={d.date} className={`t-${c.tone}`} title={c.title}>
              {c.text}
            </td>
          )
        })}
        <td className="at-total">{hm(row.totals.shiftMinutes)}</td>
      </tr>
    </>
  )
}
