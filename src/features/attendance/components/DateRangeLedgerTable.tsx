import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { attendanceApi } from '../attendance.api'
import { STATUS_CLASS, type AttendanceRangeRow } from '../attendance.types'
import { deptColor } from '../../../shared/lib/departments'
import { initials } from '../../../shared/lib/format'
import { fmtDate } from '../../../shared/lib/date'
import { Pagination, usePage } from '../../../shared/ui/Pagination'

export function DateRangeLedgerTable({
  departments,
  members,
}: {
  departments: string[]
  members: { id: number; name: string; code: string }[]
}) {
  const navigate = useNavigate()

  // Default date window: past 13 days up to today
  const [from, setFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 13)
    return d.toISOString().slice(0, 10)
  })
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [employeeId, setEmployeeId] = useState<number | undefined>(undefined)
  const [department, setDepartment] = useState<string>('')
  const [status, setStatus] = useState<string>('')

  const [rows, setRows] = useState<AttendanceRangeRow[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await attendanceApi.getRange({
        from,
        to,
        employeeId: employeeId || undefined,
        department: department || undefined,
        status: status || undefined,
      })
      setRows(res.rows)
      setTotalCount(res.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not fetch attendance history.')
    } finally {
      setLoading(false)
    }
  }, [from, to, employeeId, department, status])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const downloadCsv = () => {
    if (rows.length === 0) return
    const headers = [
      'Date',
      'Day',
      'Employee Code',
      'Name',
      'Department',
      'Shift Start',
      'Check-in',
      'Check-out',
      'Active Hours',
      'Late By (mins)',
      'Status',
    ]

    const csvRows = rows.map((r) => [
      r.date,
      r.dayName,
      `"${r.code}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${(r.department || '—').replace(/"/g, '""')}"`,
      r.shiftStart,
      r.loginAt ?? '—',
      r.logoutAt ?? '—',
      r.activeHours > 0 ? r.activeHours.toFixed(2) : '0.00',
      r.lateByMinutes > 15 ? String(r.lateByMinutes) : '0',
      r.status,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `attendance_ledger_${from}_to_${to}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const page = usePage(rows, 25)

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
            style={{ width: 170, padding: '6px 10px' }}
            value={employeeId ?? ''}
            onChange={(e) => setEmployeeId(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">All members</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.code})
              </option>
            ))}
          </select>

          <select
            className="inp"
            style={{ width: 150, padding: '6px 10px' }}
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

          <select
            className="inp"
            style={{ width: 140, padding: '6px 10px' }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="On time">On time</option>
            <option value="Late">Late</option>
            <option value="Absent">Absent</option>
            <option value="Half day">Half day</option>
            <option value="Leave">Leave</option>
            <option value="Weekly off">Weekly off / Holiday</option>
          </select>
        </div>

        <button
          type="button"
          className="btn outline sm"
          onClick={downloadCsv}
          disabled={rows.length === 0}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <span>📥</span> Download CSV
        </button>
      </div>

      {/* Info indicator */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          color: 'var(--muted)',
          marginBottom: 10,
          padding: '0 4px',
        }}
      >
        <span>
          {totalCount} row{totalCount === 1 ? '' : 's'}
          {totalCount > 400 ? ' — showing the first 400. Download the CSV for the full set.' : ''}
        </span>
      </div>

      {loading ? (
        <div className="card">
          <div className="empty" style={{ padding: '36px 16px' }}>
            Loading attendance records…
          </div>
        </div>
      ) : error ? (
        <div className="notice bad" role="alert">
          {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="card">
          <div className="empty" style={{ padding: '36px 16px' }}>
            <b>Nothing in this window</b>
            <p style={{ marginTop: 6, color: 'var(--muted2)' }}>
              Widen the date range or clear the filters above.
            </p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="scroll live-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Member</th>
                  <th className="hide-md">Department</th>
                  <th className="hide-sm">Shift</th>
                  <th>Check-in</th>
                  <th className="hide-sm">Check-out</th>
                  <th className="num-col">Active (h)</th>
                  <th className="num-col">Late</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((row, idx) => (
                  <tr
                    className="row"
                    key={`${row.employeeId}_${row.date}_${idx}`}
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
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(row.date)}</td>
                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>{row.dayName}</td>

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
                        {row.shiftStart}
                      </span>
                    </td>

                    <td>
                      <span>{row.loginAt ?? '—'}</span>
                    </td>

                    <td className="hide-sm">{row.logoutAt ?? '—'}</td>

                    <td className="num-col">
                      <b>{row.activeHours > 0 ? row.activeHours.toFixed(2) : '—'}</b>
                    </td>

                    <td className="num-col">
                      {row.lateByMinutes > 15 ? (
                        <span style={{ color: 'var(--coral)', fontWeight: 600 }}>
                          +{row.lateByMinutes}m
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted2)' }}>—</span>
                      )}
                    </td>

                    <td>
                      <span className={`chip ${STATUS_CLASS[row.status]}`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} unit="records" />
        </div>
      )}
    </div>
  )
}
