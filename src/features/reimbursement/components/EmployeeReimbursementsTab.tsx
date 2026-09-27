import { useCallback, useEffect, useState } from 'react'
import { formatInr } from '../../../shared/lib/format'
import { reimbursementApi } from '../reimbursement.api'
import type {
  EmployeeReimbursementsView,
  ReimbursementItem,
} from '../reimbursement.types'
import { NewReimbursementModal } from './NewReimbursementModal'
import { ReceiptViewerModal } from './ReceiptViewerModal'
import { ReimbursementSummaryCards } from './ReimbursementSummaryCards'

export function EmployeeReimbursementsTab() {
  const [data, setData] = useState<EmployeeReimbursementsView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [showNewModal, setShowNewModal] = useState(false)
  const [activeReceipt, setActiveReceipt] = useState<ReimbursementItem | null>(null)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('All')

  const loadData = useCallback(async () => {
    try {
      const res = await reimbursementApi.getMyReimbursements()
      setData(res)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load reimbursements.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleCancel = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this pending claim?')) return
    setCancellingId(id)
    try {
      await reimbursementApi.cancelClaim(id)
      setNotice('Claim cancelled successfully.')
      void loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not cancel claim.')
    } finally {
      setCancellingId(null)
    }
  }

  const filteredClaims = (data?.claims || []).filter((c) => {
    if (statusFilter === 'All') return true
    return c.status === statusFilter
  })

  return (
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

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
          Loading reimbursement claims…
        </div>
      ) : (
        <>
          {data && <ReimbursementSummaryCards summary={data.summary} />}

          {/* Action and Filter Bar */}
          <div
            className="card"
            style={{
              padding: '14px 18px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Filter status:</span>
              {(['All', 'Pending', 'Approved', 'Paid', 'Rejected'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`btn sm ${statusFilter === st ? 'primary' : 'ghost'}`}
                  onClick={() => setStatusFilter(st)}
                  style={{ height: 30, fontSize: 12 }}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="btn primary"
              onClick={() => setShowNewModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>+</span>
              <span>Claim reimbursement</span>
            </button>
          </div>

          {/* Claims List */}
          <div className="card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: '1px solid var(--line2)',
              }}
            >
              <h3 style={{ margin: 0 }}>
                My claims history{' '}
                <span className="sub" style={{ fontSize: 13, fontWeight: 500 }}>
                  · {filteredClaims.length} records
                </span>
              </h3>
            </div>

            {filteredClaims.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🧾</div>
                <b style={{ display: 'block', fontSize: 15, color: 'var(--ink)' }}>
                  No reimbursement claims found
                </b>
                <p style={{ fontSize: 13, marginTop: 4 }}>
                  Have an eligible business expense? Submit a claim with your receipt to get reimbursed.
                </p>
                <button
                  type="button"
                  className="btn primary sm"
                  onClick={() => setShowNewModal(true)}
                  style={{ marginTop: 12 }}
                >
                  + Submit a claim
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredClaims.map((claim) => {
                  const isPending = claim.status === 'Pending'
                  const isApproved = claim.status === 'Approved'
                  const isPaid = claim.status === 'Paid'
                  const isRejected = claim.status === 'Rejected'

                  const isAdjusted =
                    claim.approvedAmount !== null && claim.approvedAmount !== claim.claimAmount

                  return (
                    <div
                      key={claim.id}
                      style={{
                        padding: '16px 18px',
                        borderRadius: 12,
                        border: '1px solid var(--line, #ede7de)',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                      }}
                    >
                      {/* Top Row: Ref, Category, Date, Amounts, Status Badge */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 12,
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: 13,
                                color: 'var(--blue, #2563eb)',
                                letterSpacing: 0.5,
                              }}
                            >
                              {claim.ref}
                            </span>
                            <span
                              className="tag"
                              style={{
                                background: '#f1f5f9',
                                color: '#475569',
                                fontSize: 11,
                                fontWeight: 600,
                              }}
                            >
                              {claim.category}
                            </span>
                            <small style={{ color: 'var(--muted)', fontSize: 12 }}>
                              Expense: {claim.expenseDate} · Submitted: {claim.createdAt.slice(0, 10)}
                            </small>
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginTop: 4 }}>
                            {claim.title}
                          </div>
                          {claim.description && (
                            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--ink2)' }}>
                              {claim.description}
                            </p>
                          )}
                        </div>

                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                            {isAdjusted && (
                              <span
                                style={{
                                  fontSize: 13,
                                  color: 'var(--muted)',
                                  textDecoration: 'line-through',
                                }}
                              >
                                {formatInr(claim.claimAmount)}
                              </span>
                            )}
                            <b style={{ fontSize: 18, color: 'var(--ink)' }}>
                              {formatInr(claim.approvedAmount ?? claim.claimAmount)}
                            </b>
                          </div>
                          <small style={{ fontSize: 11, color: 'var(--muted)' }}>
                            {isAdjusted ? 'Approved Amount' : 'Claimed Amount'}
                          </small>

                          {/* Status Pill */}
                          <div style={{ marginTop: 4 }}>
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
                                🟡 Pending HR Review
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
                                🟢 Approved
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
                                🟣 Paid via Razorpay
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
                                🔴 Rejected
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle: Rejection Reason (Prominent Alert Box) */}
                      {isRejected && claim.rejectionReason && (
                        <div
                          style={{
                            padding: '10px 14px',
                            borderRadius: 6,
                            backgroundColor: '#fff1f2',
                            border: '1px solid #fecdd3',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 8,
                            fontSize: 12.5,
                          }}
                        >
                          <span style={{ fontSize: 16 }}>⚠️</span>
                          <div>
                            <b style={{ color: '#be123c', display: 'block' }}>
                              Reason for Rejection:
                            </b>
                            <span style={{ color: '#9f1239' }}>{claim.rejectionReason}</span>
                          </div>
                        </div>
                      )}

                      {/* Middle: Approved / Paid Notes */}
                      {isApproved && (
                        <div
                          style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            backgroundColor: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            fontSize: 12,
                            color: '#166534',
                          }}
                        >
                          ✓ Approved by {claim.decidedByName || 'HR Admin'} on {claim.decidedOn?.slice(0, 10)}.
                          {claim.adminNotes && <span> Remarks: {claim.adminNotes}</span>}
                          {isAdjusted && (
                            <span style={{ display: 'block', fontWeight: 600, marginTop: 2 }}>
                              Note: Requested amount of {formatInr(claim.claimAmount)} was adjusted to {formatInr(claim.approvedAmount!)}.
                            </span>
                          )}
                        </div>
                      )}

                      {isPaid && (
                        <div
                          style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            backgroundColor: '#faf5ff',
                            border: '1px solid #e9d5ff',
                            fontSize: 12,
                            color: '#581c87',
                          }}
                        >
                          ✓ Disbursed on {claim.paymentDate}
                          {claim.paymentReference && <span> · Payout Ref / UTR: <b>{claim.paymentReference}</b></span>}
                        </div>
                      )}

                      {/* Bottom Row: Receipt button and Actions */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: 8,
                          borderTop: '1px solid var(--line2)',
                        }}
                      >
                        <div>
                          {claim.hasReceipt ? (
                            <button
                              type="button"
                              className="btn ghost sm"
                              onClick={() => setActiveReceipt(claim)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                            >
                              <span>📎 View Invoice / Receipt</span>
                              {claim.receiptFilename && (
                                <small style={{ color: 'var(--muted)', fontSize: 11 }}>
                                  ({claim.receiptFilename})
                                </small>
                              )}
                            </button>
                          ) : (
                            <small style={{ color: 'var(--muted)', fontSize: 12 }}>
                              No receipt attached
                            </small>
                          )}
                        </div>

                        <div>
                          {isPending && (
                            <button
                              type="button"
                              className="btn ghost sm"
                              onClick={() => handleCancel(claim.id)}
                              disabled={cancellingId === claim.id}
                              style={{ color: 'var(--red, #ef4444)' }}
                            >
                              {cancellingId === claim.id ? 'Cancelling…' : 'Cancel claim'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {showNewModal && (
        <NewReimbursementModal
          onClose={() => setShowNewModal(false)}
          onSuccess={() => {
            setShowNewModal(false)
            setNotice('Reimbursement claim submitted successfully. Awaiting HR review.')
            void loadData()
          }}
        />
      )}

      {activeReceipt && (
        <ReceiptViewerModal
          claimId={activeReceipt.id}
          claimRef={activeReceipt.ref}
          claimTitle={activeReceipt.title}
          filename={activeReceipt.receiptFilename}
          onClose={() => setActiveReceipt(null)}
        />
      )}
    </div>
  )
}
