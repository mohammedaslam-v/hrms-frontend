import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CompensationView } from '../profile.types'
import { calculateSalaryBreakout, formatInr, formatNumberInr } from '../salary.utils'
import { CompensationModal } from './CompensationModal'

interface CompensationCardProps {
  canSee: boolean
  compensation: CompensationView | null
  employeeId: number
  employeeName: string
  isAdmin?: boolean
  isContractor?: boolean
  /** For professional tax, which is set state by state. */
  workState?: string | null
  onRefresh?: () => void
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="kv" style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
      <b>{label}</b>
      <span style={muted ? { color: 'var(--muted2)' } : undefined}>{value}</span>
    </div>
  )
}

export function CompensationCard({
  canSee,
  compensation,
  employeeId,
  employeeName,
  isAdmin = false,
  isContractor = false,
  workState,
  onRefresh,
}: CompensationCardProps) {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [viewMode, setViewMode] = useState<'breakout' | 'summary'>('breakout')

  if (!canSee) {
    return (
      <div className="card top-card">
        <h3>Compensation</h3>
        <div className="empty">
          <b>Not visible to you</b>
          Compensation is between the employee, HR and the founder.
        </div>
      </div>
    )
  }

  // Contractor View
  if (isContractor) {
    const retainer = compensation?.ctc || 0
    const monthlyRetainer = Math.round(retainer / 12)

    return (
      <div className="card top-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Contractor Retainer</h3>
          {isAdmin && (
            <button
              type="button"
              className="btn sm outline"
              onClick={() => setShowModal(true)}
              style={{ fontSize: 11.5, padding: '4px 10px', height: 'auto' }}
            >
              {compensation ? '✏️ Edit Retainer' : '+ Set Retainer'}
            </button>
          )}
        </div>

        {retainer === 0 ? (
          <div className="empty">
            <b>No retainer set</b>
            Contract terms and monthly fee have not been loaded yet.
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '10px 12px',
                }}
              >
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Annual Value
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                  {formatInr(retainer)}
                </div>
              </div>
              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 8,
                  padding: '10px 12px',
                }}
              >
                <div style={{ fontSize: 11, color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>
                  Monthly Fee
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#15803d', marginTop: 2 }}>
                  {formatInr(monthlyRetainer)}
                </div>
              </div>
            </div>

            <Row label="Engagement Type" value="Independent Contractor" />
            <Row label="Disbursement Cycle" value="Monthly invoice / claim" />
            <Row label="TDS Deduction" value="Section 194J (10%) / 194C (1–2%)" />
            {compensation?.revisionNote && <Row label="Notes" value={compensation.revisionNote} />}

            <div className="hint mt8" style={{ fontSize: 11.5, color: '#64748b' }}>
              ℹ️ Contractor agreement — statutory EPF, HRA, and Gratuity contributions are not applicable.
            </div>

            <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--line2)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn sm outline"
                onClick={() => navigate(`/pay/${employeeId}`)}
                style={{ fontSize: 11.5, padding: '4px 10px', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <span>📄 View Retainer Statements</span>
                <span style={{ fontSize: 13 }}>→</span>
              </button>
            </div>
          </div>
        )}

        {showModal && (
          <CompensationModal
            employeeId={employeeId}
            employeeName={employeeName}
            workState={workState}
            existingCompensation={compensation}
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              setShowModal(false)
              onRefresh?.()
            }}
          />
        )}
      </div>
    )
  }

  // Full-time employee with No Compensation record
  if (!compensation) {
    return (
      <div className="card top-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Compensation</h3>
          {isAdmin && (
            <button
              type="button"
              className="btn sm primary"
              onClick={() => setShowModal(true)}
              style={{ fontSize: 11.5, padding: '4px 10px', height: 'auto' }}
            >
              + Set Compensation
            </button>
          )}
        </div>
        <div className="empty">
          <b>Nothing on record</b>
          Salary details have not been loaded into HRMS yet.
          {isAdmin && (
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                className="btn sm outline"
                onClick={() => setShowModal(true)}
                style={{ fontSize: 12 }}
              >
                Configure Salary Package
              </button>
            </div>
          )}
        </div>

        {showModal && (
          <CompensationModal
            employeeId={employeeId}
            employeeName={employeeName}
            workState={workState}
            existingCompensation={null}
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              setShowModal(false)
              onRefresh?.()
            }}
          />
        )}
      </div>
    )
  }

  const c = compensation
  const breakout = calculateSalaryBreakout(c.ctc, workState ?? '')

  return (
    <div className="card top-card" style={{ position: 'relative' }}>
      {/* Card Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0 }}>Compensation</h3>
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: '#f1f5f9',
              borderRadius: 6,
              padding: 2,
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('breakout')}
              style={{
                background: viewMode === 'breakout' ? '#ffffff' : 'transparent',
                border: 'none',
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: viewMode === 'breakout' ? 600 : 400,
                color: viewMode === 'breakout' ? '#0f172a' : '#64748b',
                cursor: 'pointer',
                boxShadow: viewMode === 'breakout' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              }}
            >
              Breakout
            </button>
            <button
              type="button"
              onClick={() => setViewMode('summary')}
              style={{
                background: viewMode === 'summary' ? '#ffffff' : 'transparent',
                border: 'none',
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: viewMode === 'summary' ? 600 : 400,
                color: viewMode === 'summary' ? '#0f172a' : '#64748b',
                cursor: 'pointer',
                boxShadow: viewMode === 'summary' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              }}
            >
              Summary
            </button>
          </div>
        </div>

        {isAdmin && (
          <button
            type="button"
            className="btn sm outline"
            onClick={() => setShowModal(true)}
            style={{ fontSize: 11, padding: '3px 8px', height: 'auto' }}
            title="Edit / Revise Employee Compensation"
          >
            ✏️ Edit
          </button>
        )}
      </div>

      {/* Primary KPI Pills */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '6px 10px',
          }}
        >
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Annual CTC
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginTop: 1 }}>
            {formatInr(c.ctc)}
          </div>
        </div>
        <div
          style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 8,
            padding: '6px 10px',
          }}
        >
          <div style={{ fontSize: 10, color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>
            Monthly Gross
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#15803d', marginTop: 1 }}>
            {formatInr(breakout.monthlyGross)}
          </div>
        </div>
      </div>

      {/* Breakout Table View (Matches User's Screenshot) */}
      {viewMode === 'breakout' ? (
        // Takes only the height the fixed-size card has left, so the table
        // scrolls inside it instead of spilling over the card below.
        <div
          style={{
            marginBottom: 6,
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Table Header Pill */}
          <div
            style={{
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderBottom: 'none',
              borderTopLeftRadius: 6,
              borderTopRightRadius: 6,
              padding: '3px 8px',
              fontSize: 12,
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            {formatNumberInr(c.ctc)}
          </div>

          <div
            style={{
              overflowX: 'auto',
              overflowY: 'auto',
              flex: 1,
              minHeight: 0,
              border: '1px solid #cbd5e1',
              borderBottomLeftRadius: 6,
              borderBottomRightRadius: 6,
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 11,
                textAlign: 'left',
              }}
            >
              <thead>
                {/* Header cells are sticky individually: sticky on a <tr> is not
                    honoured by every browser, on a <th> it is. */}
                <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ position: 'sticky', top: 0, zIndex: 1, background: '#ffffff', boxShadow: '0 1px 0 #cbd5e1', padding: '4px 8px', fontWeight: 700, color: '#1e293b' }}>Component</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 1, background: '#ffffff', boxShadow: '0 1px 0 #cbd5e1', padding: '4px 8px', fontWeight: 700, color: '#1e293b', textAlign: 'right' }}>
                    Annual Amount
                  </th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 1, background: '#ffffff', boxShadow: '0 1px 0 #cbd5e1', padding: '4px 8px', fontWeight: 700, color: '#1e293b', textAlign: 'right' }}>
                    Monthly Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {breakout.rows.map((row, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: idx === breakout.rows.length - 1 ? 'none' : '1px solid #e2e8f0',
                      backgroundColor: row.isTotal ? '#f0fdf4' : idx % 2 === 1 ? '#fafafa' : '#ffffff',
                      fontWeight: row.isTotal || row.isSubtotal ? 700 : 400,
                      color: row.isTotal ? '#15803d' : '#1e293b',
                    }}
                  >
                    <td style={{ padding: '3.5px 8px' }}>{row.component}</td>
                    <td style={{ padding: '3.5px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {formatNumberInr(row.annualAmount)}
                    </td>
                    <td style={{ padding: '3.5px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {formatNumberInr(row.monthlyAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Summary Key-Value View */
        <div style={{ marginBottom: 10 }}>
          <Row label="Annual CTC" value={formatInr(c.ctc)} />
          <Row label="Monthly Gross" value={formatInr(breakout.monthlyGross)} />
          <Row
            label="Variable Pay"
            value={c.variablePay ? formatInr(c.variablePay) : '—'}
            muted={!c.variablePay}
          />
          <Row label="Bonus" value={c.bonus ? formatInr(c.bonus) : '—'} muted={!c.bonus} />
        </div>
      )}


      {/* Quick Action: View Full Salary Slip & Payslips */}
      <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--line2)', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn sm outline"
          onClick={() => navigate(`/pay/${employeeId}`)}
          style={{ fontSize: 11, padding: '3px 8px', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <span>📄 View Salary Slip &amp; Payslips</span>
          <span style={{ fontSize: 12 }}>→</span>
        </button>
      </div>

      {showModal && (
        <CompensationModal
          employeeId={employeeId}
          employeeName={employeeName}
          workState={workState}
          existingCompensation={compensation}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            onRefresh?.()
          }}
        />
      )}
    </div>
  )
}
