import { useEffect, useMemo, useState } from 'react'
import { leaveApi } from '../../leave/leave.api'
import type { OnLeaveEmployee } from '../../leave/leave.types'
import { deptColor } from '../../../shared/lib/departments'
import { initials } from '../../../shared/lib/format'
import { fmtDate, fmtShort } from '../../../shared/lib/date'

export function OnLeaveTodayBanner() {
  const [leaves, setLeaves] = useState<OnLeaveEmployee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Expand inline drawer
  const [isExpanded, setIsExpanded] = useState(false)
  // Modal view for complete overview
  const [showModal, setShowModal] = useState(false)
  // Search & filter
  const [search, setSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState<string>('all')

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

  const todayStr = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  }, [])

  // Departments list with counts
  const departments = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of leaves) {
      const d = p.department || 'General'
      map.set(d, (map.get(d) ?? 0) + 1)
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [leaves])

  // Filtered members for drawer and modal
  const filteredLeaves = useMemo(() => {
    const q = search.trim().toLowerCase()
    return leaves.filter((p) => {
      const matchSearch =
        !q ||
        p.fullName.toLowerCase().includes(q) ||
        (p.department && p.department.toLowerCase().includes(q)) ||
        (p.designation && p.designation.toLowerCase().includes(q)) ||
        p.leaveType.toLowerCase().includes(q)
      const matchDept =
        selectedDept === 'all' ||
        (p.department ? p.department === selectedDept : selectedDept === 'General')
      return matchSearch && matchDept
    })
  }, [leaves, search, selectedDept])

  if (loading) {
    return (
      <div
        className="card"
        style={{
          marginBottom: 16,
          padding: '10px 16px',
          background: 'var(--panel)',
          border: '1px solid var(--line2)',
          borderRadius: 12,
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

  if (error || leaves.length === 0) {
    // If empty or error: clean, slim friendly message
    if (leaves.length === 0) {
      return (
        <div
          className="card"
          style={{
            marginBottom: 16,
            padding: '9px 16px',
            background: 'rgba(15, 169, 104, 0.05)',
            border: '1px solid rgba(15, 169, 104, 0.2)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>🎉</span>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink)' }}>
              <b>Everyone is in today</b> — no team members on leave.
            </span>
          </div>
          <span style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 500 }}>
            {fmtDate(todayStr)}
          </span>
        </div>
      )
    }
    return null
  }

  const count = leaves.length
  // When count <= 2, render compact chips inline in the single bar
  const isFew = count <= 2

  return (
    <>
      <div
        className="card"
        style={{
          marginBottom: 16,
          padding: '10px 16px',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        {/* Main single-line status bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          {/* Left: Title & Count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 15 }}>🌴</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
              On leave today
            </span>
            <span
              className="chip c-leave"
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '1px 8px',
                borderRadius: 12,
              }}
            >
              {count} {count === 1 ? 'member' : 'members'} away
            </span>
          </div>

          {/* Middle: Either inline chips (for 1-2 people) or Facepile + summary (for 3+ people) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flex: 1,
              minWidth: 0,
              justifyContent: 'flex-start',
              paddingLeft: 6,
            }}
          >
            {isFew ? (
              // 1 or 2 members: Render directly as sleek inline chips without wasting vertical space
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                {leaves.map((person) => {
                  const color = deptColor(person.department)
                  const isMultiDay = person.fromDate !== person.toDate
                  return (
                    <div
                      key={person.employeeId}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'var(--panel)',
                        border: '1px solid var(--line2)',
                        borderRadius: 20,
                        padding: '2px 9px 2px 3px',
                        fontSize: 12,
                        lineHeight: 1,
                      }}
                    >
                      <span
                        className="avatar sm"
                        style={{
                          width: 22,
                          height: 22,
                          fontSize: 10,
                          background: color,
                          fontWeight: 600,
                          borderRadius: '50%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          flexShrink: 0,
                        }}
                      >
                        {initials(person.fullName)}
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                        {person.fullName}
                      </span>
                      <span
                        className={`chip ${person.leaveType === 'Unpaid' ? 'c-abs' : 'c-leave'}`}
                        style={{
                          fontSize: 10,
                          padding: '1px 5px',
                          lineHeight: '14px',
                          fontWeight: 600,
                          borderRadius: 4,
                          flexShrink: 0,
                        }}
                      >
                        {person.isHalfDay
                          ? `Half Day${person.halfDaySession ? ` (${person.halfDaySession === 'first' ? '1st' : '2nd'})` : ''}`
                          : person.leaveType}
                      </span>
                      {person.department && (
                        <span style={{ color: 'var(--muted)', fontSize: 11 }}>
                          {person.department}
                        </span>
                      )}
                      {isMultiDay && (
                        <span
                          style={{ color: 'var(--muted2)', fontSize: 10.5 }}
                          title={`Until ${fmtDate(person.toDate)}`}
                        >
                          → {fmtShort(person.toDate)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              // 3 or more members: Overlapping Facepile + count teaser
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                onClick={() => setIsExpanded((prev) => !prev)}
                title="Click to view details"
              >
                {/* Avatar stack */}
                <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 4 }}>
                  {leaves.slice(0, 5).map((person, idx) => (
                    <span
                      key={person.employeeId}
                      className="avatar sm"
                      title={`${person.fullName} (${person.department || 'General'} · ${person.leaveType})`}
                      style={{
                        background: deptColor(person.department),
                        width: 25,
                        height: 25,
                        fontSize: 10.5,
                        fontWeight: 600,
                        marginLeft: idx === 0 ? 0 : -8,
                        border: '2px solid #ffffff',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                        zIndex: 10 - idx,
                        position: 'relative',
                      }}
                    >
                      {initials(person.fullName)}
                    </span>
                  ))}
                  {count > 5 && (
                    <span
                      style={{
                        width: 25,
                        height: 25,
                        fontSize: 10,
                        fontWeight: 700,
                        marginLeft: -8,
                        borderRadius: '50%',
                        background: 'var(--panel)',
                        border: '2px solid #ffffff',
                        color: 'var(--muted)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                        zIndex: 4,
                        position: 'relative',
                      }}
                    >
                      +{count - 5}
                    </span>
                  )}
                </div>

                {/* Names text snippet */}
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {leaves
                    .slice(0, 2)
                    .map((p) => p.fullName)
                    .join(', ')}
                  {count > 2 ? ` and ${count - 2} others` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Right: Date & Expand/Collapse toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginLeft: 'auto',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 500 }}>
              {fmtDate(todayStr)}
            </span>

            {/* Toggle button when > 2 people, or if user wants to see list */}
            {!isFew && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  className="btn sm ghost"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  style={{
                    fontSize: 11.5,
                    padding: '3px 10px',
                    height: 26,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: isExpanded ? 'var(--panel)' : '#ffffff',
                    borderColor: 'var(--line)',
                  }}
                >
                  {isExpanded ? 'Collapse ▴' : `View all (${count}) ▾`}
                </button>
                <button
                  type="button"
                  className="btn sm ghost"
                  onClick={() => setShowModal(true)}
                  title="Open in full popup dialog"
                  style={{
                    fontSize: 11,
                    padding: '3px 7px',
                    height: 26,
                    background: '#ffffff',
                    borderColor: 'var(--line)',
                    color: 'var(--muted)',
                  }}
                >
                  ⤢
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Collapsible / Expandable Section for 3+ members: Strictly capped at max-height 220px with search & filters */}
        {!isFew && isExpanded && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid var(--line2)',
            }}
          >
            {/* Filter toolbar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                marginBottom: 10,
                flexWrap: 'wrap',
              }}
            >
              {/* Search input */}
              <div style={{ position: 'relative', width: 220, maxWidth: '100%' }}>
                <input
                  type="text"
                  placeholder="Filter by name or dept…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '4px 26px 4px 8px',
                    fontSize: 12,
                    borderRadius: 6,
                    border: '1px solid var(--line)',
                    background: 'var(--panel)',
                    outline: 'none',
                  }}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    style={{
                      position: 'absolute',
                      right: 6,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: 12,
                      color: 'var(--muted)',
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Department pill filters */}
              {departments.length > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedDept('all')}
                    className="chip"
                    style={{
                      cursor: 'pointer',
                      fontSize: 11,
                      padding: '2px 8px',
                      background: selectedDept === 'all' ? 'var(--blue)' : 'var(--panel)',
                      color: selectedDept === 'all' ? '#ffffff' : 'var(--ink)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    All ({count})
                  </button>
                  {departments.slice(0, 4).map(([dept, dCount]) => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => setSelectedDept(dept)}
                      className="chip"
                      style={{
                        cursor: 'pointer',
                        fontSize: 11,
                        padding: '2px 8px',
                        background: selectedDept === dept ? 'var(--blue)' : 'var(--panel)',
                        color: selectedDept === dept ? '#ffffff' : 'var(--ink)',
                        border: '1px solid var(--line)',
                      }}
                    >
                      {dept} ({dCount})
                    </button>
                  ))}
                </div>
              )}

              {/* Status and modal button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 11.5,
                  color: 'var(--muted)',
                  marginLeft: 'auto',
                }}
              >
                <span>
                  Showing {filteredLeaves.length} of {count}
                </span>
                <button
                  type="button"
                  className="btn sm ghost"
                  onClick={() => setShowModal(true)}
                  style={{ fontSize: 11, padding: '2px 8px', height: 24 }}
                >
                  Full dialog ⤢
                </button>
              </div>
            </div>

            {/* Scrollable grid: strictly limited in height so 20+ people never blow up the screen */}
            <div
              style={{
                maxHeight: 220,
                overflowY: 'auto',
                paddingRight: 4,
                scrollbarWidth: 'thin',
              }}
            >
              {filteredLeaves.length === 0 ? (
                <div
                  style={{
                    padding: '16px 0',
                    textAlign: 'center',
                    color: 'var(--muted)',
                    fontSize: 12.5,
                  }}
                >
                  No colleagues match that filter.
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                    gap: 8,
                  }}
                >
                  {filteredLeaves.map((person) => {
                    const color = deptColor(person.department)
                    const isMultiDay = person.fromDate !== person.toDate
                    return (
                      <div
                        key={person.employeeId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 10px',
                          background: 'var(--panel)',
                          border: '1px solid var(--line2)',
                          borderRadius: 8,
                        }}
                      >
                        <span
                          className="avatar sm"
                          style={{
                            background: color,
                            flexShrink: 0,
                            width: 28,
                            height: 28,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {initials(person.fullName)}
                        </span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 12,
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
                              gap: 5,
                              marginTop: 2,
                              fontSize: 10.5,
                              color: 'var(--muted)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                            }}
                          >
                            <span
                              className={`chip ${person.leaveType === 'Unpaid' ? 'c-abs' : 'c-leave'}`}
                              style={{
                                fontSize: 9.5,
                                padding: '1px 5px',
                                lineHeight: '13px',
                                fontWeight: 600,
                                borderRadius: 4,
                                flexShrink: 0,
                              }}
                            >
                              {person.isHalfDay
                                ? `Half Day${person.halfDaySession ? ` (${person.halfDaySession === 'first' ? '1st' : '2nd'})` : ''}`
                                : person.leaveType}
                            </span>
                            {person.department && (
                              <span
                                style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                                title={person.department}
                              >
                                {person.department}
                              </span>
                            )}
                            {isMultiDay && (
                              <span
                                style={{
                                  color: 'var(--muted2)',
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
              )}
            </div>
          </div>
        )}
      </div>

      {/* Full Modal Dialog View: If opened, provides complete detached overview */}
      {showModal && (
        <div
          className="modal on"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 620, maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Modal Header */}
            <div className="mh" style={{ marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🌴</span> On leave today
                </h3>
                <div style={{ color: 'var(--muted)', fontSize: 12.5, marginTop: 4 }}>
                  {count} colleagues on approved leave · {fmtDate(todayStr)}
                </div>
              </div>
              <button
                type="button"
                className="x"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Filter toolbar inside modal */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 12,
                flexWrap: 'wrap',
              }}
            >
              <input
                type="text"
                placeholder="Search colleague, department or leave type…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 180,
                  padding: '6px 10px',
                  fontSize: 12.5,
                  borderRadius: 8,
                  border: '1px solid var(--line)',
                  background: 'var(--panel)',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setSelectedDept('all')}
                  className="chip"
                  style={{
                    cursor: 'pointer',
                    fontSize: 11,
                    padding: '3px 8px',
                    background: selectedDept === 'all' ? 'var(--blue)' : 'var(--panel)',
                    color: selectedDept === 'all' ? '#ffffff' : 'var(--ink)',
                    border: '1px solid var(--line)',
                  }}
                >
                  All ({count})
                </button>
                {departments.map(([dept, dCount]) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setSelectedDept(dept)}
                    className="chip"
                    style={{
                      cursor: 'pointer',
                      fontSize: 11,
                      padding: '3px 8px',
                      background: selectedDept === dept ? 'var(--blue)' : 'var(--panel)',
                      color: selectedDept === dept ? '#ffffff' : 'var(--ink)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    {dept} ({dCount})
                  </button>
                ))}
              </div>
            </div>

            {/* Modal scrollable grid */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                paddingRight: 4,
                scrollbarWidth: 'thin',
                minHeight: 180,
              }}
            >
              {filteredLeaves.length === 0 ? (
                <div
                  style={{
                    padding: '32px 0',
                    textAlign: 'center',
                    color: 'var(--muted)',
                    fontSize: 13,
                  }}
                >
                  No colleagues match your search.
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: 8,
                  }}
                >
                  {filteredLeaves.map((person) => {
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
                          borderRadius: 10,
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
                          >
                            {person.fullName}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              marginTop: 2,
                              fontSize: 11,
                              color: 'var(--muted)',
                            }}
                          >
                            <span
                              className={`chip ${person.leaveType === 'Unpaid' ? 'c-abs' : 'c-leave'}`}
                              style={{
                                fontSize: 10,
                                padding: '1px 6px',
                                lineHeight: '14px',
                                fontWeight: 600,
                                borderRadius: 4,
                              }}
                            >
                              {person.isHalfDay
                                ? `Half Day${person.halfDaySession ? ` (${person.halfDaySession === 'first' ? '1st' : '2nd'})` : ''}`
                                : person.leaveType}
                            </span>
                            {person.department && <span>{person.department}</span>}
                            {isMultiDay && (
                              <span
                                style={{ color: 'var(--muted2)', marginLeft: 'auto' }}
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
              )}
            </div>

            {/* Modal footer */}
            <div
              style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: '1px solid var(--line2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                Showing {filteredLeaves.length} of {count}
              </span>
              <button
                type="button"
                className="btn sm"
                onClick={() => setShowModal(false)}
                style={{
                  background: 'var(--blue)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 500,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
