import { useEffect, useState } from 'react'
import { leaveApi } from '../../leave/leave.api'
import type { OnLeaveEmployee } from '../../leave/leave.types'
import { deptColor } from '../../../shared/lib/departments'
import { initials } from '../../../shared/lib/format'
import { fmtDate, fmtShort } from '../../../shared/lib/date'

export function OnLeaveTodayBanner() {
  const [leaves, setLeaves] = useState<OnLeaveEmployee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await leaveApi.getOnLeaveToday()
        if (!cancelled) {
          setLeaves(data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load on-leave list', err)
          setError(err instanceof Error ? err.message : 'Could not load leave list')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div
        className="card"
        style={{
          marginBottom: 16,
          padding: '12px 18px',
          background: 'var(--panel)',
          border: '1px solid var(--line2)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{ fontSize: 14 }}>🌴</span>
        <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Checking who is on leave today…</span>
      </div>
    )
  }

  if (error) {
    // Fail quietly without cluttering the screen if an error occurs
    return null
  }

  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  if (leaves.length === 0) {
    return (
      <div
        className="card"
        style={{
          marginBottom: 16,
          padding: '11px 18px',
          background: 'rgba(15, 169, 104, 0.05)',
          border: '1px solid rgba(15, 169, 104, 0.2)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15 }}>🎉</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
            <b>Everyone is in today</b> — no team members on leave.
          </span>
        </div>
        <span style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 500 }}>
          {fmtDate(todayStr)}
        </span>
      </div>
    )
  }

  return (
    <div
      className="card"
      style={{
        marginBottom: 16,
        padding: '13px 18px',
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 10,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15 }}>🌴</span>
          <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
            On leave today
          </h4>
          <span
            className="chip c-leave"
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '1px 8px',
              borderRadius: 12,
            }}
          >
            {leaves.length} {leaves.length === 1 ? 'member' : 'members'} away
          </span>
        </div>
        <span style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 500 }}>
          {fmtDate(todayStr)}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          paddingBottom: 4,
          paddingTop: 2,
          scrollbarWidth: 'thin',
        }}
      >
        {leaves.map((person) => {
          const color = deptColor(person.department)
          const isMultiDay = person.fromDate !== person.toDate
          return (
            <div
              key={person.employeeId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                background: 'var(--panel)',
                border: '1px solid var(--line2)',
                borderRadius: 8,
                flexShrink: 0,
                minWidth: 210,
                maxWidth: 280,
              }}
            >
              <span
                className="avatar sm"
                style={{
                  background: color,
                  flexShrink: 0,
                  width: 32,
                  height: 32,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {initials(person.fullName)}
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 12.5,
                    color: 'var(--ink)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={person.fullName}
                >
                  {person.fullName}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 3,
                    fontSize: 11,
                    color: 'var(--muted)',
                    flexWrap: 'nowrap',
                  }}
                >
                  <span
                    className={`chip ${person.leaveType === 'Unpaid' ? 'c-abs' : 'c-leave'}`}
                    style={{
                      fontSize: 10.5,
                      padding: '1px 6px',
                      lineHeight: '14px',
                      fontWeight: 600,
                      borderRadius: 4,
                      flexShrink: 0,
                    }}
                  >
                    {person.isHalfDay
                      ? `Half Day${person.halfDaySession ? ` (${person.halfDaySession === 'first' ? '1st' : '2nd'})` : ''}`
                      : `${person.leaveType}`}
                  </span>
                  {person.department && (
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontSize: 11,
                        color: 'var(--muted)',
                      }}
                      title={person.department}
                    >
                      {person.department}
                    </span>
                  )}
                  {isMultiDay && (
                    <span
                      style={{
                        fontSize: 10.5,
                        color: 'var(--muted2)',
                        whiteSpace: 'nowrap',
                        marginLeft: 'auto',
                      }}
                      title={`Until ${fmtDate(person.toDate)}`}
                    >
                      → {fmtShort(person.toDate)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
