import { useCallback, useEffect, useState } from 'react'
import { formatInr } from '../../../shared/lib/format'
import { PageHero } from '../../../shared/ui/PageHero'
import { AdminApprovalModal } from '../components/AdminApprovalModal'
import { AdminMarkPaidModal } from '../components/AdminMarkPaidModal'
import { AdminRejectionModal } from '../components/AdminRejectionModal'
import { ReceiptViewerModal } from '../components/ReceiptViewerModal'
import { ReimbursementSummaryCards } from '../components/ReimbursementSummaryCards'
import { reimbursementApi } from '../reimbursement.api'
import type {
  AdminReimbursementsView,
  ReimbursementItem,
} from '../reimbursement.types'
import {
  loansApi,
  AdminLoansTable,
  LoanSummaryCards,
  IssueLoanModal,
  CloseLoanModal,
  LoanDetailsModal,
  type AdminLoanItem,
  type AdminLoansView,
  type CreateLoanPayload,
  type LoanMetaDto,
} from '../../loans'

export function AdminReimbursementsPage() {
  // Main Tab: Reimbursements vs Loans
  const [activeMainTab, setActiveMainTab] = useState<'reimbursements' | 'loans'>('reimbursements')

  // Reimbursement state
  const [data, setData] = useState<AdminReimbursementsView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('Pending')

  const [activeReceipt, setActiveReceipt] = useState<ReimbursementItem | null>(null)
  const [approvingClaim, setApprovingClaim] = useState<ReimbursementItem | null>(null)
  const [rejectingClaim, setRejectingClaim] = useState<ReimbursementItem | null>(null)
  const [payingClaim, setPayingClaim] = useState<ReimbursementItem | null>(null)

  // Loans state
  const [loansData, setLoansData] = useState<AdminLoansView | null>(null)
  const [loansMeta, setLoansMeta] = useState<LoanMetaDto | null>(null)
  const [loansLoading, setLoansLoading] = useState(false)
  const [loanStatusFilter, setLoanStatusFilter] = useState<'all' | 'active' | 'closed'>('all')

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<AdminLoanItem | null>(null)
  const [closingLoan, setClosingLoan] = useState<AdminLoanItem | null>(null)
  const [loanSubmitting, setLoanSubmitting] = useState(false)

  // Load Reimbursements
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await reimbursementApi.getAllForAdmin(statusFilter)
      setData(res)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load reimbursement approvals.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void loadData()
  }, [loadData])

  // Load Loans
  const loadLoans = useCallback(async () => {
    try {
      setLoansLoading(true)
      const [loansRes, metaRes] = await Promise.all([
        loansApi.getAdminLoans(loanStatusFilter),
        loansApi.getAdminMeta(),
      ])
      setLoansData(loansRes)
      setLoansMeta(metaRes)
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load company loans.')
    } finally {
      setLoansLoading(false)
    }
  }, [loanStatusFilter])

  useEffect(() => {
    if (activeMainTab === 'loans' || !loansData) {
      void loadLoans()
    }
  }, [activeMainTab, loadLoans, loansData])

  // Loan Action Handlers
  const handleIssueLoan = async (payload: CreateLoanPayload) => {
    try {
      setLoanSubmitting(true)
      await loansApi.createLoan(payload)
      setNotice('Loan successfully disbursed. Monthly salary deductions scheduled.')
      setIsIssueModalOpen(false)
      void loadLoans()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to disburse loan.')
    } finally {
      setLoanSubmitting(false)
    }
  }

  const handleConfirmClose = async (reason: string) => {
    if (!closingLoan) return
    try {
      setLoanSubmitting(true)
      await loansApi.closeLoan(closingLoan.id, { reason })
      setNotice(`Loan for ${closingLoan.employeeName} marked as closed.`)
      setClosingLoan(null)
      if (selectedLoan?.id === closingLoan.id) {
        setSelectedLoan(null)
      }
      void loadLoans()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to close loan.')
    } finally {
      setLoanSubmitting(false)
    }
  }

  return (
    <div className="page">
      <PageHero
        navKey="reimbursements"
        title={activeMainTab === 'reimbursements' ? 'Reimbursement & Loans' : 'Company Loans & Advances'}
        eyebrow={
          activeMainTab === 'reimbursements'
            ? 'Admin Access · Expense verification & Razorpay payout queue'
            : 'Admin Access · Issue interest-free company advances, track salary EMI recoveries & manage loan lifecycles'
        }
      >
        {activeMainTab === 'loans' && (
          <button
            type="button"
            className="btn primary"
            onClick={() => setIsIssueModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>+ Issue Loan</span>
          </button>
        )}
      </PageHero>

      {/* Main Top Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          borderBottom: '1px solid var(--line2)',
          marginBottom: 20,
          paddingBottom: 0,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveMainTab('reimbursements')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeMainTab === 'reimbursements' ? '2.5px solid var(--blue)' : '2.5px solid transparent',
            color: activeMainTab === 'reimbursements' ? 'var(--ink)' : 'var(--muted)',
            fontWeight: activeMainTab === 'reimbursements' ? 700 : 500,
            fontSize: '14.5px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span>🧾</span>
          <span>Reimbursements</span>
          {data?.summary.pendingCount !== undefined && data.summary.pendingCount > 0 && (
            <span
              style={{
                fontSize: '11px',
                padding: '1px 7px',
                borderRadius: '10px',
                background: activeMainTab === 'reimbursements' ? 'var(--blue)' : 'var(--panel)',
                color: activeMainTab === 'reimbursements' ? '#fff' : 'var(--muted)',
                fontWeight: 700,
              }}
            >
              {data.summary.pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('loans')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeMainTab === 'loans' ? '2.5px solid var(--blue)' : '2.5px solid transparent',
            color: activeMainTab === 'loans' ? 'var(--ink)' : 'var(--muted)',
            fontWeight: activeMainTab === 'loans' ? 700 : 500,
            fontSize: '14.5px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span>💳</span>
          <span>Company Loans</span>
          {loansData?.summary.activeLoansCount !== undefined && loansData.summary.activeLoansCount > 0 && (
            <span
              style={{
                fontSize: '11px',
                padding: '1px 7px',
                borderRadius: '10px',
                background: activeMainTab === 'loans' ? 'var(--blue)' : 'var(--panel)',
                color: activeMainTab === 'loans' ? '#fff' : 'var(--muted)',
                fontWeight: 700,
              }}
            >
              {loansData.summary.activeLoansCount}
            </span>
          )}
        </button>
      </div>

      <div>
        {notice && (
          <div
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              backgroundColor: 'var(--green-soft, #e8f6ef)',
              color: 'var(--green, #0f9d63)',
              fontWeight: 600,
              fontSize: 13,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>✓ {notice}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              backgroundColor: 'var(--red-soft, #fef2f2)',
              color: 'var(--red, #ef4444)',
              fontSize: 13,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>⚠️ {error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* -------------------- REIMBURSEMENTS TAB CONTENT -------------------- */}
        {activeMainTab === 'reimbursements' && (
          <>
            {data && <ReimbursementSummaryCards summary={data.summary} />}

            {/* Filter Navigation Tabs */}
            <div
              className="card"
              style={{
                padding: '12px 16px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Status:</span>
                {[
                  { key: 'Pending', label: 'Pending Review', count: data?.summary.pendingCount },
                  { key: 'Approved', label: 'Approved (Awaiting Payout)' },
                  { key: 'Paid', label: 'Paid via Razorpay' },
                  { key: 'Rejected', label: 'Rejected' },
                  { key: 'All', label: 'All Records' },
                ].map((tab) => {
                  const isActive = statusFilter === tab.key
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      className={`btn sm ${isActive ? 'primary' : 'ghost'}`}
                      onClick={() => setStatusFilter(tab.key)}
                      style={{ height: 32, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <span>{tab.label}</span>
                      {tab.count !== undefined && tab.count > 0 && (
                        <span
                          style={{
                            padding: '1px 6px',
                            borderRadius: 10,
                            backgroundColor: isActive ? '#ffffff' : 'var(--blue, #2563eb)',
                            color: isActive ? 'var(--blue, #2563eb)' : '#ffffff',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                className="btn ghost sm"
                onClick={() => void loadData()}
                disabled={loading}
              >
                ↻ Refresh
              </button>
            </div>

            {/* Claims Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--line2, #e5e7eb)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  Claims ({data?.claims.length ?? 0})
                </span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Showing current view records
                </span>
              </div>

              {loading && !data ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                  Loading reimbursement requests…
                </div>
              ) : !data || data.claims.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                  No reimbursement claims found under &quot;{statusFilter}&quot;.
                </div>
              ) : (
                <div className="scroll">
                  <table style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Claim Details</th>
                        <th>Category</th>
                        <th className="num-col">Original</th>
                        <th className="num-col">Approved</th>
                        <th>Status</th>
                        <th>Receipt</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.claims.map((claim) => {
                        const isPending = claim.status === 'Pending'
                        const isApproved = claim.status === 'Approved'
                        const isPaid = claim.status === 'Paid'
                        const isRejected = claim.status === 'Rejected'

                        return (
                          <tr key={claim.id}>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{claim.employeeName}</div>
                              <small style={{ color: 'var(--muted)' }}>{claim.employeeCode} · {claim.department}</small>
                            </td>

                            <td>
                              <div style={{ fontWeight: 600 }}>{claim.title}</div>
                              <small style={{ color: 'var(--muted)' }}>
                                {claim.ref} · {claim.expenseDate}
                              </small>
                              {claim.description && (
                                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                                  💬 {claim.description}
                                </div>
                              )}
                            </td>

                            <td>
                              <span className="chip" style={{ fontSize: 11 }}>
                                {claim.category}
                              </span>
                            </td>

                            <td className="num-col" style={{ fontWeight: 600 }}>
                              {formatInr(claim.claimAmount)}
                            </td>

                            <td className="num-col" style={{ fontWeight: 700, color: claim.approvedAmount ? 'var(--green)' : 'inherit' }}>
                              {claim.approvedAmount ? formatInr(claim.approvedAmount) : '—'}
                            </td>

                            <td>
                              <span
                                className={`chip ${
                                  isPending ? 'c-p' : isApproved ? 'c-in' : isPaid ? 'c-wfh' : 'c-od'
                                }`}
                                style={{
                                  textTransform: 'capitalize',
                                  fontSize: 11,
                                  backgroundColor: isPaid ? '#dcfce7' : undefined,
                                  color: isPaid ? '#15803d' : undefined,
                                }}
                              >
                                {claim.status}
                              </span>
                            </td>

                            <td>
                              {claim.hasReceipt ? (
                                <button
                                  type="button"
                                  className="btn ghost sm"
                                  onClick={() => setActiveReceipt(claim)}
                                  style={{ padding: '3px 8px', fontSize: 11, height: 26 }}
                                >
                                  📎 View
                                </button>
                              ) : (
                                <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
                              )}
                            </td>

                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: 6, justifyContent: 'flex-end' }}>
                                {isPending && (
                                  <>
                                    <button
                                      type="button"
                                      className="btn primary sm"
                                      onClick={() => setApprovingClaim(claim)}
                                      style={{ height: 30, fontSize: 12 }}
                                    >
                                      Approve / Adjust
                                    </button>
                                    <button
                                      type="button"
                                      className="btn ghost sm"
                                      onClick={() => setRejectingClaim(claim)}
                                      style={{ height: 30, fontSize: 12, color: 'var(--red, #ef4444)' }}
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}

                                {isApproved && (
                                  <button
                                    type="button"
                                    className="btn primary sm"
                                    onClick={() => setPayingClaim(claim)}
                                    style={{ height: 30, fontSize: 12, backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }}
                                  >
                                    Mark Paid (Razorpay)
                                  </button>
                                )}

                                {isPaid && (
                                  <small style={{ color: 'var(--muted)', fontSize: 11 }}>
                                    Paid {claim.paymentDate}
                                    {claim.paymentReference && <span> · {claim.paymentReference}</span>}
                                  </small>
                                )}

                                {isRejected && (
                                  <small style={{ color: 'var(--muted)', fontSize: 11 }}>
                                    Rejected
                                  </small>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* -------------------- LOANS TAB CONTENT -------------------- */}
        {activeMainTab === 'loans' && (
          <>
            {loansLoading && !loansData ? (
              <div className="card" style={{ padding: '36px', textAlign: 'center', color: 'var(--muted2)' }}>
                Loading company loans ledger…
              </div>
            ) : (
              <>
                {loansData && <LoanSummaryCards summary={loansData.summary} />}

                {/* Loans Status Filter */}
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginBottom: 16,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    className={`btn ${loanStatusFilter === 'all' ? 'primary' : 'ghost'} sm`}
                    onClick={() => setLoanStatusFilter('all')}
                  >
                    All Loans ({loansData?.loans.length ?? 0})
                  </button>
                  <button
                    type="button"
                    className={`btn ${loanStatusFilter === 'active' ? 'primary' : 'ghost'} sm`}
                    onClick={() => setLoanStatusFilter('active')}
                  >
                    Active ({loansData?.summary.activeLoansCount ?? 0})
                  </button>
                  <button
                    type="button"
                    className={`btn ${loanStatusFilter === 'closed' ? 'primary' : 'ghost'} sm`}
                    onClick={() => setLoanStatusFilter('closed')}
                  >
                    Closed
                  </button>
                </div>

                {loansData && (
                  <AdminLoansTable
                    loans={loansData.loans}
                    onCloseLoan={(loan) => setClosingLoan(loan)}
                    onSelectLoan={(loan) => setSelectedLoan(loan)}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* -------------------- REIMBURSEMENT MODALS -------------------- */}
      {activeReceipt && (
        <ReceiptViewerModal
          claimId={activeReceipt.id}
          claimRef={activeReceipt.ref}
          claimTitle={activeReceipt.title}
          filename={activeReceipt.receiptFilename}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      {approvingClaim && (
        <AdminApprovalModal
          claim={approvingClaim}
          onClose={() => setApprovingClaim(null)}
          onSuccess={() => {
            setApprovingClaim(null)
            setNotice(`Claim ${approvingClaim.ref} approved successfully.`)
            void loadData()
          }}
        />
      )}

      {rejectingClaim && (
        <AdminRejectionModal
          claim={rejectingClaim}
          onClose={() => setRejectingClaim(null)}
          onSuccess={() => {
            setRejectingClaim(null)
            setNotice(`Claim ${rejectingClaim.ref} rejected with reason.`)
            void loadData()
          }}
        />
      )}

      {payingClaim && (
        <AdminMarkPaidModal
          claim={payingClaim}
          onClose={() => setPayingClaim(null)}
          onSuccess={() => {
            setPayingClaim(null)
            setNotice(`Claim ${payingClaim.ref} marked as paid via Razorpay.`)
            void loadData()
          }}
        />
      )}

      {/* -------------------- LOANS MODALS -------------------- */}
      {isIssueModalOpen && loansMeta && (
        <IssueLoanModal
          meta={loansMeta}
          submitting={loanSubmitting}
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
          submitting={loanSubmitting}
          onClose={() => setClosingLoan(null)}
          onConfirm={handleConfirmClose}
        />
      )}
    </div>
  )
}
