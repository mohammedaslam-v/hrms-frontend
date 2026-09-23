import { formatInr } from '../../../shared/lib/format'
import type { AnnualStructureView } from '../salary.types'

interface AnnualStructureCardProps {
  structure: AnnualStructureView
}

export function AnnualStructureCard({ structure }: AnnualStructureCardProps) {
  return (
    <div className="card">
      <h3>Annual structure</h3>
      <div>
        <div className="kv">
          <b>Basic (40% of CTC)</b>
          <span>{formatInr(structure.basicAnnual)}</span>
        </div>
        <div className="kv">
          <b>House rent allowance</b>
          <span>{formatInr(structure.hraAnnual)}</span>
        </div>
        <div className="kv">
          <b>Other allowances</b>
          <span>{formatInr(structure.specialAnnual)}</span>
        </div>
        <div className="kv">
          <b>Employee PF (12%)</b>
          <span>{formatInr(structure.eePfAnnual)}</span>
        </div>
        <div className="kv">
          <b>Employer PF</b>
          <span>{formatInr(structure.erPfAnnual)}</span>
        </div>
        <div className="kv">
          <b>Gratuity provision</b>
          <span>{formatInr(structure.gratuityAnnual)}</span>
        </div>

        {structure.variablePay > 0 && (
          <div className="kv">
            <b>Variable pay (annual)</b>
            <span>{formatInr(structure.variablePay)}</span>
          </div>
        )}

        {structure.bonus > 0 && (
          <div className="kv">
            <b>Bonus</b>
            <span>{formatInr(structure.bonus)}</span>
          </div>
        )}

        <div className="kv total">
          <b>Annual CTC</b>
          <span>{formatInr(structure.ctc)}</span>
        </div>
        <div className="kv">
          <b>Monthly gross</b>
          <span>{formatInr(structure.grossMonthly)}</span>
        </div>
        <div className="kv">
          <b>Annual tax (new regime)</b>
          <span>{formatInr(structure.annualTax)}</span>
        </div>
      </div>
    </div>
  )
}
