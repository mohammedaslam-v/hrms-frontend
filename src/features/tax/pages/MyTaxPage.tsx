import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHero } from '../../../shared/ui/PageHero'
import { taxApi } from '../tax.api'
import type { MyTaxResponse } from '../tax.types'
import { TaxStatsCards } from '../components/TaxStatsCards'
import { TaxComputationCard } from '../components/TaxComputationCard'
import { SlabWiseTaxCard } from '../components/SlabWiseTaxCard'
import { TdsScheduleCard } from '../components/TdsScheduleCard'
import { printTaxComputation } from '../tax.export'

export function MyTaxPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const employeeId = id ? Number(id) : undefined
  const isSelf = !employeeId

  const [taxData, setTaxData] = useState<MyTaxResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadTax = useCallback(async () => {
    setLoading(true)
    try {
      const data = await taxApi.getMyTax(employeeId)
      setTaxData(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tax computation.')
    } finally {
      setLoading(false)
    }
  }, [employeeId])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void loadTax()
  }, [loadTax])

  return (
    <div className="view" id="v-tax">
      <div className="crumb">
        <span>Individual</span> / <b>{isSelf ? 'My tax & TDS' : (taxData?.employee.name ?? 'Tax & TDS')}</b>
      </div>

      <PageHero
        navKey="mytax"
        title={
          isSelf
            ? 'My tax & TDS'
            : taxData
              ? `Tax & TDS · ${taxData.employee.name}`
              : 'Tax & TDS'
        }
        eyebrow={
          isSelf
            ? `NEW REGIME U/S 115BAC · FY ${taxData?.company.fy ?? '2026-27'} (AY ${taxData?.company.ay ?? '2027-28'})`
            : taxData
              ? `Viewing tax computation for ${taxData.employee.name} (${taxData.employee.code}) · ${taxData.employee.department}`
              : 'Team member tax details'
        }
      >
        {!isSelf && (
          <button
            type="button"
            className="btn ghost sm"
            onClick={() => navigate('/team')}
          >
            ← Back to team
          </button>
        )}
        {taxData && (
          <button
            type="button"
            className="btn primary"
            onClick={() => printTaxComputation(taxData)}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            <span>Download computation</span>
          </button>
        )}
      </PageHero>

      {loading && (
        <div
          className="card"
          style={{
            padding: 32,
            textAlign: 'center',
            color: 'var(--muted, #8c857b)',
          }}
        >
          Loading tax computation and TDS schedule...
        </div>
      )}

      {error && !loading && (
        <div
          className="notice bad"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            className="btn ghost sm"
            onClick={() => void loadTax()}
          >
            Retry
          </button>
        </div>
      )}

      {taxData && !loading && (
        <div id="taxMine">
          {/* Top 4 KPI stat cards in grid g4 */}
          <TaxStatsCards computation={taxData.computation} />

          {/* Main 2-column layout (2fr : 1fr) */}
          <div className="grid g23 mt">
            <div>
              <TaxComputationCard taxData={taxData} />
            </div>

            <div>
              <SlabWiseTaxCard slabRows={taxData.slabRows} />
              <TdsScheduleCard
                schedule={taxData.schedule}
                totalTax={taxData.computation.totalTax}
              />
            </div>
          </div>

          {/* Statutory notice from prototype */}
          <div className="notice mt">
            The new regime allows the ₹75,000 standard deduction and the employer&apos;s
            NPS contribution under 80CCD(2). It does not allow HRA exemption, 80C,
            employee PF, professional tax or home-loan interest on a self-occupied
            property. Section 87A gives a rebate of up to ₹60,000 where taxable income stays
            within ₹12,00,000, with marginal relief just above it.
          </div>
        </div>
      )}
    </div>
  )
}
