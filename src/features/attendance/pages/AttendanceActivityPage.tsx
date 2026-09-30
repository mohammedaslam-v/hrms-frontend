import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHero } from '../../../shared/ui/PageHero'
import { fmtDate } from '../../../shared/lib/date'
import { attendanceApi } from '../attendance.api'
import type { AttendanceTab, TodayBoardDto } from '../attendance.types'
import { AttendanceStatsCards } from '../components/AttendanceStatsCards'
import { AttendanceQuickFilters } from '../components/AttendanceQuickFilters'
import { TodayLiveTable } from '../components/TodayLiveTable'
import { DateRangeLedgerTable } from '../components/DateRangeLedgerTable'
import { PunctualitySummaryTable } from '../components/PunctualitySummaryTable'
import { useAuth } from '../../../app/auth-context'

export function AttendanceActivityPage() {
  const { employee } = useAuth()
  const isManager = employee.tiers.includes('manager') || employee.tiers.includes('admin')

  const [activeTab, setActiveTab] = useState<AttendanceTab>('today')
  const [activeFilter, setActiveFilter] = useState<string>('')
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

  // Extract unique departments and members for child filters
  const departments = useMemo(() => {
    if (!board) return []
    const set = new Set<string>()
    board.roster.forEach((r) => {
      if (r.department) set.add(r.department)
    })
    return Array.from(set).sort()
  }, [board])

  const members = useMemo(() => {
    if (!board) return []
    return board.roster
      .map((r) => ({ id: r.employeeId, name: r.name, code: r.code }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [board])

  // Filtered rows for Today's live table based on selected pill
  const filteredTodayRows = useMemo(() => {
    if (!board) return []
    if (!activeFilter) return board.roster

    if (activeFilter === 'Weekly off') {
      return board.roster.filter(
        (r) => r.status === 'Weekly off' || r.status === 'Holiday',
      )
    }

    if (activeFilter === 'Absent') {
      return board.roster.filter(
        (r) => r.status === 'Absent' || r.status === 'Not in yet',
      )
    }

    if (activeFilter === 'Leave') {
      return board.roster.filter(
        (r) => r.status === 'Leave' || r.status === 'Half day',
      )
    }

    return board.roster.filter((r) => r.status === activeFilter)
  }, [board, activeFilter])

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
          {board && <span className="n">{board.roster.length}</span>}
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
              {/* 5 KPI Stat Cards */}
              <AttendanceStatsCards kpis={board.kpis} />

              <div className="card mt" style={{ padding: '18px 20px' }}>
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
                  {/* Quick-filter status pills */}
                  <AttendanceQuickFilters
                    activeFilter={activeFilter}
                    counts={board.quickCounts}
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
