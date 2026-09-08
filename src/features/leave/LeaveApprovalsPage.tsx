import { useCallback, useEffect, useState } from 'react'
import { approvalsApi } from './leave.api'
import {
  HALF_DAY_LABEL,
  type ApprovalsView,
  type LeaveStatus,
  type PendingApproval,
} from './leave.types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const fmtShort = (iso: string): string => {
  const [, m, d] = iso.split('-')
  return `${d} ${MONTHS[Number(m) - 1]}`
}

const STATUS_CLASS: Record<LeaveStatus, string> = {
  Approved: 'c-in',
  Pending: 'c-pend',
  Rejected: 'c-abs',
  Cancelled: 'c-out',
}

type Tab = 'pending' | 'balances' | 'log'

export function LeaveApprovalsPage() {
  const [view, setView] = useState<ApprovalsView | null>(null)
  const [tab, setTab] = useState<Tab>('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [decidingId, setDecidingId] = useState<number | null>(null)
  const [confirming, setConfirming] = useState<PendingApproval | null>(null)

  const load = useCallback(async () => {
    try {
      const next = await approvalsApi.get()
      setView(next)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load approvals.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [load])

  const decide = async (id: number, decision: 'Approved' | 'Rejected') => {
    setDecidingId(id)
    setError(null)
    try {
      const result = await approvalsApi.decide(id, decision)
      setView(result.view)
      // The conversion to loss of pay is never silent — the approver is told.
      setNotice(result.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record that decision.')
    } finally {
      setDecidingId(null)
    }
  }

  if (loading) return <div className="boot">Loading approvals…</div>

  if (!view) {
    return (
      <div className="page">
        <div className="notice bad">{error ?? 'Could not load approvals.'}</div>
      </div>
    )
  }

  const { pending, balances, log, policy, teamSize } = view

  return (
    <div className="page">
      <div className="hero">
        <div className="hero-txt">
          <h2>Leave approvals</h2>
          <div className="eyebrow">
            {pending.length} awaiting your decision · {teamSize} in your team
          </div>
        </div>
      </div>

      {error && (
        <div className="notice bad" style={{ marginBottom: 16 }} role="alert">
          {error}
        </div>
      )}
      {!error && notice && (
        <div className="notice blue" style={{ marginBottom: 16 }} role="status">
          {notice}
        </div>
      )}

      <div className="tabs">
        <button className={`tab${tab === 'pending' ? ' on' : ''}`} onClick={() => setTab('pending')}>
          Approvals <span className="n">{pending.length}</span>
        </button>
        <button className={`tab${tab === 'balances' ? ' on' : ''}`} onClick={() => setTab('balances')}>
          Balances
        </button>
        <button className={`tab${tab === 'log' ? ' on' : ''}`} onClick={() => setTab('log')}>
          All requests
        </button>
      </div>

      {tab === 'pending' && (
        <div className="card">
          <h3>Pending approvals</h3>
          <div className="scroll">
            {/* The decision buttons stay pinned to the right edge, so a manager
                never has to scroll the table to act on a row. */}
            <table className="sticky-actions">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th className="num-col">Days</th>
                  <th>Reason</th>
                  <th>Applied</th>
                  <th className="num-col">Balance after</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pending.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="empty">
                        <b>Nothing waiting on you</b>
                        Decided requests move to the All requests tab.
                      </div>
                    </td>
                  </tr>
                ) : (
                  pending.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="stack">
                          <b>{p.employeeName}</b>
                          <span>{p.designation ?? p.employeeCode}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`chip ${p.leaveType === 'Unpaid' ? 'c-abs' : 'c-leave'}`}>
                          {p.leaveType}
                        </span>
                        {/* A half day says which half, so the approver knows the cover needed. */}
                        {p.isHalfDay && p.halfDaySession && (
                          <div className="hint">{HALF_DAY_LABEL[p.halfDaySession]}</div>
                        )}
                      </td>
                      <td>{fmtShort(p.fromDate)}</td>
                      <td>{fmtShort(p.toDate)}</td>
                      <td className="num-col">
                        <b>{p.days}</b>
                      </td>
                      <td className="wrap">{p.reason}</td>
                      <td>{fmtShort(p.appliedOn)}</td>
                      <td className="num-col">
                        {/* Showing the consequence before the decision, not after */}
                        <b>{p.balanceAfter}</b>
                        {p.unpaidDays > 0 && (
                          <div className="hint" style={{ color: 'var(--red)' }}>
                            {p.unpaidDays} would be loss of pay
                          </div>
                        )}
                        {p.createsLossOfPay && (
                          <span className="chip c-abs" style={{ marginTop: 4 }}>
                            Costs pay
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="btn success sm"
                            // Approving beyond the balance costs the employee pay,
                            // so it is the manager's call — confirmed, not one click.
                            onClick={() =>
                              p.createsLossOfPay
                                ? setConfirming(p)
                                : void decide(p.id, 'Approved')
                            }
                            disabled={decidingId === p.id}
                          >
                            {decidingId === p.id ? '…' : 'Approve'}
                          </button>
                          <button
                            className="btn ghost sm"
                            onClick={() => void decide(p.id, 'Rejected')}
                            disabled={decidingId === p.id}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="notice blue mt">
            Every employee is credited {policy.leavePerMonth} leaves on the 1st of each month —{' '}
            {policy.annualEntitlement} for the year {policy.leaveYear}, covering festivals and
            everything else. Approving beyond the balance records the shortfall as loss of
            pay, deducted from that month's salary. Each month is settled on its own, so the
            credits that follow are unaffected.
          </div>
        </div>
      )}

      {tab === 'balances' && (
        <div className="card">
          <h3>
            Team balances <span className="sub">· {policy.leaveYear}</span>
          </h3>
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Member</th>
                  <th className="num-col">Opening</th>
                  <th className="num-col">Credited</th>
                  <th className="num-col">Taken</th>
                  <th className="num-col">Pending</th>
                  <th className="num-col">LOP</th>
                  <th className="num-col">Balance</th>
                  <th>Last leave</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((b) => (
                  <tr key={b.employeeId}>
                    <td>
                      <span className="tag">{b.employeeCode}</span>
                    </td>
                    <td>{b.employeeName}</td>
                    <td className="num-col">{b.opening}</td>
                    <td className="num-col">{b.credited}</td>
                    <td className="num-col">
                      <b>{b.taken}</b>
                    </td>
                    <td className="num-col">{b.pending || '—'}</td>
                    <td className="num-col" style={{ color: b.lop ? 'var(--red)' : undefined }}>
                      {b.lop || '—'}
                    </td>
                    <td className="num-col">
                      <b style={{ color: b.balance <= 0 ? 'var(--red)' : 'var(--violet)' }}>
                        {b.balance}
                      </b>
                    </td>
                    <td>{b.lastLeaveOn ? fmtShort(b.lastLeaveOn) : '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>Total · {balances.length} people</td>
                  <td className="num-col">{sum(balances.map((b) => b.opening))}</td>
                  <td className="num-col">{sum(balances.map((b) => b.credited))}</td>
                  <td className="num-col">{sum(balances.map((b) => b.taken))}</td>
                  <td className="num-col">{sum(balances.map((b) => b.pending))}</td>
                  <td className="num-col">{sum(balances.map((b) => b.lop))}</td>
                  <td className="num-col">{sum(balances.map((b) => b.balance))}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {confirming && (
        <div
          className="modal on"
          onClick={(e) => e.target === e.currentTarget && setConfirming(null)}
        >
          <div className="box" style={{ maxWidth: 480 }}>
            <div className="mh">
              <h3>Approve at a cost of pay?</h3>
              <button className="x" type="button" onClick={() => setConfirming(null)}>
                ✕
              </button>
            </div>
            <div className="notice bad">
              <b>{confirming.employeeName}</b> has {confirming.balanceNow} day
              {confirming.balanceNow === 1 ? '' : 's'} and is asking for {confirming.days}.
              Approving leaves the balance at <b>{confirming.balanceAfter}</b>
              {confirming.unpaidDays > 0 ? (
                <>
                  {' '}
                  and records{' '}
                  <b>
                    {confirming.unpaidDays} day{confirming.unpaidDays === 1 ? '' : 's'}
                  </b>{' '}
                  as loss of pay.
                </>
              ) : (
                '.'
              )}
            </div>
            <p className="hint">
              The shortfall is settled by this month's salary deduction, not carried forward — next
              month's credits are theirs in full.
            </p>
            <div className="mfoot">
              <button className="btn ghost" type="button" onClick={() => setConfirming(null)}>
                Cancel
              </button>
              <button
                className="btn success"
                type="button"
                onClick={() => {
                  const id = confirming.id
                  setConfirming(null)
                  void decide(id, 'Approved')
                }}
              >
                Approve anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'log' && (
        <div className="card">
          <h3>All requests</h3>
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Member</th>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th className="num-col">Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Decided by</th>
                </tr>
              </thead>
              <tbody>
                {log.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="empty">No requests this year.</div>
                    </td>
                  </tr>
                ) : (
                  log.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <span className="tag">{r.ref}</span>
                      </td>
                      <td>{r.employeeName}</td>
                      <td>{r.leaveType}</td>
                      <td>{fmtShort(r.fromDate)}</td>
                      <td>{fmtShort(r.toDate)}</td>
                      <td className="num-col">{r.days}</td>
                      <td className="wrap">{r.reason}</td>
                      <td>
                        <span className={`chip ${STATUS_CLASS[r.status]}`}>{r.status}</span>
                      </td>
                      <td>{r.decidedBy ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const sum = (values: number[]): number =>
  Math.round(values.reduce((total, v) => total + v, 0) * 10) / 10
