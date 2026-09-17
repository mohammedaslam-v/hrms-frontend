import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHero } from '../../../shared/ui/PageHero'
import { Pagination, usePage } from '../../../shared/ui/Pagination'
import { leaveApi } from '../leave.api'
import { HALF_DAY_LABEL, type LeaveStatus, type MyLeaveView } from '../leave.types'
import { LeaveApplyModal } from '../components/LeaveApplyModal'
import { MONTHS, fmtShort, fmtMonth } from '../../../shared/lib/date'

const STATUS_CLASS: Record<LeaveStatus, string> = {
  Approved: 'c-in',
  Pending: 'c-pend',
  Rejected: 'c-abs',
  Cancelled: 'c-out',
}

export function MyLeavePage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const employeeId = id ? Number(id) : undefined
  const isSelf = !employeeId

  const [view, setView] = useState<MyLeaveView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const next = employeeId
        ? await leaveApi.getForEmployee(employeeId)
        : await leaveApi.getMine()
      setView(next)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load leave records.')
    } finally {
      setLoading(false)
    }
  }, [employeeId])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [load])

  const cancel = async (reqId: number) => {
    setCancellingId(reqId)
    setError(null)
    try {
      setView(await leaveApi.cancel(reqId, employeeId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel that request.')
    } finally {
      setCancellingId(null)
    }
  }

  // Above the early returns — hooks cannot sit behind a branch.
  const requestsPage = usePage(view?.requests ?? [])

  if (loading) return <div className="boot">Loading leave records…</div>

  if (!view) {
    return (
      <div className="page">
        <div className="notice bad">{error ?? 'Could not load leave records.'}</div>
      </div>
    )
  }

  const { ledger, requests, policy, monthlyTaken } = view
  const chartMax = Math.max(...monthlyTaken.map((m) => m.days), 3)

  const personFirstName = view.employee?.fullName?.split(' ')[0] ?? 'Employee'

  return (
    <div className="page">
      <PageHero
        navKey="myleave"
        title={!isSelf && view.employee ? `${view.employee.fullName}’s leave` : undefined}
        eyebrow={
          <>
            {!isSelf && view.employee && `${view.employee.employeeCode} · `}
            {ledger.balance} day{ledger.balance === 1 ? '' : 's'} available ·{' '}
            {ledger.taken} taken this year
          </>
        }
      >
        <button className="btn primary" onClick={() => setApplying(true)}>
          {isSelf ? 'Apply for leave' : 'Apply on behalf'}
        </button>
      </PageHero>

      {!isSelf && (
        <div
          className="notice blue"
          style={{
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div>
            You are viewing <b>{view.employee?.fullName ?? 'this employee'}</b>’s leave record as
            their manager/admin. You can view their balance, history, and apply for leave on their
            behalf.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
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
              onClick={() => navigate('/leave')}
              style={{ background: '#ffffff' }}
            >
              View my own leave
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="notice bad" style={{ marginBottom: 16 }} role="alert">
          {error}
        </div>
      )}

      <div className="grid g32">
        <div>
          <div className="card">
            <h3>{isSelf ? 'My balance' : `${personFirstName}’s balance`}</h3>
            <div className="lvbal">
              <div className="b">
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
              <div className="b">
                <div className="n" style={{ color: ledger.lop ? 'var(--red)' : undefined }}>
                  {ledger.lop}
                </div>
                <div className="l">Loss of pay</div>
              </div>
            </div>
            <div className="hint mt8">
              {policy.leavePerMonth} earned leaves are credited on the 1st of every month —{' '}
              {policy.annualEntitlement} for the year, covering festivals and everything else. Leave
              can only be taken from the accumulated balance; anything beyond it is recorded as
              loss of pay and deducted from that month's salary. Each month stands on its own — a
              loss of pay month does not eat into the credits that follow.
            </div>
            <button className="btn primary mt hide-sm" onClick={() => setApplying(true)}>
              {isSelf ? 'Apply for leave' : 'Apply on behalf'}
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

              {ledger.rows.map((row) => (
                <div className="r" key={row.month}>
                  <span>{fmtMonth(row.month)} · monthly credit</span>
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
                      {r.daysCounted < r.days && r.leaveType !== 'Unpaid' && (
                        <span className="hint" style={{ display: 'inline', marginLeft: 4 }}>
                          ({r.daysCounted} of {r.days} so far)
                        </span>
                      )}
                    </span>
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
            <h3>{isSelf ? 'My requests' : `${personFirstName}’s requests`}</h3>
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
                          {policy.leavePerMonth} days a month keep adding up until used.
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
                  <div
                    className="wb"
                    key={m.month}
                    title={`${fmtMonth(m.month)} · ${m.days} day(s)`}
                  >
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
          employeeId={employeeId}
          employeeName={view.employee?.fullName}
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
