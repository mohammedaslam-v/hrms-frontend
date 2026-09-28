import { deptColor } from '../../../shared/lib/departments'
import { asHours } from '../../../shared/lib/format'
import type { DepartmentHours } from '../dashboard.types'

/**
 * Active hours today, by department.
 *
 * Bars are drawn against the busiest department rather than a fixed scale, so
 * a quiet day still reads — the shape tells you who is carrying today, not how
 * today compares to an imaginary target.
 */
export function DepartmentBars({ rows }: { rows: DepartmentHours[] }) {
  if (rows.length === 0) {
    return <div className="empty">No activity logged yet today.</div>
  }

  return (
    <>
      {rows.map((row) => (
        <div style={{ marginBottom: 12 }} key={row.department}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12.5,
              marginBottom: 5,
            }}
          >
            <span className="dept">
              <span className="dot" style={{ background: deptColor(row.department) }} />
              {row.department}
            </span>
            <b>{asHours(row.hours)}</b>
          </div>
          <div className="bar">
            <i style={{ width: `${row.percent}%`, background: deptColor(row.department) }} />
          </div>
        </div>
      ))}
    </>
  )
}
