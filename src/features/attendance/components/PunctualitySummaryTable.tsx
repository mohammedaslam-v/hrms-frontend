import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { attendanceApi } from '../attendance.api'
import type { PunctualityEmployeeSummary } from '../attendance.types'
import { deptColor } from '../../../shared/lib/departments'
import { asHours, initials } from '../../../shared/lib/format'
import { Pagination, usePage } from '../../../shared/ui/Pagination'

export function PunctualitySummaryTable({
  departments,
}: {
  departments: string[]
}) {
  const navigate = useNavigate()

  // Default date window: 1st of current month up to today
  const [from, setFrom] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [department, setDepartment] = useState<string>('')

  const [summary, setSummary] = useState<PunctualityEmployeeSummary[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await attendanceApi.getSummary({
        from,
        to,
        department: department || undefined,
      })
      setSummary(res.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not fetch punctuality analytics.')
    } finally {
      setLoading(false)
    }
  }, [from, to, department])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const page = usePage(summary, 25)

  return (
    <div>
      {/* Controls Bar */}
      <div
        className="card"
        style={{
          marginBottom: 16,
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>From:</label>
            <input
              type="date"
              className="inp"
              style={{ width: 140, padding: '6px 10px' }}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>To:</label>
            <input
              type="date"
              className="inp"
              style={{ width: 140, padding: '6px 10px' }}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <select
            className="inp"
            style={{ width: 160, padding: '6px 10px' }}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: 12, color: 'var(--muted2)' }}>
          Fair formula: <code style={{ fontSize: 11, background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: 4 }}>onTime ÷ (onTime + late + halfDay) × 100</code>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="empty" style={{ padding: '36px 16px' }}>
            Calculating punctuality metrics…
          </div>
        </div>
      ) : error ? (
        <div className="notice bad" role="alert">
          {error}
        </div>
      ) : summary.length === 0 ? (
        <div className="card">
          <div className="empty" style={{ padding: '36px 16px' }}>
            <b>No summary data available</b>
            <p style={{ marginTop: 6, color: 'var(--muted2)' }}>
              Try adjusting the date range or selecting a different department.
            </p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="scroll live-scroll">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Department</th>
                  <th className="num-col">Working Days</th>
                  <th className="num-col">On Time</th>
                  <th className="num-col">Late</th>
                  <th className="num-col">Absent</th>
                  <th className="num-col">Leave</th>
                  <th className="num-col">Avg Active</th>
                  <th className="num-col">Punctuality %</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((row) => {
                  const pct = Math.round(row.punctuality)
                  const chipClass =
                    pct >= 90 ? 'c-in' : pct >= 75 ? 'c-pend' : 'c-abs'

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

                      <td>
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

                      <td className="num-col">{row.workingDays}</td>

                      <td className="num-col" style={{ color: 'var(--green)', fontWeight: 600 }}>
                        {row.onTime}
                      </td>

                      <td
                        className="num-col"
                        style={{
                          color: row.late > 0 ? 'var(--coral)' : 'inherit',
                          fontWeight: row.late > 0 ? 600 : 'normal',
                        }}
                      >
                        {row.late}
                      </td>

                      <td
                        className="num-col"
                        style={{
                          color: row.absent > 0 ? 'var(--maroon)' : 'inherit',
                          fontWeight: row.absent > 0 ? 600 : 'normal',
                        }}
                      >
                        {row.absent}
                      </td>

                      <td className="num-col">{row.leave}</td>

                      <td className="num-col">
                        {row.avgActiveHours > 0 ? asHours(row.avgActiveHours) : '—'}
                      </td>

                      <td className="num-col">
                        <span className={`chip ${chipClass}`} style={{ fontWeight: 700 }}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} unit="members" />
        </div>
      )}
    </div>
  )
}
