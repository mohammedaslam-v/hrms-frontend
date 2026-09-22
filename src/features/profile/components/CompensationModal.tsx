import { useState } from 'react'
import type { CompensationView } from '../profile.types'
import { profileApi } from '../profile.api'
import { calculateSalaryBreakout, formatInr, formatNumberInr } from '../salary.utils'

interface CompensationModalProps {
  employeeId: number
  employeeName: string
  existingCompensation: CompensationView | null
  onClose: () => void
  onSuccess: () => void
}

export function CompensationModal({
  employeeId,
  employeeName,
  existingCompensation,
  onClose,
  onSuccess,
}: CompensationModalProps) {
  const today = new Date().toISOString().slice(0, 10)

  const [ctc, setCtc] = useState<string>(
    existingCompensation?.ctc ? String(existingCompensation.ctc) : '600000',
  )
  const [variablePay, setVariablePay] = useState<string>(
    existingCompensation?.variablePay ? String(existingCompensation.variablePay) : '0',
  )
  const [bonus, setBonus] = useState<string>(
    existingCompensation?.bonus ? String(existingCompensation.bonus) : '0',
  )
  const [esopUnits, setEsopUnits] = useState<string>(
    existingCompensation?.esopUnits ? String(existingCompensation.esopUnits) : '0',
  )
  const [esopVestedPct, setEsopVestedPct] = useState<string>(
    existingCompensation?.esopVestedPct !== undefined
      ? String(existingCompensation.esopVestedPct)
      : '0',
  )
  const [effectiveFrom, setEffectiveFrom] = useState<string>(
    existingCompensation?.effectiveFrom ? existingCompensation.effectiveFrom.slice(0, 10) : today,
  )
  const [revisionNote, setRevisionNote] = useState<string>(
    existingCompensation?.revisionNote || '',
  )

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedCtc = Math.max(0, Number(ctc) || 0)
  const breakout = calculateSalaryBreakout(parsedCtc)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (parsedCtc <= 0) {
      setError('Please enter a valid Annual CTC greater than 0.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await profileApi.updateCompensation(employeeId, {
        ctc: parsedCtc,
        variablePay: Number(variablePay) || 0,
        bonus: Number(bonus) || 0,
        esopUnits: Number(esopUnits) || 0,
        esopVestedPct: Number(esopVestedPct) || 0,
        effectiveFrom: effectiveFrom || today,
        revisionNote: revisionNote.trim() || undefined,
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save compensation.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          maxWidth: 720,
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          padding: '24px 28px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 20,
            paddingBottom: 12,
            borderBottom: '1px solid #edf2f7',
          }}
        >
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1e293b', margin: 0 }}>
              {existingCompensation ? 'Revise Compensation' : 'Set Compensation'}
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 0 }}>
              Configuring salary package and statutory break-up for <strong>{employeeName}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              color: '#94a3b8',
              cursor: 'pointer',
              lineHeight: 1,
              padding: 4,
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 6,
              color: '#991b1b',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {/* CTC */}
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Annual CTC (₹) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={ctc}
                onChange={(e) => setCtc(e.target.value)}
                placeholder="600000"
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#0f172a',
                }}
              />
              <span style={{ fontSize: 11, color: '#64748b', marginTop: 3, display: 'block' }}>
                {parsedCtc > 0 ? `Format: ${formatInr(parsedCtc)}/year (₹${formatNumberInr(Math.round(parsedCtc / 12))}/mo)` : 'Enter whole annual amount'}
              </span>
            </div>

            {/* Effective From */}
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Effective From <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 13.5,
                  color: '#0f172a',
                }}
              />
              <span style={{ fontSize: 11, color: '#64748b', marginTop: 3, display: 'block' }}>
                Date when this compensation takes effect
              </span>
            </div>

            {/* Variable Pay */}
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#334155', marginBottom: 4 }}>
                Variable Pay (₹ / year)
              </label>
              <input
                type="number"
                min="0"
                value={variablePay}
                onChange={(e) => setVariablePay(e.target.value)}
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 13.5,
                }}
              />
            </div>

            {/* Bonus */}
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#334155', marginBottom: 4 }}>
                Joining / Performance Bonus (₹)
              </label>
              <input
                type="number"
                min="0"
                value={bonus}
                onChange={(e) => setBonus(e.target.value)}
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 13.5,
                }}
              />
            </div>

            {/* ESOP Units */}
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#334155', marginBottom: 4 }}>
                ESOP Units (Stock Grant)
              </label>
              <input
                type="number"
                min="0"
                value={esopUnits}
                onChange={(e) => setEsopUnits(e.target.value)}
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 13.5,
                }}
              />
            </div>

            {/* ESOP Vested % */}
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#334155', marginBottom: 4 }}>
                ESOP Vested Share (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={esopVestedPct}
                onChange={(e) => setEsopVestedPct(e.target.value)}
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 13.5,
                }}
              />
            </div>

            {/* Revision Note */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#334155', marginBottom: 4 }}>
                Revision Note
              </label>
              <input
                type="text"
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="e.g. Annual compensation revision, Offer package, Promotion"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 13.5,
                }}
              />
            </div>
          </div>

          {/* Live Salary Breakout Preview Table */}
          <div style={{ marginTop: 22, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Live Salary Breakout Preview
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>
                {parsedCtc > 0 ? formatInr(parsedCtc) : '—'}
              </div>
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '9px 14px', fontWeight: 600, color: '#475569' }}>Component</th>
                    <th style={{ padding: '9px 14px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>
                      Annual Amount
                    </th>
                    <th style={{ padding: '9px 14px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>
                      Monthly Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {breakout.rows.map((row, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: row.isTotal ? 'none' : '1px solid #f1f5f9',
                        backgroundColor: row.isTotal ? '#f0fdf4' : idx % 2 === 1 ? '#fafafa' : '#ffffff',
                        fontWeight: row.isTotal ? 700 : 400,
                        color: row.isTotal ? '#15803d' : '#1e293b',
                      }}
                    >
                      <td style={{ padding: '8px 14px' }}>{row.component}</td>
                      <td style={{ padding: '8px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {formatNumberInr(row.annualAmount)}
                      </td>
                      <td style={{ padding: '8px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {formatNumberInr(row.monthlyAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 8, fontSize: 11.5, color: '#64748b' }}>
              * Other Allowances serves as the balancing figure ensuring the statutory structure totals back to exact CTC.
            </div>
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 24,
              paddingTop: 16,
              borderTop: '1px solid #edf2f7',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn ghost sm"
              style={{ border: '1px solid #cbd5e1' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn primary sm"
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontWeight: 600,
                padding: '8px 18px',
                borderRadius: 6,
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              }}
            >
              {submitting ? 'Saving...' : existingCompensation ? 'Update Revision' : 'Save Compensation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
