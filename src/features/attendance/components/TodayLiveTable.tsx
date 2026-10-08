import { useNavigate } from 'react-router-dom'
import { Pagination, usePage } from '../../../shared/ui/Pagination'
import { deptColor } from '../../../shared/lib/departments'
import { asHours, initials } from '../../../shared/lib/format'
import { STATUS_CLASS, type TodayBoardRow } from '../attendance.types'

export function TodayLiveTable({ rows }: { rows: TodayBoardRow[] }) {
  const navigate = useNavigate()
  const page = usePage(rows, 25)

  if (rows.length === 0) {
    return (
      <div className="empty" style={{ padding: '36px 16px' }}>
        <b>Nobody in this state today</b>
        <p style={{ marginTop: 6, color: 'var(--muted2)' }}>Pick another status pill above to widen the view.</p>
      </div>
    )
  }

  return (
    <>
      <div className="scroll live-scroll">
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th className="hide-md">Department</th>
              <th className="hide-sm">Shift</th>
              <th>Check-in</th>
              <th className="hide-sm">Check-out</th>
              <th>Active hours</th>
              <th>Status</th>
              <th style={{ width: 44, textAlign: 'center' }}></th>
            </tr>
          </thead>
          <tbody>
            {page.items.map((row) => {
              const maxHours = 9
              const pct = Math.min((row.activeHours / maxHours) * 100, 100)
              const barColor =
                row.activeHours >= 6
                  ? 'var(--green)'
                  : row.activeHours > 0
                    ? 'var(--saffron)'
                    : 'var(--line)'

              return (
                <tr
                  className="row"
                  key={row.employeeId}
                  tabIndex={0}
                  role="link"
                  aria-label={`Open profile of ${row.name}`}
                  onClick={() => navigate(`/me/${row.employeeId}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate(`/me/${row.employeeId}`)
                    }
                  }}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        className="avatar sm"
                        style={{ background: deptColor(row.department) }}
                      >
                        {initials(row.name)}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{row.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted2)' }}>{row.code}</div>
                      </div>
                    </div>
                  </td>

                  <td className="hide-md">
                    {row.department ? (
                      <span className="dept">
                        <span
                          className="dot"
                          style={{ background: deptColor(row.department) }}
                        />
                        {row.department}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--muted2)' }}>—</span>
                    )}
                  </td>

                  <td className="hide-sm">
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {row.shiftStart}–{row.shiftEnd}
                    </span>
                  </td>

                  <td>
                    <span>{row.loginAt ?? '—'}</span>
                    {row.status === 'Late' && row.lateByMinutes > 15 && (
                      <span className="chip c-pend" style={{ marginLeft: 6, fontSize: 11 }}>
                        +{row.lateByMinutes}m
                      </span>
                    )}
                  </td>

                  <td className="hide-sm">{row.logoutAt ?? '—'}</td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
                      <div className="bar" style={{ flex: 1, height: 6, background: 'var(--line)', borderRadius: 3, overflow: 'hidden' }}>
                        <i
                          style={{
                            display: 'block',
                            height: '100%',
                            width: `${pct}%`,
                            background: barColor,
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                      <b style={{ fontSize: 12, minWidth: 50, textAlign: 'right' }}>
                        {row.activeHours > 0 ? asHours(row.activeHours) : '—'}
                      </b>
                    </div>
                  </td>

                  <td>
                    <span className={`chip ${STATUS_CLASS[row.status]}`}>
                      {row.status}
                      {row.leaveType ? ` · ${row.leaveType}` : ''}
                    </span>
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <span className="btn sq sm ghost" title="Open profile" style={{ padding: 0 }}>
                      →
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={page} unit="members" />
    </>
  )
}
