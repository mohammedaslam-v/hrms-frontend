import type { CSSProperties, ReactNode } from 'react'
import { formatInr } from '../../../shared/lib/format'
import type { TaxComputationView } from '../tax.types'

interface TaxStatsCardsProps {
  computation: TaxComputationView
}

const formatLakh = (n: number): string => {
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + 'Cr'
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L'
  return formatInr(n)
}

interface StatItem {
  key: string
  label: string
  num: string
  c: string
  cs: string
  icon: ReactNode
}

export function TaxStatsCards({ computation }: TaxStatsCardsProps) {
  const cards: StatItem[] = [
    {
      key: 'gross',
      label: 'Gross salary this FY',
      num: formatLakh(computation.grossSalary),
      c: '#2563EB',
      cs: 'var(--blue-soft, #eaf0fe)',
      icon: (
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
          <path d="M16 19v-1.6a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V19" />
          <circle cx="9" cy="7" r="3.2" />
          <path d="M17.5 13.6a4 4 0 0 1 2.8 3.8V19" />
        </svg>
      ),
    },
    {
      key: 'taxable',
      label: 'Taxable income',
      num: formatLakh(computation.taxableIncome),
      c: '#DD8B08',
      cs: 'var(--amber-soft, #fdf3e0)',
      icon: (
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
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4.6" />
        </svg>
      ),
    },
    {
      key: 'totalTax',
      label: 'Total tax for the year',
      num: formatInr(computation.totalTax),
      c: '#EA6A18',
      cs: 'var(--orange-soft, #fdf3e0)',
      icon: (
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
          <path d="M10.3 3.9L1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      ),
    },
    {
      key: 'monthlyTds',
      label: 'TDS each month',
      num: formatInr(computation.monthlyTds),
      c: '#0FA968',
      cs: 'var(--green-soft, #e6f6ee)',
      icon: (
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
          <circle cx="12" cy="12" r="9" />
          <path d="M8.2 12.4l2.6 2.6 5-5" />
        </svg>
      ),
    },
  ]

  return (
    <div className="grid g4" id="taxStats">
      {cards.map((c) => {
        const styleVariables = {
          '--c': c.c,
          '--cs': c.cs,
        } as CSSProperties

        return (
          <div className="kpi" key={c.key}>
            <div className="kpi-head">
              <span className="kpi-ico" style={styleVariables}>
                {c.icon}
              </span>
              <span className="kpi-lbl">{c.label}</span>
            </div>
            <div className="kpi-num">{c.num}</div>
          </div>
        )
      })}
    </div>
  )
}
