import { formatNumberInr } from '../../../shared/lib/format'
import type { SlabBreakupRow } from '../tax.types'

interface SlabWiseTaxCardProps {
  slabRows: SlabBreakupRow[]
}

export function SlabWiseTaxCard({ slabRows }: SlabWiseTaxCardProps) {
  const maxTax = Math.max(...slabRows.map((r) => r.tax), 1)

  return (
    <div className="card">
      <h3>Slab-wise tax</h3>
      <div className="scroll">
        <table className="ladder">
          <thead>
            <tr>
              <th>Slab</th>
              <th className="num-col">Rate</th>
              <th className="num-col">Taxed</th>
              <th className="num-col">Tax</th>
            </tr>
          </thead>
          <tbody id="taxLadder">
            {slabRows.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="empty">
                    Taxable income is below ₹4,00,000 — no tax on the slabs.
                  </div>
                </td>
              </tr>
            ) : (
              slabRows.map((r, idx) => {
                const barWidth = maxTax > 0 ? (r.tax / maxTax) * 100 : 0
                return (
                  <tr key={idx}>
                    <td>
                      {formatNumberInr(r.from)}
                      {r.to ? ` – ${formatNumberInr(r.to)}` : ' and above'}
                      <div className="slabbar">
                        <i
                          style={{
                            display: 'block',
                            height: '100%',
                            width: `${barWidth}%`,
                            background: 'var(--saffron, #dd8b08)',
                            borderRadius: 99,
                          }}
                        />
                      </div>
                    </td>
                    <td className="num-col">{(r.rate * 100).toFixed(0)}%</td>
                    <td className="num-col">{formatNumberInr(r.amount)}</td>
                    <td className="num-col">
                      <b>{formatNumberInr(r.tax)}</b>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
