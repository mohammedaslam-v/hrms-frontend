import { formatInr } from '../../../shared/lib/format'
import type { ReimbursementSummary } from '../reimbursement.types'

interface ReimbursementSummaryCardsProps {
  summary: ReimbursementSummary
}

export function ReimbursementSummaryCards({ summary }: ReimbursementSummaryCardsProps) {
  const cards = [
    {
      key: 'claimed',
      label: 'Total Claimed',
      value: formatInr(summary.totalClaimed),
      icon: '🧾',
      toneColor: '#2563eb',
      toneBg: 'rgba(37, 99, 235, 0.08)',
      valueColor: 'var(--ink, #0f1729)',
    },
    {
      key: 'approved',
      label: 'Approved (Pending Payout)',
      value: formatInr(summary.totalApproved),
      icon: '✓',
      toneColor: '#0fa968',
      toneBg: 'rgba(15, 169, 104, 0.1)',
      valueColor: 'var(--green, #0fa968)',
    },
    {
      key: 'paid',
      label: 'Paid Out',
      value: formatInr(summary.totalPaid),
      icon: '⚡',
      toneColor: '#6d53f0',
      toneBg: 'rgba(109, 83, 240, 0.1)',
      valueColor: '#6d53f0',
    },
    {
      key: 'pending',
      label: 'Pending HR Review',
      value: formatInr(summary.totalPending),
      badge: summary.pendingCount > 0 ? `${summary.pendingCount} in queue` : undefined,
      icon: '⏳',
      toneColor: '#dd8b08',
      toneBg: 'rgba(221, 139, 8, 0.1)',
      valueColor: 'var(--amber, #dd8b08)',
    },
  ]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 10,
        marginBottom: 14,
      }}
    >
      {cards.map((c) => (
        <div
          key={c.key}
          style={{
            background: 'var(--card, #ffffff)',
            border: '1px solid var(--line, #ede7de)',
            borderRadius: 10,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
          }}
        >
          {/* Left: Icon Badge */}
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: c.toneBg,
              color: c.toneColor,
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            {c.icon}
          </span>

          {/* Right: Label & Value */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--muted2, #667085)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 4,
              }}
            >
              <span>{c.label}</span>
              {c.badge && (
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 4,
                    background: c.toneBg,
                    color: c.toneColor,
                    textTransform: 'none',
                    letterSpacing: 0,
                  }}
                >
                  {c.badge}
                </span>
              )}
            </div>

            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: c.valueColor,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1.25,
                marginTop: 2,
              }}
            >
              {c.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
