import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { attendanceApi } from '../attendance.api'
import type { ActivitiesView, ActivityDayRow, ActivityItem } from '../attendance.types'
import { ACTIVITY_LABEL } from '../../work-activity'
import { MultiSelectDropdown, SelectDropdown } from '../../../shared/ui/MultiSelectDropdown'
import { PRESETS, csvCell, dayHead, hm, rangeOf, rangeProblemOf, saveCsv, type Preset } from './range-filters'
import { deptColor } from '../../../shared/lib/departments'
import { initials } from '../../../shared/lib/format'
import { Pagination, usePage } from '../../../shared/ui/Pagination'
import './active-time.css'

/*
 * Attendance & activity → Activities.
 *
 * Shows active panel time and detailed work activities recorded by team members.
 * Structured with KPI metric cards, quick status filters, real-time search,
 * and high-density, accessible table rows conforming to the BConnect design system.
 */

type QuickFilter = 'all' | 'activities' | 'panel' | 'both'

function activityLine(a: ActivityItem): string {
  return `${ACTIVITY_LABEL[a.type]}${a.note ? ` – ${a.note}` : ''}`
}

function downloadCsv(view: ActivitiesView) {
  const columns = Math.max(1, ...(view.rows.map((r) => r.activities.length) || [0]))
  const header = [
    'Date',
    'Day',
    'Day off',
    'Employee code',
    'Employee',
    'Department',
    'Panel time',
    'Panel (minutes)',
    'Activities total',
    'Activities (minutes)',
    'Total work (minutes)',
  ]
  for (let i = 1; i <= columns; i++) {
    header.push(`Activity ${i}`, `Activity ${i} from`, `Activity ${i} to`, `Activity ${i} time`)
  }
  const lines = [header.join(',')]
  for (const row of view.rows) {
    const panelMins = Math.round(row.panelSeconds / 60)
    const cells: (string | number)[] = [
      row.date,
      dayHead(row.date).name,
      row.dayOff ?? '',
      row.code,
      row.name,
      row.department ?? '',
      hm(panelMins),
      panelMins,
      hm(row.activityMinutes),
      row.activityMinutes,
      panelMins + row.activityMinutes,
    ]
    for (let i = 0; i < columns; i++) {
      const a = row.activities[i]
      cells.push(...(a ? [activityLine(a), a.startTime, a.endTime, hm(a.minutes)] : ['', '', '', '']))
    }
    lines.push(cells.map(csvCell).join(','))
  }
  saveCsv(lines, `activities_${view.from}_to_${view.to}.csv`)
}

