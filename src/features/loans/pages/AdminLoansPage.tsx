import { useCallback, useEffect, useState } from 'react'
import { PageHero } from '../../../shared/ui/PageHero'
import { Toast, type ToastMessage } from '../../../shared/ui/Toast'
import { loansApi } from '../api/loans.api'
import { AdminLoansTable } from '../components/AdminLoansTable'
import { CloseLoanModal } from '../components/CloseLoanModal'
import { IssueLoanModal } from '../components/IssueLoanModal'
import { LoanDetailsModal } from '../components/LoanDetailsModal'
import { LoanSummaryCards } from '../components/LoanSummaryCards'
import type {
  AdminLoanItem,
  AdminLoansView,
  CreateLoanPayload,
  LoanMetaDto,
} from '../types/loans.types'

export function AdminLoansPage() {
  const [data, setData] = useState<AdminLoansView | null>(null)
  const [meta, setMeta] = useState<LoanMetaDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all')

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<AdminLoanItem | null>(null)
  const [closingLoan, setClosingLoan] = useState<AdminLoanItem | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)

  const loadLoans = useCallback(async () => {
    try {
      setLoading(true)
      const [loansRes, metaRes] = await Promise.all([
        loansApi.getAdminLoans(statusFilter),
        loansApi.getAdminMeta(),
      ])
      setData(loansRes)
      setMeta(metaRes)
    } catch (err: unknown) {
      setToast({
        text: err instanceof Error ? err.message : 'Failed to load loans data.',
        tone: 'bad',
      })
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void loadLoans()
  }, [loadLoans])

  const handleIssueLoan = async (payload: CreateLoanPayload) => {
    try {
      setSubmitting(true)
      await loansApi.createLoan(payload)
      setToast({
        text: 'Loan successfully disbursed. Monthly salary deductions scheduled.',
        tone: 'good',
      })
      setIsIssueModalOpen(false)
      loadLoans()
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmClose = async (reason: string) => {
    if (!closingLoan) return
    try {
      setSubmitting(true)
      await loansApi.closeLoan(closingLoan.id, { reason })
      setToast({
        text: `Loan for ${closingLoan.employeeName} marked as closed.`,
        tone: 'good',
      })
      setClosingLoan(null)
      if (selectedLoan?.id === closingLoan.id) {
        setSelectedLoan(null)
      }
      loadLoans()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHero
        navKey="reimbursements"
        title="Company Loans & Advances"
        eyebrow="Issue interest-free company advances, track salary EMI recoveries, and manage loan lifecycles"
      >
        <button
          type="button"
          className="btn primary"
          onClick={() => setIsIssueModalOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <span>+ Issue Loan</span>
        </button>
      </PageHero>

      {loading && !data ? (
        <div className="card" style={{ padding: '36px', textAlign: 'center', color: 'var(--muted2)' }}>
          Loading company loans ledger…
        </div>
      ) : (
        <>
          {data && <LoanSummaryCards summary={data.summary} />}

          {/* Filter Bar */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 16,
              alignItems: 'center',
            }}
          >
            <button
              type="button"
              className={`btn ${statusFilter === 'all' ? 'primary' : 'ghost'} sm`}
              onClick={() => setStatusFilter('all')}
            >
              All Loans ({data?.loans.length ?? 0})
            </button>
            <button
              type="button"
              className={`btn ${statusFilter === 'active' ? 'primary' : 'ghost'} sm`}
              onClick={() => setStatusFilter('active')}
            >
              Active ({data?.summary.activeLoansCount ?? 0})
            </button>
            <button
              type="button"
              className={`btn ${statusFilter === 'closed' ? 'primary' : 'ghost'} sm`}
              onClick={() => setStatusFilter('closed')}
            >
              Closed
            </button>
          </div>

          {data && (
            <AdminLoansTable
              loans={data.loans}
              onCloseLoan={(loan) => setClosingLoan(loan)}
              onSelectLoan={(loan) => setSelectedLoan(loan)}
            />
          )}
        </>
      )}

      {isIssueModalOpen && meta && (
        <IssueLoanModal
          meta={meta}
          submitting={submitting}
          onClose={() => setIsIssueModalOpen(false)}
          onSubmit={handleIssueLoan}
        />
      )}

      {selectedLoan && (
        <LoanDetailsModal
          loan={selectedLoan}
          onClose={() => setSelectedLoan(null)}
          onMarkAsClosed={(loan) => {
            setSelectedLoan(null)
            setClosingLoan(loan)
          }}
        />
      )}

      {closingLoan && (
        <CloseLoanModal
          loan={closingLoan}
          submitting={submitting}
          onClose={() => setClosingLoan(null)}
          onConfirm={handleConfirmClose}
        />
      )}

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  )
}
