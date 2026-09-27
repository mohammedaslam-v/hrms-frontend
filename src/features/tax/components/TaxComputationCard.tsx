import { formatInr } from '../../../shared/lib/format'
import type { MyTaxResponse } from '../tax.types'
import { exportTaxCsv, printTaxComputation } from '../tax.export'

interface TaxComputationCardProps {
  taxData: MyTaxResponse
}

export function TaxComputationCard({ taxData }: TaxComputationCardProps) {
  const { computation, company } = taxData

  return (
    <div className="card">
      <h3>
        Tax computation{' '}
        <span className="sub">
          · new regime, section 115BAC · FY {company.fy} (AY {company.ay})
        </span>
      </h3>

      <div id="taxCompute">
        <div className="kv">
          <b>Basic salary</b>
          <span>{formatInr(computation.basicAnnual)}</span>
        </div>
        <div className="kv">
          <b>House rent allowance</b>
          <span>{formatInr(computation.hraAnnual)}</span>
        </div>
        <div className="kv">
          <b>Special allowance</b>
          <span>{formatInr(computation.specialAnnual)}</span>
        </div>

        {computation.variablePay > 0 && (
          <div className="kv">
            <b>Variable pay</b>
            <span>{formatInr(computation.variablePay)}</span>
          </div>
        )}

        {computation.bonus > 0 && (
          <div className="kv">
            <b>Bonus</b>
            <span>{formatInr(computation.bonus)}</span>
          </div>
        )}

        <div className="kv total">
          <b>Gross salary</b>
          <b>{formatInr(computation.grossSalary)}</b>
        </div>

        <div className="kv">
          <b>Less: standard deduction u/s 16(ia)</b>
          <span>− {formatInr(computation.stdDeduction)}</span>
        </div>

        <div className="kv">
          <b>Less: employer NPS u/s 80CCD(2)</b>
          <span>− {formatInr(computation.npsDeduction)}</span>
        </div>

        <div className="kv total">
          <b>Taxable income</b>
          <b>{formatInr(computation.taxableIncome)}</b>
        </div>

        <div className="kv">
          <b>Tax on slabs</b>
          <span>{formatInr(computation.slabTax)}</span>
        </div>

        {computation.rebate87A > 0 && (
          <div className="kv">
            <b>Less: rebate u/s 87A</b>
            <span>− {formatInr(computation.rebate87A)}</span>
          </div>
        )}

        {computation.marginalRelief87A > 0 && (
          <div className="kv">
            <b>Less: marginal relief</b>
            <span>− {formatInr(computation.marginalRelief87A)}</span>
          </div>
        )}

        {computation.surchargeAmount > 0 && (
          <div className="kv">
            <b>Add: surcharge at {(computation.surchargeRate * 100).toFixed(0)}%</b>
            <span>+ {formatInr(computation.surchargeAmount)}</span>
          </div>
        )}

        {computation.surchargeRelief > 0 && (
          <div className="kv">
            <b>Surcharge marginal relief</b>
            <span>− {formatInr(computation.surchargeRelief)}</span>
          </div>
        )}

        <div className="kv">
          <b>Add: health &amp; education cess at 4%</b>
          <span>+ {formatInr(computation.cessAmount)}</span>
        </div>

        <div className="kv total">
          <b>Total tax for the year</b>
          <b>{formatInr(computation.totalTax)}</b>
        </div>

        <div className="kv">
          <b>Monthly TDS</b>
          <span>{formatInr(computation.monthlyTds)}</span>
        </div>

        <div className="kv">
          <b>Effective tax rate</b>
          <span>{computation.effectiveTaxRate.toFixed(2)}% of gross</span>
        </div>
      </div>

      <div style={{ marginTop: '16px', display: 'flex', gap: '9px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn primary sm"
          onClick={() => printTaxComputation(taxData)}
        >
          Download computation
        </button>
        <button
          type="button"
          className="btn ghost sm"
          onClick={() => exportTaxCsv(taxData)}
        >
          Download as CSV
        </button>
      </div>
    </div>
  )
}
