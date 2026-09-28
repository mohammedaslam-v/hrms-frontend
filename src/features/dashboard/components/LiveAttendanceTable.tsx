import { useNavigate } from 'react-router-dom'
import { Pagination, usePage } from '../../../shared/ui/Pagination'
import { STATUS_CLASS } from '../../attendance'
import { deptColor } from '../../../shared/lib/departments'
import { asHours, initials } from '../../../shared/lib/format'
import type { LiveRow } from '../dashboard.types'

const MODE_CLASS: Record<string, string> = {
  WFO: 'c-in',
  WFH: 'c-wfh',
  Hybrid: 'c-out',
}

/**
 * Who is working right now, busiest first.
 *
 * Paginated because an admin's roster is 450 people and the design's single
 * scrolling table becomes unusable long before that. Twenty-five to a page, and
 * those twenty-five scroll inside a capped card rather than stretching it —
 * otherwise the card runs three times the height of the two beside it.
 *
 * A row opens that person's page; who may open it is decided by the API, not by
 * this table.
 */
export function LiveAttendanceTable({ rows }: { rows: LiveRow[] }) {
  const navigate = useNavigate()
  const page = usePage(rows)

  if (rows.length === 0) {
    return <div className="empty">Nobody on this roster yet.</div>
  }

  return (
    <>
      <div className="scroll live-scroll">
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th className="hide-md">Department</th>
              <th className="hide-sm">Mode</th>
              <th className="hide-lg">Shift</th>
              <th>Check-in</th>
              <th>Active today</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {page.items.map((row) => (
              <tr
                className="row"
                key={row.employeeId}
                tabIndex={0}
                role="link"
                aria-label={`Open ${row.name}`}
                onClick={() => navigate(`/me/${row.employeeId}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate(`/me/${row.employeeId}`)
                  }
                }}
              >
                <td>
                  {/* The avatar takes its colour from an inline style — the
                      class supplies white text and no background of its own. */}
                  <span className="avatar sm" style={{ background: deptColor(row.department) }}>
                    {initials(row.name)}
                  </span>
                  {row.name}
                </td>
                <td className="hide-md">
                  {row.department ? (
                    <span className="dept">
                      <span className="dot" style={{ background: deptColor(row.department) }} />
                      {row.department}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--muted2)' }}>—</span>
                  )}
                </td>
                <td className="hide-sm">
                  <span className={`chip ${MODE_CLASS[row.workMode] ?? 'c-out'}`}>
                    {row.workMode}
                  </span>
                </td>
                <td className="hide-lg">
                  {row.shiftStart}–{row.shiftEnd}
                </td>
                <td>{row.loginAt ?? '—'}</td>
                <td>
                  <b>{row.activeHours > 0 ? asHours(row.activeHours) : '—'}</b>
                </td>
                <td>
                  <span className={`chip ${STATUS_CLASS[row.status]}`}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} unit="people" />
    </>
  )
}
