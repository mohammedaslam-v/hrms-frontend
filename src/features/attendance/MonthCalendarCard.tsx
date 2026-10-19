import { useCallback, useEffect, useMemo, useState } from 'react'
import { attendanceApi } from './attendance.api'
import { STATUS_LABEL, type AttendanceStatus, type CalendarView, type WeekBar } from './attendance.types'
import { DayDetailModal, DayPopover } from './DayDetail'
import { EditDayModal } from './EditDayModal'
import { MONTHS, fmtShort } from '../../shared/lib/date'
import { asHours } from '../../shared/lib/format'
import { CustomSelect } from '../../shared/ui/CustomSelect'
import { useAdminActivity } from '../presence'
import { useWorkActivities } from '../work-activity'
import './calendar.css'

/** Where the hover box should sit: centred over the date it belongs to. */
interface Anchor {
  bar: WeekBar
  x: number
  y: number
}

/** A month as the API wants it: first and last date, `YYYY-MM-DD`. */
function monthRange(year: number, month: number): { from: string; to: string } {
  const mm = String(month + 1).padStart(2, '0')
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return { from: `${year}-${mm}-01`, to: `${year}-${mm}-${String(last).padStart(2, '0')}` }
}

/** Blank cells before the 1st, for a grid that starts on Monday. */
const leadingBlanks = (year: number, month: number): number =>
  (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7

/**
 * Colour by what the day was. Late is still present — it gets a dot, not a
 * different fill, so a month of attendance does not read as a month of leave.
 */
const TONE: Record<AttendanceStatus, string> = {
  'On time': 'present',
  Late: 'present late',
  Leave: 'leave',
  'Half day': 'half',
  Absent: 'absent',
  'Weekly off': 'off',
  Holiday: 'off',
  'Not in yet': '',
}

const LEGEND: { tone: string; label: string; counts: AttendanceStatus[] }[] = [
  { tone: 'present', label: 'Present', counts: ['On time', 'Late'] },
  { tone: 'leave', label: 'Leave', counts: ['Leave'] },
  { tone: 'half', label: 'Half day', counts: ['Half day'] },
  { tone: 'absent', label: 'Not Marked', counts: ['Absent'] },
  { tone: 'off', label: 'Weekly off', counts: ['Weekly off', 'Holiday'] },
]

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const FIRST_YEAR = 2024

/**
 * Attendance for a month, one coloured cell per date.
 *
 * Replaces the week bar chart. Hovering a date shows the same summary box the
 * bars had, and clicking opens the same detail window — both are fed exactly
 * the same per-day data, now for a month at a time.
 *
 * The month moves with the arrows or the two dropdowns. An admin looking at
 * somebody else also gets "Edit day" in the detail window, for today and
 * earlier; the server enforces the same rule.
 */
export function MonthCalendarCard({ employeeId, isSelf }: { employeeId: number; isSelf: boolean }) {
  // The browser picks the opening month only. Every judgement about which day
  // is today comes from the server's `today`.
  const opening = useMemo(() => new Date(), [])
  const [year, setYear] = useState(opening.getFullYear())
  const [month, setMonth] = useState(opening.getMonth())
  const [view, setView] = useState<CalendarView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const [selected, setSelected] = useState<WeekBar | null>(null)
  const [editing, setEditing] = useState<WeekBar | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  const { from, to } = monthRange(year, month)
  const subject = isSelf ? undefined : employeeId
  const admin = useAdminActivity(from, to, subject)
  const { range: recorded } = useWorkActivities(from, to, subject)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setView(await attendanceApi.getCalendar(from, to, subject))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this month.')
    } finally {
      setLoading(false)
    }
  }, [from, to, subject])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [load])

  // A box positioned against the viewport has to go when the viewport moves,
  // or it detaches from the date it is describing.
  useEffect(() => {
    if (!anchor) return
    const close = () => setAnchor(null)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [anchor])

  const step = (delta: number) => {
    const next = new Date(year, month + delta, 1)
    if (next.getFullYear() < FIRST_YEAR) return
    setAnchor(null)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  const years = useMemo(
    () => Array.from({ length: opening.getFullYear() + 2 - FIRST_YEAR }, (_, i) => FIRST_YEAR + i),
    [opening]
  )

  const monthOptions = useMemo(
    () => MONTHS.map((m, i) => ({ value: i, label: m })),
    []
  )

  const yearOptions = useMemo(
    () => years.map((y) => ({ value: y, label: String(y) })),
    [years]
  )

  const open = (bar: WeekBar, element: HTMLElement) => {
    const box = element.getBoundingClientRect()
    setAnchor({ bar, x: box.left + box.width / 2, y: box.top - 10 })
  }

  const activitiesOn = (date: string) => recorded?.activities.filter((a) => a.date === date) ?? []

  const openDetail = (bar: WeekBar) => {
    setAnchor(null)
    setSelected(bar)
  }

  const canEditDay = (bar: WeekBar) => Boolean(view?.canEdit && view.today && bar.date <= view.today)

  const body = () => {
    if (loading && !view) return <div className="empty">Loading…</div>
    if (error || !view) {
      return (
        <div className="notice bad" role="alert">
          {error ?? 'Could not load this month.'}
        </div>
      )
    }

    const worked = view.days.reduce((total, bar) => total + bar.hours, 0)
    const count = (statuses: AttendanceStatus[]) =>
      view.days.filter((d) => statuses.includes(d.status)).length

    return (
      <>
        <div className={`cal-grid${loading ? ' is-loading' : ''}`} role="grid">
          {WEEKDAYS.map((d) => (
            <div className="cal-wd" key={d} role="columnheader">
              {d}
            </div>
          ))}
          {Array.from({ length: leadingBlanks(year, month) }, (_, i) => (
            <div className="cal-blank" key={`b${i}`} aria-hidden />
          ))}
          {view.days.map((bar) => (
            <div
              key={bar.date}
              className={`cal-day ${TONE[bar.status]}${bar.date === view.today ? ' today' : ''}`}
              // Reachable by keyboard as well as by mouse: the detail is the
              // only place the stretches appear, so it cannot be hover-only.
              tabIndex={0}
              role="button"
              aria-label={`${bar.dayName} ${fmtShort(bar.date)}, ${STATUS_LABEL[bar.status] ?? bar.status}, ${asHours(bar.hours)}`}
              onMouseEnter={(e) => open(bar, e.currentTarget)}
              onMouseLeave={() => setAnchor(null)}
              onFocus={(e) => open(bar, e.currentTarget)}
              onBlur={() => setAnchor(null)}
              onClick={() => openDetail(bar)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openDetail(bar)
                }
              }}
            >
              <span className="cal-num">{Number(bar.date.slice(8))}</span>
              {bar.hours > 0 && <span className="cal-hrs">{asHours(bar.hours)}</span>}
            </div>
          ))}
        </div>

        <div className="cal-legend">
          {LEGEND.map((l) => (
            <span key={l.tone}>
              <i className={`cal-sw ${l.tone}`} />
              {l.label} <b>{count(l.counts)}</b>
            </span>
          ))}
          <span className="cal-total">{worked > 0 ? `${asHours(worked)} this month` : 'No hours recorded'}</span>
        </div>

        {saved && (
          <div className="notice blue mt8" role="status">
            {saved}
          </div>
        )}

        {anchor && !selected && !editing && (
          <DayPopover
            x={anchor.x}
            y={anchor.y}
            bar={anchor.bar}
            admin={admin}
            activities={activitiesOn(anchor.bar.date)}
          />
        )}
        {selected && (
          <DayDetailModal
            bar={selected}
            admin={admin}
            activities={activitiesOn(selected.date)}
            canDelete={Boolean(recorded?.canEdit && recorded.editableDates.includes(selected.date))}
            onClose={() => setSelected(null)}
            onEdit={
              canEditDay(selected)
                ? () => {
                    setEditing(selected)
                    setSelected(null)
                  }
                : undefined
            }
          />
        )}
        {editing && (
          <EditDayModal
            employeeId={employeeId}
            bar={editing}
            isToday={editing.date === view.today}
            onClose={() => setEditing(null)}
            onSaved={(message) => {
              setEditing(null)
              setSaved(message)
              void load()
            }}
          />
        )}
      </>
    )
  }

  return (
    <div className="card">
      <div className="cal-head">
        <h3>Attendance and activities · {MONTHS[month]} {year}</h3>
        <div className="cal-nav">
          <button
            type="button"
            className="cal-arrow"
            aria-label="Previous month"
            onClick={() => step(-1)}
            disabled={year === FIRST_YEAR && month === 0}
          >
            ‹
          </button>
          <CustomSelect
            ariaLabel="Month"
            value={month}
            onChange={(m) => setMonth(m)}
            options={monthOptions}
            size="sm"
            minWidth={84}
          />
          <CustomSelect
            ariaLabel="Year"
            value={year}
            onChange={(y) => setYear(y)}
            options={yearOptions}
            size="sm"
            minWidth={84}
          />
          <button type="button" className="cal-arrow" aria-label="Next month" onClick={() => step(1)}>
            ›
          </button>
        </div>
      </div>
      {body()}
    </div>
  )
}
