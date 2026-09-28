import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHero } from '../../../shared/ui/PageHero'
import { Pagination, usePage } from '../../../shared/ui/Pagination'
import { formatNumberInr, initials } from '../../../shared/lib/format'
import { deptColor } from '../../../shared/lib/departments'
import { taxApi } from '../tax.api'
import { exportTaxRegisterCsv } from '../tax.register.export'
import type { TaxRegisterResponse } from '../tax.types'

/**
 * Company TDS register — every employee's tax in one table.
 *
 * The basis of the quarterly Form 24Q, so the figures here are the same ones
 * each employee sees on My tax: the same domain functions over the same inputs,
 * run in bulk. There is no second calculation to drift from the first.
 *
 * Admin only. The rail hides it from everyone else and the API refuses anyone
 * who reaches it another way.
 */
export function CompanyTaxRegisterPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<TaxRegisterResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [department, setDepartment] = useState('')

  const load = useCallback(async () => {
    try {
      setData(await taxApi.getCompanyRegister())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the TDS register.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [load])

  const rows = useMemo(
    () => (data?.rows ?? []).filter((r) => !department || r.department === department),
    [data, department],
  )

  // Totals follow the filter — a footer that keeps showing the company total
  // while the table shows one department is the kind of number people file.
  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          totalTax: acc.totalTax + r.totalTax,
          monthlyTds: acc.monthlyTds + r.monthlyTds,
          deductedTillDate: acc.deductedTillDate + r.deductedTillDate,
        }),
        { totalTax: 0, monthlyTds: 0, deductedTillDate: 0 },
      ),
    [rows],
  )

  const page = usePage(rows)

  if (loading) {
    return (
      <div className="page">
        <PageHero navKey="alltax" />
        <div className="card">
          <div className="empty">Loading…</div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="page">
        <PageHero navKey="alltax" />
        <div className="notice bad" role="alert">
          {error ?? 'Could not load the TDS register.'}
        </div>
      </div>
    )
  }

  const money = (n: number) => formatNumberInr(n)

  return (
    <div className="page">
      <PageHero
        navKey="alltax"
        eyebrow={`FY ${data.company.fy} · AY ${data.company.ay} · TAN ${data.company.tan} · ${data.totals.people} people`}
      />

      <div className="filters">
        <div className="f">
          <label htmlFor="txDept">Department</label>
          <select
            id="txDept"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="">All departments</option>
            {data.departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <button
          className="btn indigo"
          type="button"
          onClick={() => exportTaxRegisterCsv(data, department)}
          disabled={rows.length === 0}
        >
          Download CSV
        </button>
      </div>

      {/* A column of zeroes is the truth here, not a bug — but it reads as
          "no tax deducted all year" unless it says why. */}
      {data.noPayslipsYet && (
        <div className="notice mt8">
          <b>Deducted YTD is zero for everyone.</b> No payslip has been finalised
          yet, so there is nothing deducted to report. Annual and monthly TDS
          below are the computed figures and are correct.
        </div>
      )}

      <div className="card mt">
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Member</th>
                <th className="hide-lg">PAN</th>
                <th className="num-col">Gross salary</th>
                <th className="num-col hide-lg">Std deduction</th>
                <th className="num-col">Taxable</th>
                <th className="num-col hide-md">Tax on slabs</th>
                <th className="num-col hide-md">87A rebate</th>
                <th className="num-col hide-sm">Cess</th>
                <th className="num-col">Annual TDS</th>
                <th className="num-col">Monthly</th>
                <th className="num-col hide-sm">Deducted YTD</th>
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
                  onClick={() => navigate(`/tax/${row.employeeId}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate(`/tax/${row.employeeId}`)
                    }
                  }}
                >
                  <td>
                    <span className="tag">{row.code}</span>
                  </td>
                  <td>
                    <span className="avatar sm" style={{ background: deptColor(row.department) }}>
                      {initials(row.name)}
                    </span>
                    {row.name}
                  </td>
                  <td className="hide-lg">
                    {/* PENDING is what the API returns when HR has not supplied
                        one. Saying so beats an empty cell nobody can action. */}
                    {row.pan === 'PENDING' ? (
                      <span style={{ color: 'var(--amber)' }}>Not on file</span>
                    ) : (
                      row.pan
                    )}
                  </td>
                  <td className="num-col">{money(row.grossSalary)}</td>
                  <td className="num-col hide-lg">{money(row.stdDeduction)}</td>
                  <td className="num-col">{money(row.taxableIncome)}</td>
                  <td className="num-col hide-md">{money(row.slabTax)}</td>
                  <td className="num-col hide-md">
                    {row.rebate87A ? money(row.rebate87A) : '—'}
                  </td>
                  <td className="num-col hide-sm">{money(row.cessAmount)}</td>
                  <td className="num-col">
                    <b>{money(row.totalTax)}</b>
                  </td>
                  <td className="num-col">{money(row.monthlyTds)}</td>
                  <td className="num-col hide-sm">{money(row.deductedTillDate)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={9}>
                  <b>
                    Total · {rows.length} {rows.length === 1 ? 'person' : 'people'}
                    {department ? ` · ${department}` : ''}
                  </b>
                </td>
                <td className="num-col">
                  <b>{money(totals.totalTax)}</b>
                </td>
                <td className="num-col">
                  <b>{money(totals.monthlyTds)}</b>
                </td>
                <td className="num-col hide-sm">
                  <b>{money(totals.deductedTillDate)}</b>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <Pagination page={page} unit="people" />
      </div>

      {rows.length === 0 && (
        <div className="card mt">
          <div className="empty">
            <b>Nobody to show</b>
            {department
              ? 'No employees in that department.'
              : 'No employees on the payroll yet.'}
          </div>
        </div>
      )}
    </div>
  )
}
