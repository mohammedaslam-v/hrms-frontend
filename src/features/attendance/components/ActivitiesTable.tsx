import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { attendanceApi } from '../attendance.api'
import type { ActivitiesView, ActivityDayRow, ActivityItem } from '../attendance.types'
import { ACTIVITY_LABEL } from '../../work-activity'
import { MultiSelectDropdown, SelectDropdown } from '../../../shared/ui/MultiSelectDropdown'
import { PRESETS, csvCell, dayHead, hm, rangeOf, rangeProblemOf, saveCsv, type Preset } from './range-filters'
import './active-time.css'

/*
 * Attendance & activity → Activities.
 *
 * One row per person per day: panel time, the total of the activities they
 * recorded, then each activity — what it was, its note, from–to and length.
 * A day appears if it has an activity or panel time; a weekly off or holiday
 * says so under the date.
 *
 * Who appears is decided by the server: an admin sees everyone; a manager
 * their direct reports, plus Sales/Operations people two levels down.
 */

const activityLine = (a: ActivityItem): string =>
  `${ACTIVITY_LABEL[a.type]}${a.note ? ` – ${a.note}` : ''}`

function downloadCsv(view: ActivitiesView, columns: number) {
  const header = [
    'Date', 'Day', 'Day off', 'Employee code', 'Employee', 'Department',
    'Panel time', 'Panel (minutes)', 'Activities total', 'Activities (minutes)',
  ]
  for (let i = 1; i <= columns; i++) {
    header.push(`Activity ${i}`, `Activity ${i} from`, `Activity ${i} to`, `Activity ${i} time`)
  }
  const lines = [header.join(',')]
  for (const row of view.rows) {
    const cells: (string | number)[] = [
      row.date,
      dayHead(row.date).name,
      row.dayOff ?? '',
      row.code,
      row.name,
      row.department ?? '',
      hm(row.panelSeconds / 60),
      Math.round(row.panelSeconds / 60),
      hm(row.activityMinutes),
      row.activityMinutes,
    ]
    for (let i = 0; i < columns; i++) {
      const a = row.activities[i]
      cells.push(...(a ? [activityLine(a), a.startTime, a.endTime, hm(a.minutes)] : ['', '', '', '']))
    }
    lines.push(cells.map(csvCell).join(','))
  }
  saveCsv(lines, `activities_${view.from}_to_${view.to}.csv`)
}

