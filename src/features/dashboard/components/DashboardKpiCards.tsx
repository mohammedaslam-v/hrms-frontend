import type { CSSProperties, ReactNode } from 'react'
import type { DashboardKpis } from '../dashboard.types'

/**
 * The five figures across the top, in the order the design fixes them:
 * headcount, in today, late, no login, on leave.
 *
 * Colours and icons follow the prototype's KPI tones rather than being invented
 * here — the same green means "good" on every page in the portal.
 */
const icon = (paths: ReactNode) => (
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
    {paths}
  </svg>
)

export function DashboardKpiCards({
  kpis,
  scope,
}: {
  kpis: DashboardKpis
  scope: 'company' | 'team'
}) {
  const cards = [
    {
      key: 'headcount',
      c: '#2563EB',
      cs: '#EAF0FE',
      label: scope === 'company' ? 'People on the payroll' : 'People reporting to you',
      num: String(kpis.headcount),
      icon: icon(
        <>
          <circle cx="9" cy="7.5" r="3.4" />
          <path d="M2.8 20a6.2 6.2 0 0 1 12.4 0M16 4.6a3.4 3.4 0 0 1 0 5.8M17.6 14a4.2 4.2 0 0 1 3.6 4.1V20" />
        </>,
      ),
    },
    {
      key: 'loggedIn',
      c: '#0FA968',
      cs: '#E6F6EE',
      label: 'Logged in today',
      // Shown as a fraction because "12" alone says nothing without the roster.
      num: `${kpis.loggedIn} / ${kpis.headcount}`,
      icon: icon(
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M8.2 12.4l2.6 2.6 5-5" />
        </>,
      ),
    },
    {
      key: 'late',
      c: '#EA6A18',
      cs: '#FDEFE4',
      label: 'Late logins today',
      num: String(kpis.late),
      icon: icon(
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5.2l3.3 2" />
        </>,
      ),
    },
    {
      key: 'noLogin',
      c: '#8B2E2E',
      cs: '#F7EAEA',
      label: 'No login activity',
      num: String(kpis.noLogin),
      icon: icon(
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M9 9l6 6M15 9l-6 6" />
        </>,
      ),
    },
    {
      key: 'onLeave',
      c: '#6D53F0',
      cs: '#EEEAFE',
      label: 'On approved leave',
      num: String(kpis.onLeave),
      icon: icon(
        <>
          <rect x="3.5" y="5" width="17" height="15" rx="3" />
          <path d="M3.5 10h17M8.5 3.2v3.6M15.5 3.2v3.6" />
        </>,
      ),
    },
  ]

  return (
    <div className="grid g5">
      {cards.map((c) => (
        <div className="kpi" key={c.key}>
          <div className="kpi-head">
            <span className="kpi-ico" style={{ '--c': c.c, '--cs': c.cs } as CSSProperties}>
              {c.icon}
            </span>
            <span className="kpi-lbl">{c.label}</span>
          </div>
          <div className="kpi-num">{c.num}</div>
        </div>
      ))}
    </div>
  )
}
