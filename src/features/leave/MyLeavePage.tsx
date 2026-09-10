import { useCallback, useEffect, useState } from 'react'
import { PageHero } from '../../components/PageHero'
import { Pagination, usePage } from '../../components/Pagination'
import { leaveApi } from './leave.api'
import { HALF_DAY_LABEL, type LeaveStatus, type MyLeaveView } from './leave.types'
import { LeaveApplyModal } from './LeaveApplyModal'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const fmtShort = (iso: string): string => {
  const [, m, d] = iso.split('-')
  return `${d} ${MONTHS[Number(m) - 1]}`
}

const monthLabel = (key: string): string => {
  const [y, m] = key.split('-')
  return `${MONTHS[Number(m) - 1]} ${y}`
}


const STATUS_CLASS: Record<LeaveStatus, string> = {
  Approved: 'c-in',
  Pending: 'c-pend',
  Rejected: 'c-abs',
  Cancelled: 'c-out',
}

export function MyLeavePage() {
  const [view, setView] = useState<MyLeaveView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      // Nothing is set before the first await, so the effect stays free of
      // synchronous state updates and cannot cascade a render.
      const next = await leaveApi.getMine()
      setView(next)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your leave.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Fetch on mount is the case the rule explicitly allows — synchronising with
    // an external system. Every state update inside load() happens after an await.
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [load])

  const cancel = async (id: number) => {
    setCancellingId(id)
    setError(null)
    try {
      setView(await leaveApi.cancel(id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel that request.')
    } finally {
      setCancellingId(null)
    }
  }

  // Above the early returns — hooks cannot sit behind a branch.
  const requestsPage = usePage(view?.requests ?? [])

  if (loading) return <div className="boot">Loading your leave…</div>

  if (!view) {
    return (
      <div className="page">
        <div className="notice bad">{error ?? 'Could not load your leave.'}</div>
      </div>
    )
  }

  const { ledger, requests, policy, monthlyTaken } = view
  const chartMax = Math.max(...monthlyTaken.map((m) => m.days), 3)

  return (
    <div className="page">
      <PageHero
        navKey="myleave"
        eyebrow={
          <>
            {ledger.balance} day{ledger.balance === 1 ? '' : 's'} available ·{' '}
            {ledger.taken} taken this year
          </>
        }
      >
        <button className="btn primary" onClick={() => setApplying(true)}>
          Apply for leave
        </button>
      </PageHero>

      {error && (
        <div className="notice bad" style={{ marginBottom: 16 }} role="alert">
          {error}
        </div>
      )}

      <div className="grid g32">
        <div>
          <div className="card">
            <h3>My balance</h3>
            <div className="lvbal">
              <div className="b">
                {/* The balance never goes below zero: leave beyond it is settled
                    that month as loss of pay, not carried as a debt. */}
                <div
                  className="n"
                  style={{ color: ledger.balance <= 0 ? 'var(--red)' : 'var(--violet)' }}
                >
                  {ledger.balance}
                </div>
                <div className="l">Balance today</div>
              </div>
              <div className="b">
                <div className="n">{ledger.credited}</div>
                <div className="l">Credited this year</div>
              </div>
              <div className="b">
                <div className="n">{ledger.taken}</div>
                <div className="l">Taken</div>
              </div>
              <div className="b">
                <div className="n" style={{ color: ledger.pending ? 'var(--amber)' : undefined }}>
                  {ledger.pending}
                </div>
                <div className="l">Awaiting approval</div>
              </div>
              {/* Loss of pay never touches the balance, so it needs its own figure
                  or the days simply vanish from the page. */}
              <div className="b">
                <div className="n" style={{ color: ledger.lop ? 'var(--red)' : undefined }}>
                  {ledger.lop}
                </div>
                <div className="l">Loss of pay</div>
              </div>
            </div>
            <div className="hint mt8">
              {policy.leavePerMonth} earned leaves are credited on the 1st of every month —{' '}
              {policy.annualEntitlement} for the year, covering festivals and everything else.
              Leave can only be taken from the accumulated balance; anything beyond it is
              recorded as loss of pay and deducted from that month's salary. Each month
              stands on its own — a loss of pay month does not eat into the credits that
              follow.
            </div>
            <button className="btn primary mt hide-sm" onClick={() => setApplying(true)}>
              Apply for leave
            </button>
          </div>

          <div className="card mt">
            <h3>
              Accrual ledger <span className="sub">· {policy.leaveYear}</span>
            </h3>
            <div className="ledger">
              <div className="r">
                <span>Opening balance · 01 Jan {policy.leaveYear}</span>
                <b>{ledger.opening.toFixed(1)}</b>
              </div>

              {/* Monthly credits first, then the leave taken — matching the
                  approved design, which reads as a statement rather than a
                  month-by-month running total. */}
              {ledger.rows.map((row) => (
                <div className="r" key={row.month}>
                  <span>{monthLabel(row.month)} · monthly credit</span>
                  <b style={{ color: 'var(--green)' }}>+{row.credit.toFixed(1)}</b>
                </div>
              ))}

              {requests
                .filter((r) => r.status === 'Approved')
                .slice()
                .sort((a, b) => (a.fromDate < b.fromDate ? -1 : 1))
                .map((r) => (
                  <div className="r" key={r.id}>
                    <span>
                      {fmtShort(r.fromDate)} · {r.leaveType}
                      {r.isHalfDay && r.halfDaySession && ` · ${HALF_DAY_LABEL[r.halfDaySession]}`}
                      {r.leaveType === 'Unpaid' && ' (loss of pay)'}
                      {/* A request running into a future month is only partly
                          deducted so far, so say so rather than appear wrong. */}
                      {r.daysCounted < r.days && r.leaveType !== 'Unpaid' && (
                        <span className="hint" style={{ display: 'inline', marginLeft: 4 }}>
                          ({r.daysCounted} of {r.days} so far)
                        </span>
                      )}
                    </span>
                    {/* Days the employee chose as unpaid never touch the balance. */}
                    <b
                      style={{
                        color: r.leaveType === 'Unpaid' ? 'var(--muted)' : 'var(--red)',
                      }}
                    >
                      {r.leaveType === 'Unpaid' ? '0.0' : `−${r.daysCounted.toFixed(1)}`}
                    </b>
                  </div>
                ))}

              <div className="r ledger-total">
                <b>Balance</b>
                <b style={{ color: 'var(--violet)' }}>{ledger.balance.toFixed(1)} days</b>
              </div>
            </div>
          </div>

        </div>

        <div>
          <div className="card">
            <h3>My requests</h3>
            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th className="num-col">Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="empty">
                          <b>No leave applied yet</b>
                          Your {policy.leavePerMonth} days a month keep adding up until you use
                          them.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    requestsPage.items.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <span className="tag">{r.ref}</span>
                        </td>
                        <td>
                          {r.leaveType}
                          {r.isHalfDay && r.halfDaySession && (
                            <div className="hint">{HALF_DAY_LABEL[r.halfDaySession]}</div>
                          )}
                        </td>
                        <td>{fmtShort(r.fromDate)}</td>
                        <td>{fmtShort(r.toDate)}</td>
                        <td className="num-col">{r.days}</td>
                        <td className="wrap">{r.reason}</td>
                        <td>
                          <span className={`chip ${STATUS_CLASS[r.status]}`}>{r.status}</span>
                        </td>
                        <td>
                          {r.status === 'Pending' && (
                            <button
                              className="btn ghost sm"
                              onClick={() => void cancel(r.id)}
                              disabled={cancellingId === r.id}
                            >
                              {cancellingId === r.id ? '…' : 'Cancel'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={requestsPage} unit="requests" />
          </div>

          <div className="card mt">
            <h3>
              Leave taken <span className="sub">· by month, this leave year</span>
            </h3>
            <div className="scroll">
              <div className="weekbars">
              {monthlyTaken.map((m) => (
                <div className="wb" key={m.month} title={`${monthLabel(m.month)} · ${m.days} day(s)`}>
                  <div className="col">
                    <i style={{ height: `${(m.days / chartMax) * 100}%` }} />
                  </div>
                  <span>{MONTHS[Number(m.month.split('-')[1]) - 1]}</span>
                </div>
                ))}
              </div>
            </div>
            <div className="hint mt8">
              Weekly off: {policy.weeklyOff.join(' + ') || 'none set'} · leave days exclude weekly
              offs only.
            </div>
          </div>
        </div>
      </div>

      {applying && (
        <LeaveApplyModal
          onApplied={(next) => {
            setView(next)
            setApplying(false)
          }}
          onClose={() => setApplying(false)}
        />
      )}
    </div>
  )
}
