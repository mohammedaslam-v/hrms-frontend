import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHero } from '../../../shared/ui/PageHero'
import { fmtDate } from '../../../shared/lib/date'
import { attendanceApi } from '../attendance.api'
import type { AttendanceTab, TodayBoardDto, TodayBoardKpis } from '../attendance.types'
import { AttendanceStatsCards } from '../components/AttendanceStatsCards'
import { AttendanceQuickFilters } from '../components/AttendanceQuickFilters'
import { TodayLiveTable } from '../components/TodayLiveTable'
import { DateRangeLedgerTable } from '../components/DateRangeLedgerTable'
import { PunctualitySummaryTable } from '../components/PunctualitySummaryTable'
// oxlint-disable-next-line eslint(no-restricted-imports), no-restricted-imports
// eslint-disable-next-line no-restricted-imports
import { useAuth } from '../../../app/auth-context'

export function AttendanceActivityPage() {
  const { employee } = useAuth()
  const isAdmin = employee.defaultTier === 'admin' || Boolean(employee.tiers?.includes('admin'))
  const isManager = isAdmin || employee.defaultTier === 'manager' || Boolean(employee.tiers?.includes('manager'))

  const [activeTab, setActiveTab] = useState<AttendanceTab>('today')
  const [activeFilter, setActiveFilter] = useState<string>('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [selectedManagerId, setSelectedManagerId] = useState<string>('')

  const [board, setBoard] = useState<TodayBoardDto | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadTodayBoard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await attendanceApi.getTodayBoard()
      setBoard(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load attendance board.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isManager) {
      void loadTodayBoard()
    }
  }, [isManager, loadTodayBoard])

  // Extract unique departments for filters
  const departments = useMemo(() => {
    if (!board) return []
    const set = new Set<string>()
    board.roster.forEach((r) => {
      if (r.department) set.add(r.department.trim())
    })
    return Array.from(set).filter(Boolean).sort()
  }, [board])

  // Extract unique reporting managers for filters
  const reportingManagers = useMemo(() => {
    if (!board) return []
    const map = new Map<number, string>()
    board.roster.forEach((r) => {
      if (r.managerId && r.managerName) {
        map.set(r.managerId, r.managerName.trim())
      }
    })
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [board])

  const members = useMemo(() => {
    if (!board) return []
    return board.roster
      .map((r) => ({ id: r.employeeId, name: r.name, code: r.code }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [board])

  // 1. Filter roster by Department and Reporting Manager (Admin controls)
  const scopedRoster = useMemo(() => {
    if (!board) return []
    return board.roster.filter((r) => {
      if (selectedDepartment && r.department !== selectedDepartment) return false
      if (selectedManagerId && String(r.managerId) !== selectedManagerId) return false
      return true
    })
  }, [board, selectedDepartment, selectedManagerId])

  // 2. Dynamically calculate KPI counts based on the scoped (filtered) roster
  const filteredKpis = useMemo<TodayBoardKpis>(() => {
    let onTime = 0
    let late = 0
    let absent = 0
    let leave = 0
    let off = 0

    scopedRoster.forEach((r) => {
      if (r.status === 'On time') onTime++
      else if (r.status === 'Late') late++
      else if (r.status === 'Absent' || r.status === 'Not in yet') absent++
      else if (r.status === 'Leave' || r.status === 'Half day') leave++
      else if (r.status === 'Weekly off' || r.status === 'Holiday') off++
    })

    return {
      onTime,
      late,
      absent,
      leave,
      off,
      total: scopedRoster.length,
    }
  }, [scopedRoster])

  // 3. Dynamically calculate quick-filter tab counts based on the scoped roster
  const filteredQuickCounts = useMemo<Record<string, number>>(() => {
    return {
      '': scopedRoster.length,
      'On time': filteredKpis.onTime,
      'Late': filteredKpis.late,
      'Absent': filteredKpis.absent,
      'Leave': filteredKpis.leave,
      'Weekly off': filteredKpis.off,
    }
  }, [scopedRoster.length, filteredKpis])

  // 4. Filtered rows for Today's live table based on selected status pill
  const filteredTodayRows = useMemo(() => {
    if (!activeFilter) return scopedRoster

    if (activeFilter === 'Weekly off') {
      return scopedRoster.filter(
        (r) => r.status === 'Weekly off' || r.status === 'Holiday',
      )
    }

    if (activeFilter === 'Absent') {
      return scopedRoster.filter(
        (r) => r.status === 'Absent' || r.status === 'Not in yet',
      )
    }

    if (activeFilter === 'Leave') {
      return scopedRoster.filter(
        (r) => r.status === 'Leave' || r.status === 'Half day',
      )
    }

    return scopedRoster.filter((r) => r.status === activeFilter)
  }, [scopedRoster, activeFilter])

  if (!isManager) {
    return (
      <div className="page">
        <PageHero navKey="att" />
        <div className="card">
          <div className="empty" style={{ padding: '36px 16px' }}>
            <b>Access Restricted</b>
            <p style={{ marginTop: 6, color: 'var(--muted2)' }}>
              The Attendance & Activity center is only accessible to Managers and Admins.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHero
        navKey="att"
        eyebrow={`${board ? fmtDate(board.date) : 'Today'} · Operations Board & Timeliness`}
      />

      {/* Main Tab Navigation */}
      <div className="tabs" style={{ marginBottom: 18 }}>
        <button
          type="button"
          className={`tab ${activeTab === 'today' ? 'on' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          Today
          {board && <span className="n">{scopedRoster.length}</span>}
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'range' ? 'on' : ''}`}
          onClick={() => setActiveTab('range')}
        >
          Date range
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'summary' ? 'on' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Punctuality summary
        </button>
      </div>

      {loading && !board ? (
        <div className="card">
          <div className="empty" style={{ padding: '36px 16px' }}>
            Loading team attendance…
          </div>
        </div>
      ) : error ? (
        <div className="notice bad" role="alert">
          {error}
        </div>
      ) : (
        <>
          {activeTab === 'today' && board && (
            <div>
              {/* 5 KPI Stat Cards (reacts to department & manager filters) */}
              <AttendanceStatsCards kpis={filteredKpis} />

              <div className="card mt" style={{ padding: '18px 20px' }}>
                {/* Admin Filters: Department & Reporting Manager */}
                {isAdmin && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      paddingBottom: 14,
                      marginBottom: 16,
                      borderBottom: '1px solid var(--line)',
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                        Filter by:
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <label htmlFor="today-dept-filter" style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 500 }}>
                          Department:
                        </label>
                        <select
                          id="today-dept-filter"
                          className="inp"
                          style={{ width: 175, padding: '5px 10px', fontSize: 13, borderRadius: 8 }}
                          value={selectedDepartment}
                          onChange={(e) => setSelectedDepartment(e.target.value)}
                        >
                          <option value="">All departments</option>
                          {departments.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <label htmlFor="today-manager-filter" style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 500 }}>
                          Reporting manager:
                        </label>
                        <select
                          id="today-manager-filter"
                          className="inp"
                          style={{ width: 195, padding: '5px 10px', fontSize: 13, borderRadius: 8 }}
                          value={selectedManagerId}
                          onChange={(e) => setSelectedManagerId(e.target.value)}
                        >
                          <option value="">All reporting managers</option>
                          {reportingManagers.map((m) => (
                            <option key={m.id} value={String(m.id)}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {(selectedDepartment || selectedManagerId) && (
                        <button
                          type="button"
                          className="btn ghost sm"
                          onClick={() => {
                            setSelectedDepartment('')
                            setSelectedManagerId('')
                          }}
                          style={{ fontSize: 12, padding: '4px 8px' }}
                        >
                          ✕ Reset filters
                        </button>
                      )}
                    </div>

                    {(selectedDepartment || selectedManagerId) && (
                      <span style={{ fontSize: 12, color: 'var(--muted2)' }}>
                        Showing <b>{scopedRoster.length}</b> of {board.roster.length} members
                      </span>
                    )}
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  {/* Quick-filter status pills (counts adapt to filters) */}
                  <AttendanceQuickFilters
                    activeFilter={activeFilter}
                    counts={filteredQuickCounts}
                    onSelect={(f) => setActiveFilter(f)}
                  />

                  <button
                    type="button"
                    className="btn outline sm"
                    onClick={() => void loadTodayBoard()}
                    title="Refresh live status"
                  >
                    <span>↻</span> Refresh
                  </button>
                </div>

                {/* Live team roster */}
                <TodayLiveTable rows={filteredTodayRows} />
              </div>
            </div>
          )}

          {activeTab === 'range' && (
            <DateRangeLedgerTable departments={departments} members={members} />
          )}

          {activeTab === 'summary' && (
            <PunctualitySummaryTable departments={departments} />
          )}
        </>
      )}
    </div>
  )
}
