import { useCallback, useEffect, useState } from 'react'
import { PageHero } from '../../../shared/ui/PageHero'
import { initials } from '../../../shared/lib/format'
import { fmtDate } from '../../../shared/lib/date'
import { dashboardApi } from '../dashboard.api'
import type { DashboardView } from '../dashboard.types'
import { DashboardKpiCards } from '../components/DashboardKpiCards'
import { DepartmentBars } from '../components/DepartmentBars'
import { AttentionPanel } from '../components/AttentionPanel'
import { LiveAttendanceTable } from '../components/LiveAttendanceTable'

/**
 * The operations dashboard.
 *
 * Admin sees the company, a manager sees their reporting tree — decided by the
 * API from who is asking, so there is no scope control on this page and nothing
 * in the URL to change.
 *
 * One card is deliberately empty. "Recent achievements" exists in the design but
 * HRMS has no achievements to draw on — there is no field, no table and no way
 * to record one. Rather than invent a data model or quietly drop the card, it
 * says what it is waiting for.
 */
export function DashboardPage() {
  const [view, setView] = useState<DashboardView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setView(await dashboardApi.get())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [load])

  if (loading) {
    return (
      <div className="page">
        <PageHero navKey="dash" />
        <div className="card">
          <div className="empty">Loading…</div>
        </div>
      </div>
    )
  }

  if (error || !view) {
    return (
      <div className="page">
        <PageHero navKey="dash" />
        <div className="notice bad" role="alert">
          {error ?? 'Could not load the dashboard.'}
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHero
        navKey="dash"
        eyebrow={`${view.scope === 'company' ? 'Everyone on the payroll' : 'Your reporting tree'} · ${fmtDate(view.date)}`}
      />

      <DashboardKpiCards kpis={view.kpis} scope={view.scope} />

      <div className="grid g23 mt">
        <div className="card">
          <h3>
            Active hours by department <span className="sub">· today</span>
          </h3>
          <DepartmentBars rows={view.departments} />
        </div>
        <div className="card">
          <h3>Needs your attention</h3>
          <AttentionPanel items={view.attention} />
        </div>
      </div>

      <div className="grid g23 mt">
        <div className="card">
          <h3>
            Live attendance <span className="sub">· click a row to open the profile</span>
          </h3>
          <LiveAttendanceTable rows={view.live} />
        </div>

        <div>
          <div className="card">
            <h3>Recent achievements</h3>
            {/* Deliberately empty. Nothing in HRMS records an achievement yet —
                see the note at the top of this file. */}
            <div className="empty">
              <b>Not recorded yet</b>
              There is nowhere to log an achievement in HRMS, so there is nothing
              to show here.
            </div>
          </div>

          <div className="card mt">
            <h3>On leave today</h3>
            {view.onLeave.length === 0 ? (
              <div className="empty">Everyone is in today.</div>
            ) : (
              view.onLeave.map((person) => (
                <div className="ach" key={person.employeeId}>
                  <span className="avatar sm" style={{ background: 'var(--muted2)' }}>
                    {initials(person.name)}
                  </span>
                  <div>
                    <b style={{ fontSize: 12.5 }}>{person.name}</b>
                    <div style={{ color: 'var(--muted)' }}>{person.leaveType} leave</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
