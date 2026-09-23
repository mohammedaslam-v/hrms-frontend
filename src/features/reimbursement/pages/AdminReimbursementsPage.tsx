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

export function AdminReimbursementsPage() {
  const [data, setData] = useState<AdminReimbursementsView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('Pending')

  const [activeReceipt, setActiveReceipt] = useState<ReimbursementItem | null>(null)
  const [approvingClaim, setApprovingClaim] = useState<ReimbursementItem | null>(null)
  const [rejectingClaim, setRejectingClaim] = useState<ReimbursementItem | null>(null)
  const [payingClaim, setPayingClaim] = useState<ReimbursementItem | null>(null)

  const loadData = useCallback(async () => {
    try {
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

  return (
    <div className="page">
      <PageHero
        navKey="reimbursements"
        title="Reimbursement approvals"
        eyebrow="Admin Access · Expense verification & Razorpay payout queue"
      />

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
            }}
          >
            ⚠️ {error}
          </div>
        )}

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
              borderBottom: '1px solid var(--line2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h3 style={{ margin: 0 }}>
              Company claims queue{' '}
              <span className="sub" style={{ fontSize: 13, fontWeight: 500 }}>
                · {data?.claims.length || 0} claims in view
              </span>
            </h3>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--muted)' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
              Loading approval requests…
            </div>
          ) : !data || data.claims.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
              <b style={{ display: 'block', fontSize: 15, color: 'var(--ink)' }}>
                No {statusFilter.toLowerCase()} reimbursement claims
              </b>
              <p style={{ fontSize: 13, marginTop: 4 }}>
                All clear! No employee reimbursement requests in this category.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--line2)',
                      backgroundColor: 'var(--panel)',
                      color: 'var(--muted)',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <th style={{ padding: '12px 16px' }}>Employee</th>
                    <th style={{ padding: '12px 16px' }}>Ref & Category</th>
                    <th style={{ padding: '12px 16px' }}>Claim Details</th>
                    <th style={{ padding: '12px 16px' }}>Receipt</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.claims.map((claim) => {
                    const isPending = claim.status === 'Pending'
                    const isApproved = claim.status === 'Approved'
                    const isPaid = claim.status === 'Paid'
                    const isRejected = claim.status === 'Rejected'

                    const isAdjusted =
                      claim.approvedAmount !== null && claim.approvedAmount !== claim.claimAmount

                    return (
                      <tr
                        key={claim.id}
                        style={{
                          borderBottom: '1px solid var(--line2)',
                          transition: 'background-color 0.15s',
                        }}
                      >
                        {/* Employee info */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                          <b style={{ display: 'block', color: 'var(--ink)', fontSize: 13.5 }}>
                            {claim.employeeName}
                          </b>
                          <small style={{ color: 'var(--muted)', fontSize: 12 }}>
                            {claim.employeeCode} {claim.department ? `· ${claim.department}` : ''}
                          </small>
                        </td>

                        {/* Ref & Category */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: 'var(--blue, #2563eb)',
                              fontSize: 12.5,
                              display: 'block',
                              marginBottom: 2,
                            }}
                          >
                            {claim.ref}
                          </span>
                          <span
                            className="tag"
                            style={{
                              fontSize: 11,
                              background: '#f1f5f9',
                              color: '#334155',
                              fontWeight: 600,
                            }}
                          >
                            {claim.category}
                          </span>
                        </td>

                        {/* Claim Details */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top', maxWidth: 280 }}>
                          <b style={{ color: 'var(--ink)' }}>{claim.title}</b>
                          <small style={{ display: 'block', color: 'var(--muted)', fontSize: 11.5, marginTop: 2 }}>
                            Date of Expense: <b>{claim.expenseDate}</b> · Applied: {claim.createdAt.slice(0, 10)}
                          </small>
                          {claim.description && (
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ink2)' }}>
                              {claim.description}
                            </p>
                          )}
                          {claim.rejectionReason && (
                            <div
                              style={{
                                marginTop: 6,
                                padding: '6px 10px',
                                borderRadius: 4,
                                backgroundColor: '#fff1f2',
                                color: '#9f1239',
                                fontSize: 11.5,
                                border: '1px solid #fecdd3',
                              }}
                            >
                              <b>Rejection Reason:</b> {claim.rejectionReason}
                            </div>
                          )}
                          {claim.adminNotes && (
                            <div
                              style={{
                                marginTop: 4,
                                fontSize: 11.5,
                                color: 'var(--green, #0f9d63)',
                              }}
                            >
                              <b>HR Note:</b> {claim.adminNotes}
                            </div>
                          )}
                        </td>

                        {/* Receipt */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                          {claim.hasReceipt ? (
                            <button
                              type="button"
                              className="btn ghost sm"
                              onClick={() => setActiveReceipt(claim)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                            >
                              <span>📎 View Invoice</span>
                            </button>
                          ) : (
                            <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
                          )}
                        </td>

                        {/* Amount */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top', textAlign: 'right' }}>
                          <b style={{ fontSize: 15, color: 'var(--ink)', display: 'block' }}>
                            {formatInr(claim.approvedAmount ?? claim.claimAmount)}
                          </b>
                          {isAdjusted ? (
                            <small style={{ color: 'var(--muted)', fontSize: 11 }}>
                              Req: <s style={{ textDecoration: 'line-through' }}>{formatInr(claim.claimAmount)}</s>
                            </small>
                          ) : (
                            <small style={{ color: 'var(--muted)', fontSize: 11 }}>
                              {isApproved || isPaid ? 'Approved' : 'Requested'}
                            </small>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top', textAlign: 'center' }}>
                          {isPending && (
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: 4,
                                background: '#fef3c7',
                                color: '#b45309',
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              Pending Review
                            </span>
                          )}
                          {isApproved && (
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: 4,
                                background: 'var(--green-soft, #e8f6ef)',
                                color: 'var(--green, #0f9d63)',
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              Approved
                            </span>
                          )}
                          {isPaid && (
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: 4,
                                background: '#ede9fe',
                                color: '#6d28d9',
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              Disbursed
                            </span>
                          )}
                          {isRejected && (
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: 4,
                                background: '#fee2e2',
                                color: '#b91c1c',
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              Rejected
                            </span>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
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
      </div>

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
    </div>
  )
}