export function ActivitiesTable() {
  const navigate = useNavigate()
  const [preset, setPreset] = useState<Preset>('thisWeek')
  const [range, setRange] = useState(() => rangeOf('thisWeek'))
  const [employeeIds, setEmployeeIds] = useState<number[]>([])
  const [department, setDepartment] = useState('')
  const [view, setView] = useState<ActivitiesView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const rangeProblem = rangeProblemOf(range)

  useEffect(() => {
    if (rangeProblem) return
    let live = true
    // oxlint-disable-next-line react/set-state-in-effect
    setLoading(true)
    attendanceApi
      .getActivities({ from: range.from, to: range.to, employeeIds, department: department || undefined })
      .then((v) => {
        if (!live) return
        setView(v)
        setError(null)
      })
      .catch((err) => live && setError(err instanceof Error ? err.message : 'Could not load activities.'))
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

  // As many Activity columns as the busiest day needs.
  const columns = useMemo(() => Math.max(1, ...(view?.rows ?? []).map((r) => r.activities.length)), [view])
  const summary = useMemo(() => {
    const rows = view?.rows ?? []
    return {
      panel: rows.reduce((s, r) => s + r.panelSeconds, 0),
      activity: rows.reduce((s, r) => s + r.activityMinutes, 0),
      count: rows.reduce((s, r) => s + r.activities.length, 0),
    }
  }, [view])

  return (
    <div className="at">
      <div className="card at-bar">
        <div className="at-filters">
          <div className="f at-f">
            <label htmlFor="acRange">Dates</label>
            <SelectDropdown
              id="acRange"
              value={preset}
              onChange={choosePreset}
              options={PRESETS.map((p) => ({ value: p.key, label: p.label }))}
            />
          </div>
          <div className="f at-f at-dates">
            <label htmlFor="acFrom">From</label>
            <input
              id="acFrom"
              type="date"
              value={range.from}
              onChange={(e) => {
                setPreset('custom')
                setRange((r) => ({ ...r, from: e.target.value }))
              }}
            />
          </div>
          <div className="f at-f at-dates">
            <label htmlFor="acTo">To</label>
            <input
              id="acTo"
              type="date"
              value={range.to}
              onChange={(e) => {
                setPreset('custom')
                setRange((r) => ({ ...r, to: e.target.value }))
              }}
            />
          </div>
          <div className="f at-f at-people">
            <label htmlFor="acPeople">Employees</label>
            <MultiSelectDropdown
              id="acPeople"
              options={options}
              selected={employeeIds}
              onChange={setEmployeeIds}
              allLabel={people.length ? `Everyone (${options.length})` : 'Everyone'}
              noun="employees"
              searchPlaceholder="Search by name"
            />
          </div>
          <div className="f at-f">
            <label htmlFor="acDept">Department</label>
            <SelectDropdown
              id="acDept"
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
          onClick={() => view && downloadCsv(view, columns)}
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
            Loading activities…
          </div>
        </div>
      ) : view.rows.length === 0 ? (
        <div className="card">
          <div className="empty" style={{ padding: '36px 16px' }}>
            <b>Nothing recorded</b>
            <p style={{ marginTop: 6, color: 'var(--muted2)' }}>
              No panel time or activities in this range. Clear the filters above, or pick another range.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="at-meta">
            <span>
              {view.rows.length} {view.rows.length === 1 ? 'row' : 'rows'} · Panel <b>{hm(summary.panel / 60)}</b> ·{' '}
              {summary.count} {summary.count === 1 ? 'activity' : 'activities'} <b>{hm(summary.activity)}</b>
            </span>
          </div>
          <div className={`card at-card${loading ? ' is-loading' : ''}`}>
            <div className="at-scroll">
              <table className="at-grid ac-grid">
                <thead>
                  <tr>
                    <th className="ac-date-h">Date</th>
                    <th className="at-name-h">Name</th>
                    <th>Panel time</th>
                    <th className="at-total-h">Activities total</th>
                    {Array.from({ length: columns }, (_, i) => (
                      <th key={i} className="ac-act-h">
                        Activity {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {view.rows.map((row) => (
                    <DayRow
                      key={`${row.employeeId}|${row.date}`}
                      row={row}
                      columns={columns}
                      onOpen={() => navigate(`/me/${row.employeeId}`)}
                    />
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

function DayRow({ row, columns, onOpen }: { row: ActivityDayRow; columns: number; onOpen: () => void }) {
  const h = dayHead(row.date)
  return (
    <tr className="at-panel">
      <td className="ac-date">
        <b>{h.label}</b>
        <small>{h.name}</small>
        {row.dayOff && <small className="ac-off">{row.dayOff}</small>}
      </td>
      <th scope="row" className="at-name">
        <button type="button" onClick={onOpen} title="Open profile">
          {row.name}
        </button>
        <small>
          {row.code}
          {row.department ? ` · ${row.department}` : ''}
        </small>
      </th>
      <td>{hm(row.panelSeconds / 60)}</td>
      <td className="at-total">{row.activities.length ? hm(row.activityMinutes) : '—'}</td>
      {Array.from({ length: columns }, (_, i) => {
        const a = row.activities[i]
        return (
          <td key={i} className="ac-act">
            {a ? (
              <>
                <b>{ACTIVITY_LABEL[a.type]}</b>
                {a.note && <span className="ac-note">{a.note}</span>}
                <small>
                  {a.startTime}–{a.endTime} · {hm(a.minutes)}
                </small>
              </>
            ) : null}
          </td>
        )
      })}
    </tr>
  )
}