function ActivityTypeIcon({ type }: { type: ActivityItem['type'] }) {
  if (type === 'phone_call') {
    return (
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    )
  }
  if (type === 'external_meeting') {
    return (
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  }
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
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

  // In-table filters
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')
  const [search, setSearch] = useState('')

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

  // Aggregate KPI summary
  const summary = useMemo(() => {
    const rows = view?.rows ?? []
    const panelSec = rows.reduce((s, r) => s + r.panelSeconds, 0)
    const actMin = rows.reduce((s, r) => s + r.activityMinutes, 0)
    const totalMin = Math.round(panelSec / 60) + actMin
    const actCount = rows.reduce((s, r) => s + r.activities.length, 0)
    const contributors = new Set(rows.filter((r) => r.activities.length > 0).map((r) => r.employeeId)).size

    return {
      panelSec,
      actMin,
      totalMin,
      actCount,
      contributors,
    }
  }, [view])

  // Quick filter counts
  const quickCounts = useMemo(() => {
    const rows = view?.rows ?? []
    return {
      all: rows.length,
      activities: rows.filter((r) => r.activities.length > 0).length,
      panel: rows.filter((r) => r.panelSeconds >= 60 && r.activities.length === 0).length,
      both: rows.filter((r) => r.panelSeconds >= 60 && r.activities.length > 0).length,
    }
  }, [view])

  // Filtered rows for the table
  const filteredRows = useMemo(() => {
    const rows = view?.rows ?? []
    const q = search.trim().toLowerCase()

    return rows.filter((r) => {
      // 1. Quick pill filter
      if (quickFilter === 'activities' && r.activities.length === 0) return false
      if (quickFilter === 'panel' && (r.panelSeconds < 60 || r.activities.length > 0)) return false
      if (quickFilter === 'both' && (r.panelSeconds < 60 || r.activities.length === 0)) return false

      // 2. Real-time search query
      if (q) {
        const matchName = r.name.toLowerCase().includes(q)
        const matchCode = r.code.toLowerCase().includes(q)
        const matchDept = r.department ? r.department.toLowerCase().includes(q) : false
        const matchTask = r.activities.some((a) => {
          const label = ACTIVITY_LABEL[a.type]?.toLowerCase() ?? ''
          const note = a.note ? a.note.toLowerCase() : ''
          return label.includes(q) || note.includes(q)
        })
        if (!matchName && !matchCode && !matchDept && !matchTask) return false
      }

      return true
    })
  }, [view, quickFilter, search])

  const page = usePage(filteredRows, 25)

  const kpis: {
    label: string
    num: string
    sub: string
    c: string
    cs: string
    icon: ReactNode
  }[] = [
    {
      label: 'TOTAL PANEL TIME',
      num: hm(summary.panelSec / 60),
      sub: 'Tracked active portal time',
      c: '#0FA968',
      cs: '#E6F6EE',
      icon: (
        <>
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </>
      ),
    },
    {
      label: 'ACTIVITIES TIME',
      num: hm(summary.actMin),
      sub: `${summary.actCount.toLocaleString()} logged tasks & calls`,
      c: '#2563EB',
      cs: '#EAF0FE',
      icon: (
        <>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </>
      ),
    },
    {
      label: 'TOTAL WORK LOGGED',
      num: hm(summary.totalMin),
      sub: 'Cumulative panel + activities',
      c: '#6D53F0',
      cs: '#EEEAFE',
      icon: (
        <>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </>
      ),
    },
    {
      label: 'RECORDED ACTIVITIES',
      num: summary.actCount.toLocaleString(),
      sub: `Across ${summary.contributors} team members`,
      c: '#EA6A18',
      cs: '#FDEFE4',
      icon: (
        <>
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <path d="M9 14l2 2 4-4" />
        </>
      ),
    },
  ]

  return (
    <div className="at">
      {/* 1. Top KPI Summary Cards */}
      {view && (
        <div className="grid g4" style={{ marginBottom: 16 }}>
          {kpis.map((k) => (
            <div className="kpi" key={k.label} title={k.sub}>
              <div className="kpi-head">
                <span className="kpi-ico" style={{ '--c': k.c, '--cs': k.cs } as CSSProperties}>
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {k.icon}
                  </svg>
                </span>
                <span className="kpi-lbl">{k.label}</span>
              </div>
              <div className="kpi-num">{k.num}</div>
              <div className="kpi-sub">{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Filter Controls Bar */}
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
          onClick={() => view && downloadCsv(view)}
          disabled={!view || view.rows.length === 0 || loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download CSV
        </button>
      </div>

      {/* 3. Error / Loading / Empty or Main Content */}
      {rangeProblem ? (
        <div className="notice bad">{rangeProblem}</div>
      ) : error ? (
        <div className="notice bad" role="alert">
          {error}
        </div>
      ) : !view || (loading && view.rows.length === 0) ? (
        <div className="card">
          <div className="empty" style={{ padding: '36px 16px' }}>
            Loading team activities…
          </div>
        </div>
      ) : view.rows.length === 0 ? (
        <div className="card">
          <div className="empty" style={{ padding: '36px 16px' }}>
            <b>Nothing recorded</b>
            <p style={{ marginTop: 6, color: 'var(--muted2)' }}>
              No panel time or activities in this date window. Clear the filters above, or pick another range.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* 4. Quick Filters & Real-time Search */}
          <div className="ac-filter-bar">
            <div className="tabs" style={{ marginBottom: 0 }}>
              <button
                type="button"
                className={`tab ${quickFilter === 'all' ? 'on' : ''}`}
                onClick={() => setQuickFilter('all')}
              >
                All records <span className="n">{quickCounts.all}</span>
              </button>
              <button
                type="button"
                className={`tab ${quickFilter === 'activities' ? 'on' : ''}`}
                onClick={() => setQuickFilter('activities')}
              >
                With activities <span className="n">{quickCounts.activities}</span>
              </button>
              <button
                type="button"
                className={`tab ${quickFilter === 'panel' ? 'on' : ''}`}
                onClick={() => setQuickFilter('panel')}
              >
                Panel time only <span className="n">{quickCounts.panel}</span>
              </button>
              <button
                type="button"
                className={`tab ${quickFilter === 'both' ? 'on' : ''}`}
                onClick={() => setQuickFilter('both')}
              >
                Both active <span className="n">{quickCounts.both}</span>
              </button>
            </div>

            <div className="ac-search-box">
              <SearchIcon />
              <input
                type="text"
                className="inp ac-search-input"
                placeholder="Search member or task…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* 5. Main Table Card */}
          {filteredRows.length === 0 ? (
            <div className="card">
              <div className="empty" style={{ padding: '36px 16px' }}>
                <b>No records match your filters</b>
                <p style={{ marginTop: 6, color: 'var(--muted2)' }}>
                  Try adjusting your search query or selecting a different status pill above.
                </p>
                {(search || quickFilter !== 'all') && (
                  <button
                    type="button"
                    className="btn outline sm"
                    style={{ marginTop: 12 }}
                    onClick={() => {
                      setSearch('')
                      setQuickFilter('all')
                    }}
                  >
                    Reset filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className={`card${loading ? ' is-loading' : ''}`} style={{ padding: 0, overflow: 'hidden' }}>
              <div className="scroll live-scroll" style={{ maxHeight: 'calc(100vh - 350px)', minHeight: 380 }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 105 }}>Date</th>
                      <th style={{ minWidth: 200 }}>Member</th>
                      <th className="hide-md" style={{ width: 140 }}>
                        Department
                      </th>
                      <th className="num-col" style={{ width: 110 }}>
                        Panel time
                      </th>
                      <th className="num-col" style={{ width: 125 }}>
                        Activities total
                      </th>
                      <th className="num-col" style={{ width: 115 }}>
                        Total work
                      </th>
                      <th style={{ minWidth: 280 }}>Recorded activities</th>
                    </tr>
                  </thead>
                  <tbody>
                    {page.items.map((row) => (
                      <RowItem
                        key={`${row.employeeId}_${row.date}`}
                        row={row}
                        onOpen={() => navigate(`/me/${row.employeeId}`)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} unit="records" />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function RowItem({ row, onOpen }: { row: ActivityDayRow; onOpen: () => void }) {
  const h = dayHead(row.date)
  const panelMins = Math.round(row.panelSeconds / 60)
  const totalMins = panelMins + row.activityMinutes

  return (
    <tr
      className="row"
      tabIndex={0}
      role="link"
      aria-label={`Open profile of ${row.name}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
    >
      {/* Date */}
      <td style={{ whiteSpace: 'nowrap' }}>
        <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{h.label}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{h.name}</div>
        {row.dayOff && (
          <span
            className="tag"
            style={{ marginTop: 4, display: 'inline-block', fontSize: 10, padding: '1px 6px', color: '#8c827a' }}
          >
            {row.dayOff}
          </span>
        )}
      </td>

      {/* Member */}
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="avatar sm" style={{ background: deptColor(row.department) }}>
            {initials(row.name)}
          </span>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{row.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted2)' }}>{row.code}</div>
          </div>
        </div>
      </td>

      {/* Department */}
      <td className="hide-md">
        {row.department ? (
          <span className="dept">
            <span className="dot" style={{ background: deptColor(row.department) }} />
            {row.department}
          </span>
        ) : (
          <span style={{ color: 'var(--muted2)' }}>—</span>
        )}
      </td>

      {/* Panel Active Time */}
      <td className="num-col">
        {row.panelSeconds >= 60 ? (
          <span className="ac-panel-pill">{hm(panelMins)}</span>
        ) : (
          <span style={{ color: 'var(--muted2)' }}>—</span>
        )}
      </td>

      {/* Activities Total */}
      <td className="num-col">
        {row.activityMinutes > 0 ? (
          <div>
            <span className="ac-act-total-pill">{hm(row.activityMinutes)}</span>
            <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>
              {row.activities.length} {row.activities.length === 1 ? 'task' : 'tasks'}
            </div>
          </div>
        ) : (
          <span style={{ color: 'var(--muted2)' }}>—</span>
        )}
      </td>

      {/* Total Logged Work (Panel + Activities) */}
      <td className="num-col">
        {totalMins > 0 ? (
          <b style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--ink)' }}>{hm(totalMins)}</b>
        ) : (
          <span style={{ color: 'var(--muted2)' }}>—</span>
        )}
      </td>

      {/* Detailed Activities List */}
      <td style={{ whiteSpace: 'normal', minWidth: 280, maxWidth: 440 }}>
        {row.activities.length === 0 ? (
          <span style={{ color: 'var(--muted2)', fontSize: 12 }}>—</span>
        ) : (
          <div className="ac-items-stack">
            {row.activities.map((a) => (
              <div key={a.id} className="ac-item-card">
                <div className="ac-item-header">
                  <span className={`ac-type-chip type-${a.type}`}>
                    <ActivityTypeIcon type={a.type} />
                    <span>{ACTIVITY_LABEL[a.type] ?? a.type}</span>
                  </span>
                  <span className="ac-item-time">
                    {a.startTime} – {a.endTime}
                    <strong className="ac-item-dur">({hm(a.minutes)})</strong>
                  </span>
                </div>
                {a.note && <div className="ac-item-note">"{a.note}"</div>}
              </div>
            ))}
          </div>
        )}
      </td>
    </tr>
  )
}
