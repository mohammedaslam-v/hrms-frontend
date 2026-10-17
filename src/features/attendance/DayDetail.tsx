import { useState } from 'react'
import { createPortal } from 'react-dom'
import { STATUS_CLASS, type WeekBar } from './attendance.types'
import { fmtShort } from '../../shared/lib/date'
import { asHours } from '../../shared/lib/format'
import { Modal } from '../../shared/ui/Modal'
import { AdminPanelLines, adminDaySummary, type AdminPanelActivity } from '../presence'
import {
  ACTIVITY_LABEL,
  addedMinutes,
  announceActivitiesChanged,
  coveredMinutes,
  workActivityApi,
  type WorkActivity,
} from '../work-activity'

/*
 * One day of the week chart, in two sizes.
 *
 * The hover box is a summary with a fixed shape — three rows at most, every
 * row one line — so it never grows with what people type into a note. The
 * whole day (every stretch, every activity with its full note, the admin
 * panel) opens in a window on click or Enter, and that window scrolls.
 */

export interface DayData {
  bar: WeekBar
  admin: AdminPanelActivity | null
  activities: WorkActivity[]
}

const nowHm = (): string => new Date().toTimeString().slice(0, 5)

/**
 * The day's numbers. Checked-in time is read from the stretches while someone
 * is still in — the bar's own hours stay at zero until check-out — so the box
 * never says "0h checked in" beside "16:00 – still in".
 */
function figures({ bar, activities }: DayData) {
  const now = nowHm()
  const spans = bar.segments.map((s) => ({ from: s.from, to: s.to }))
  const running = spans.some((s) => s.to === null)
  const checkedIn = running ? coveredMinutes(spans, now) / 60 : bar.hours
  const extra =
    addedMinutes(
      spans,
      activities.map((a) => ({ from: a.startTime, to: a.endTime })),
      now,
    ) / 60
  // Minutes as typed, before overlap with check-in is taken out.
  const listed = activities.reduce((m, a) => m + coveredMinutes([{ from: a.startTime, to: a.endTime }], now), 0)
  return { checkedIn, extra, total: checkedIn + extra, overlapped: listed / 60 - extra > 1 / 60 }
}

const runsLabel = (bar: WeekBar): string =>
  bar.segments.map((r) => `${r.from} – ${r.to ?? 'still in'}`).join(', ')

/** The compact box shown on hover or focus, positioned over the bar. */
export function DayPopover({ x, y, ...day }: DayData & { x: number; y: number }) {
  const { bar, admin, activities } = day
  const f = figures(day)
  const adminLine = admin ? adminDaySummary(admin, bar.date, bar.isToday) : null
  const hasAnything = bar.segments.length > 0 || activities.length > 0 || adminLine

  return createPortal(
    <div className="wbpop" role="tooltip" style={{ left: x, top: y }}>
      <div className="wbpop-head">
        <b>
          {bar.dayName} {fmtShort(bar.date)}
        </b>
        <span className={`chip ${STATUS_CLASS[bar.status]}`}>{bar.status}</span>
      </div>

      <div className="wbpop-total">{asHours(f.total)} active</div>

      {hasAnything ? (
        <div className="wbpop-rows">
          <div className="wbpop-row">
            <span>{bar.source === 'activity' ? 'Observed' : 'Checked in'}</span>
            <b>{asHours(f.checkedIn)}</b>
            <em>{bar.segments.length > 0 ? runsLabel(bar) : 'No check-in'}</em>
          </div>
          {activities.length > 0 && (
            <div className="wbpop-row">
              <span>Activities</span>
              <b>+{asHours(f.extra)}</b>
              <em>
                {activities.length} recorded
                {f.overlapped ? ' · overlap counted once' : ''}
              </em>
            </div>
          )}
          {adminLine && (
            <div className="wbpop-row">
              <span>Admin panel</span>
              <b>{adminLine.value}</b>
              <em className={adminLine.live ? 'is-live' : undefined}>{adminLine.detail}</em>
            </div>
          )}
        </div>
      ) : (
        <div className="wbpop-note">Nothing recorded for this day.</div>
      )}

      <div className="wbpop-more">Click for full details</div>
    </div>,
    document.body,
  )
}

/** Everything about the day, in a window that scrolls when there is a lot. */
export function DayDetailModal({
  onClose,
  canDelete,
  ...day
}: DayData & {
  onClose: () => void
  /** The person's own day, still within the two-day window. */
  canDelete: boolean
}) {
  const { bar, admin, activities } = day
  const f = figures(day)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const remove = async (id: number) => {
    if (!window.confirm('Delete this activity?')) return
    setDeleting(id)
    setError(null)
    try {
      await workActivityApi.remove(id)
      announceActivitiesChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the activity.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <Modal
      title={
        <>
          {bar.dayName} {fmtShort(bar.date)}{' '}
          <span className={`chip ${STATUS_CLASS[bar.status]}`} style={{ marginLeft: 6, verticalAlign: 'middle' }}>
            {bar.status}
          </span>
        </>
      }
      onClose={onClose}
      error={error}
      maxWidth={520}
    >
      <div className="dd-summary">
        <div>
          <div className="dd-total">{asHours(f.total)}</div>
          <div className="dd-label">Active</div>
        </div>
        <div>
          <div className="dd-part">{asHours(f.checkedIn)}</div>
          <div className="dd-label">{bar.source === 'activity' ? 'Observed' : 'Checked in'}</div>
        </div>
        <div>
          <div className="dd-part">+{asHours(f.extra)}</div>
          <div className="dd-label">Activities</div>
        </div>
      </div>

      <section className="dd-sec">
        <h4>{bar.source === 'activity' ? 'Admin-portal activity' : 'Check-in and check-out'}</h4>
        {bar.segments.length > 0 ? (
          <ul className="dd-list">
            {bar.segments.map((r) => (
              <li key={r.from}>
                <span className="dd-time">
                  {r.from} – {r.to ?? 'still in'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dd-empty">No check-in this day.</p>
        )}
        {bar.segments.length > 1 && (
          <p className="dd-empty">
            {bar.segments.length - 1} break{bar.segments.length > 2 ? 's' : ''} in between
          </p>
        )}
      </section>

      <section className="dd-sec">
        <h4>Recorded activities</h4>
        {activities.length > 0 ? (
          <ul className="dd-list">
            {activities.map((a) => (
              <li key={a.id}>
                <div className="dd-act-head">
                  <span className="dd-time">
                    {a.startTime} – {a.endTime}
                  </span>
                  <span className="chip c-all nodot">{ACTIVITY_LABEL[a.type]}</span>
                  {canDelete && (
                    <button
                      type="button"
                      className="dd-del"
                      onClick={() => void remove(a.id)}
                      disabled={deleting === a.id}
                    >
                      {deleting === a.id ? 'Deleting…' : 'Delete'}
                    </button>
                  )}
                </div>
                {a.note && <p className="dd-note">{a.note}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="dd-empty">None recorded.</p>
        )}
        {f.overlapped && (
          <p className="dd-empty">Time already inside check-in is counted once.</p>
        )}
      </section>

      {admin && (
        <section className="dd-sec">
          <AdminPanelLines activity={admin} date={bar.date} isToday={bar.isToday} />
        </section>
      )}
    </Modal>
  )
}
