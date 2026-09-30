import type { CSSProperties, ReactNode } from 'react'
import type { TodayBoardKpis } from '../attendance.types'

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

export function AttendanceStatsCards({ kpis }: { kpis: TodayBoardKpis }) {
  const cards = [
    {
      key: 'onTime',
      c: '#0FA968',
      cs: '#E6F6EE',
      label: 'On time',
      sub: 'logged in within grace window',
      num: String(kpis.onTime),
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
      label: 'Late login',
      sub: '> 15 mins after shift start',
      num: String(kpis.late),
      icon: icon(
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5.2l3.3 2" />
        </>,
      ),
    },
    {
      key: 'absent',
      c: '#8B2E2E',
      cs: '#F7EAEA',
      label: 'No login activity',
      sub: 'working day with no punches',
      num: String(kpis.absent),
      icon: icon(
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M9 9l6 6M15 9l-6 6" />
        </>,
      ),
    },
    {
      key: 'leave',
      c: '#6D53F0',
      cs: '#EEEAFE',
      label: 'On leave',
      sub: 'approved and deducted from balance',
      num: String(kpis.leave),
      icon: icon(
        <>
          <rect x="3.5" y="5" width="17" height="15" rx="3" />
          <path d="M3.5 10h17M8.5 3.2v3.6M15.5 3.2v3.6" />
        </>,
      ),
    },
    {
      key: 'off',
      c: '#2563EB',
      cs: '#EAF0FE',
      label: 'Off / holiday',
      sub: 'weekly off or company holiday',
      num: String(kpis.off),
      icon: icon(
        <>
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10M6 10h10" />
        </>,
      ),
    },
  ]

  return (
    <div className="grid g5">
      {cards.map((c) => (
        <div className="kpi" key={c.key} title={c.sub}>
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
