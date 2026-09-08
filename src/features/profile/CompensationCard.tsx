import type { CompensationView } from './profile.types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Indian grouping — ₹11,00,000, not ₹1,100,000. Whole rupees; pay has no paise. */
const inr = (amount: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)

const fmtDate = (iso: string): string => {
  const [y, m, d] = iso.split('-')
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="kv">
      <b>{label}</b>
      <span style={muted ? { color: 'var(--muted2)' } : undefined}>{value}</span>
    </div>
  )
}

interface CompensationCardProps {
  canSee: boolean
  compensation: CompensationView | null
}

/**
 * Compensation.
 *
 * Deliberately incomplete against the design: it omits **monthly gross** and
 * **annual tax**, which are derived from CTC by the salary engine. That engine
 * belongs to the Salary page, and a second formula here is how a payslip and a
 * profile end up disagreeing about the same person.
 */
export function CompensationCard({ canSee, compensation }: CompensationCardProps) {
  if (!canSee) {
    return (
      <div className="card">
        <h3>Compensation</h3>
        <div className="empty">
          <b>Not visible to you</b>
          Compensation is between the employee, HR and the founder.
        </div>
      </div>
    )
  }

  if (!compensation) {
    return (
      <div className="card">
        <h3>Compensation</h3>
        <div className="empty">
          <b>Nothing on record</b>
          Salary details have not been loaded into HRMS yet.
        </div>
      </div>
    )
  }

  const c = compensation
  const vested = Math.min(100, Math.max(0, c.esopVestedPct))

  return (
    <div className="card">
      <h3>Compensation</h3>

      <Row label="Annual CTC" value={inr(c.ctc)} />
      <Row label="Variable" value={c.variablePay ? inr(c.variablePay) : '—'} muted={!c.variablePay} />
      <Row label="Bonus" value={c.bonus ? inr(c.bonus) : '—'} muted={!c.bonus} />
      <Row
        label="ESOPs"
        value={c.esopUnits ? `${c.esopUnits.toLocaleString('en-IN')} units` : '—'}
        muted={!c.esopUnits}
      />

      {/* Only meaningful when there is a grant — an empty bar under "0 units"
          reads as a target somebody is failing to reach. */}
      {c.esopUnits > 0 && (
        <div className="mt">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              marginBottom: 6,
            }}
          >
            <b style={{ fontWeight: 500, color: 'var(--muted2)' }}>ESOP vested</b>
            <span>
              {vested}% · {c.esopVestedUnits.toLocaleString('en-IN')} units
            </span>
          </div>
          <div className="bar">
            <i style={{ width: `${vested}%`, background: 'var(--violet)' }} />
          </div>
        </div>
      )}

      <div className="hint mt8">
        In force since {fmtDate(c.effectiveFrom)}
        {c.revisionNote ? ` · ${c.revisionNote}` : ''}. Monthly gross and annual tax are worked
        out by the payroll engine and appear on My salary &amp; payslips.
      </div>
    </div>
  )
}
