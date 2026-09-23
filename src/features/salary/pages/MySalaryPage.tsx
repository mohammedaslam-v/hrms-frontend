import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHero } from '../../../shared/ui/PageHero'
import { formatInr } from '../../../shared/lib/format'
import { salaryApi } from '../salary.api'
import { printSlipDocument } from '../salary.print'
import type { MySalaryView } from '../salary.types'
import { AnnualStructureCard } from '../components/AnnualStructureCard'
import { LoanAdvanceCard } from '../components/LoanAdvanceCard'
import { PayslipHistoryCard } from '../components/PayslipHistoryCard'
import { SalarySlipCard } from '../components/SalarySlipCard'
import { EmployeeReimbursementsTab } from '../../reimbursement/components/EmployeeReimbursementsTab'

export function MySalaryPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const employeeId = id ? Number(id) : undefined
  const isSelf = !employeeId

  const currentMonthKey = new Date().toISOString().slice(0, 7)
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey)
  const [activeTab, setActiveTab] = useState<'salary' | 'reimbursements'>('salary')
  const [view, setView] = useState<MySalaryView | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(
    async (month: string) => {
      setLoading(true)
      try {
        const data = await salaryApi.getMySalary(month, employeeId)
        setView(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load salary details.')
      } finally {
        setLoading(false)
      }
    },
    [employeeId],
  )

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void loadData(selectedMonth)
  }, [loadData, selectedMonth])

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
  }

  const handleDownloadCurrent = () => {
    if (view?.slip && view?.company) {
      printSlipDocument(view.slip, view.company)
    }
  }

  const handleDownloadMonth = async (monthKey: string) => {
    if (!view) return
    if (monthKey === selectedMonth && view.slip) {
      printSlipDocument(view.slip, view.company)
      return
    }

    try {
      const monthData = await salaryApi.getMySalary(monthKey, employeeId)
      if (monthData.slip) {
        printSlipDocument(monthData.slip, monthData.company)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not download payslip.')
    }
  }

  if (loading && !view) {
    return <div className="boot">Loading salary &amp; payslips…</div>
  }

  if (error && !view) {
    return (
      <div className="page">
        <PageHero navKey="mypay" />
        <div className="notice bad" style={{ marginTop: 20 }}>
          {error}
        </div>
      </div>
    )
  }

  if (!view) return null

  const slip = view.slip
  const eyebrowText = slip
    ? `${slip.monthLabel} · ${formatInr(slip.netPay)} net pay`
    : `${selectedMonth} · No active slip`

  return (
    <div className="page">
      <PageHero
        navKey="mypay"
        title={!isSelf && slip?.employee ? `${slip.employee.name}’s salary` : undefined}
        eyebrow={eyebrowText}
      />

      {!isSelf && (
        <div
          className="notice blue"
          style={{
            margin: '0 0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <span>
            Viewing salary details for <b>{slip?.employee?.name || `Employee #${employeeId}`}</b>.
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="tag blue">Admin / Manager View</span>
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => navigate(`/me/${employeeId}`)}
              style={{ background: '#ffffff' }}
            >
              ← Back to profile
            </button>
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => navigate('/pay')}
              style={{ background: '#ffffff' }}
            >
              View my own salary
            </button>
          </div>
        </div>
      )}

      {/* Top Segmented Sub-Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
          borderBottom: '1px solid var(--line2)',
          paddingBottom: 8,
        }}
      >
        <button
          type="button"
          className={`btn ${activeTab === 'salary' ? 'primary' : 'ghost'}`}
          onClick={() => setActiveTab('salary')}
          style={{ height: 36, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <span>💼 Salary & Payslips</span>
        </button>

        <button
          type="button"
          className={`btn ${activeTab === 'reimbursements' ? 'primary' : 'ghost'}`}
          onClick={() => setActiveTab('reimbursements')}
          style={{ height: 36, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <span>🧾 Reimbursements & Claims</span>
        </button>
      </div>

      {activeTab === 'salary' ? (
        <>
          {error && (
            <div className="notice bad" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div className="grid g23">
            <div>
              <SalarySlipCard
                slip={slip}
                company={view.company}
                selectedMonth={selectedMonth}
                loading={loading}
                onMonthChange={handleMonthChange}
                onDownload={handleDownloadCurrent}
              />
            </div>

            <div>
              <AnnualStructureCard structure={view.annualStructure} />

              <PayslipHistoryCard
                history={view.history}
                company={view.company}
                onDownloadMonth={handleDownloadMonth}
              />

              <LoanAdvanceCard loan={view.loan} />
            </div>
          </div>
        </>
      ) : (
        <EmployeeReimbursementsTab />
      )}
    </div>
  )
}
