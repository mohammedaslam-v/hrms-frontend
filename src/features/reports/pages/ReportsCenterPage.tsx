import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { PageHero } from '../../../shared/ui/PageHero';
import { useAuth } from '../../../app/auth-context';
import { reportsApi } from '../api/reports.api';
import { employeesApi } from '../../employees/employees.api';
import type { Employee } from '../../employees/employee.types';
import type {
  ReportFilterDto,
  ReportResult,
  ReportType,
  ReportColumn,
  ReportCatalogItem,
} from '../types/reports.types';
import { formatInr } from '../../../shared/lib/format';

export const PAYROLL_REPORT_TYPES: ReadonlySet<ReportType> = new Set([
  'salary',
  'pf',
  'provident_fund',
  'pt',
  'profession_tax',
  'tds',
  'loan',
  'loan_details',
  'net_pay',
  'income_tax',
  'appraisals',
]);

/**
 * The cells the search box looks in.
 *
 * The twenty reports call the name column four different things — `employee`,
 * `empName`, `employeeName`, `name` — so searching a single key would quietly
 * do nothing on most of them. `code` is here because people search by
 * BAM-0837 as readily as by a name, and `manager` so a lead can pull their own
 * team out of a company-wide report.
 */
const SEARCHABLE_KEYS = [
  'employee',
  'empName',
  'employeeName',
  'name',
  'code',
  'manager',
] as const

const REPORT_NOTES: Partial<Record<ReportType, string>> = {
  attendance: '',
  attsummary: '',
  late: 'A login more than 15 minutes after shift start is treated as late.',
  nologin:
    'Working days with no system activity at all — excludes approved leave, weekly offs and holidays.',
  active: '',
  salary: '',
  pf: 'PF wages are capped at the statutory ceiling of ₹15,000 a month. EPS is capped at ₹1,250.',
  provident_fund:
    'PF wages are capped at the statutory ceiling of ₹15,000 a month. EPS is capped at ₹1,250.',
  pt: 'Karnataka charges ₹200 a month once monthly gross reaches ₹25,000. Other states follow their own slabs.',
  profession_tax:
    'Karnataka charges ₹200 a month once monthly gross reaches ₹25,000. Other states follow their own slabs.',
  tds: 'Annual figures under section 115BAC. The period filter does not change these.',
  loan: 'Company loans and salary advances recovered through payroll.',
  loan_details: 'Company loans tracking: opening balance, monthly EMI, closing balance, and tenure.',
  net_pay:
    'Bank payout file with zero-padding protection for account numbers, IFSC, and net salary.',
  income_tax: 'Monthly TDS computation, taxable income, slab tax, and cess statement.',
  leave:
    '2 paid leaves are credited on the 1st of every month. Balance = opening + credited − taken.',
  goals:
    'Goals run over a quarter, a half year or the full financial year. The period filter does not change these.',
  basic: '',
  appraisals: 'Compensation revisions, increment amount, percentage hike, and revised annual CTC.',
  all_employees: 'Directory list of all currently active company employees.',
  recent_joinees: 'New workforce additions in the chosen timeframe.',
  recent_resignees: 'Departures and exit clearances in the chosen timeframe.',
};

export const ReportsCenterPage: React.FC = () => {
  const { employee } = useAuth();

  // User access is manager if defaultTier is 'manager' or if tiers does not include 'admin'
  const isManager = employee?.defaultTier === 'manager' || !employee?.tiers?.includes('admin');
  const isAdmin = !isManager && Boolean(employee?.tiers?.includes('admin'));

  const [catalog, setCatalog] = useState<ReportCatalogItem[]>([]);

  useEffect(() => {
    reportsApi
      .getCatalog()
      .then((data) => setCatalog(data || []))
      .catch(() => {});
  }, []);

  const canViewPayroll = useMemo(() => {
    // If user access is manager, strictly hide payroll reports
    if (isManager || !isAdmin) return false;
    // If backend catalog is loaded, verify backend allows Payroll category
    if (catalog.length > 0) {
      return catalog.some((item) => item.category === 'Payroll');
    }
    return true;
  }, [isManager, isAdmin, catalog]);

  const [selectedType, setSelectedType] = useState<ReportType>('attendance');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'range' | 'fytd'>('monthly');

  // If a non-admin/manager user ever has a payroll report selected, fallback to attendance
  useEffect(() => {
    if (!canViewPayroll && PAYROLL_REPORT_TYPES.has(selectedType)) {
      setSelectedType('attendance');
    }
  }, [canViewPayroll, selectedType]);

  // Dates
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthStr = useMemo(() => todayStr.slice(0, 7), [todayStr]);

  const [day, setDay] = useState<string>(todayStr);
  const [week, setWeek] = useState<string>(todayStr);
  const [month, setMonth] = useState<string>(currentMonthStr);
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(todayStr);

  const [department, setDepartment] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);
  const [rowSearch, setRowSearch] = useState('');

  // Load employee list for dropdown
  useEffect(() => {
    async function loadEmployees() {
      try {
        const emps = await employeesApi.list();
        setEmployees(emps || []);
      } catch (err) {
        // Non-blocking fallback
      }
    }
    loadEmployees();
  }, []);

  // Filter ONLY active employees for the selection dropdown
  const activeEmployees = useMemo(() => {
    return employees.filter((emp) => emp.status !== 'inactive');
  }, [employees]);

  // Department options derived from active employees list or standard list
  const departments = useMemo(() => {
    const set = new Set<string>();
    activeEmployees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    if (set.size === 0) {
      return [
        'Engineering',
        'Curriculum',
        'Operations',
        'Marketing',
        'Sales',
        'Human Resources',
        'Finance',
      ];
    }
    return Array.from(set).sort();
  }, [activeEmployees]);

  // Compute period label
  const periodLabel = useMemo(() => {
    if (day && (period === 'daily' || period === 'monthly')) {
      try {
        const dObj = new Date(day + 'T00:00:00');
        return dObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      } catch {
        return day;
      }
    }
    if (period === 'weekly') return `Week of ${week}`;
    if (period === 'monthly') {
      try {
        const [y, m] = month.split('-');
        const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
        return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } catch {
        return month;
      }
    }
    if (period === 'range') return `${fromDate} — ${toDate}`;
    return 'Financial year to date';
  }, [period, day, week, month, fromDate, toDate]);

  // Fetch report data
  const loadReport = useCallback(
    async (type: ReportType) => {
      try {
        setLoadingData(true);
        setError(null);

        const filter: ReportFilterDto = {
          type,
          period,
          // The Date field only exists for a single day or a month; sending it
          // with a week or range made the server report just that one day.
          date: (period === 'daily' || period === 'monthly') && day ? day : undefined,
          week: period === 'weekly' ? week : undefined,
          month: period === 'monthly' ? month : undefined,
          from: period === 'range' ? fromDate : undefined,
          to: period === 'range' ? toDate : undefined,
          department: department || undefined,
          employeeId: employeeId || undefined,
        };

        const data = await reportsApi.getReportData(filter);
        setReportResult(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load report data');
        setReportResult(null);
      } finally {
        setLoadingData(false);
      }
    },
    [period, day, week, month, fromDate, toDate, department, employeeId]
  );

  useEffect(() => {
    loadReport(selectedType);
  }, [selectedType, period, day, week, month, fromDate, toDate, department, employeeId, loadReport]);

  const handleDownloadCsv = async () => {
    try {
      setExporting(true);
      const filter: ReportFilterDto = {
        type: selectedType,
        period,
        date: (period === 'daily' || period === 'monthly') && day ? day : undefined,
        week: period === 'weekly' ? week : undefined,
        month: period === 'monthly' ? month : undefined,
        from: period === 'range' ? fromDate : undefined,
        to: period === 'range' ? toDate : undefined,
        department: department || undefined,
        employeeId: employeeId || undefined,
        // Download what is on screen, not what was on screen before typing.
        search: rowSearch.trim() || undefined,
      };
      await reportsApi.downloadCsv(filter);
    } catch (err: any) {
      alert(err.message || 'Failed to download report CSV');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const reportTitle = reportResult?.meta?.reportTitle || 'Report';
  const allRows = reportResult?.rows || [];
  const columns: ReportColumn[] = reportResult?.columns || [];
  const totals = reportResult?.totals;

  /**
   * Filtering happens here rather than on the server: the rows are already
   * loaded, and typing a character should narrow them immediately rather than
   * wait for a round trip.
   *
   * Reports do not agree on what to call the name column — four different keys
   * across the twenty — so match against all of them plus the code, instead of
   * picking one and having search silently do nothing on half the reports.
   */
  const filteredRows = useMemo(() => {
    const q = rowSearch.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter((row) =>
      SEARCHABLE_KEYS.some((key) => String(row[key] ?? '').toLowerCase().includes(q)),
    );
  }, [allRows, rowSearch]);

  const rows = filteredRows;
  const reportNote = REPORT_NOTES[selectedType] || reportResult?.note || '';

  const renderCell = (col: ReportColumn, val: any) => {
    if (val === null || val === undefined || val === '') {
      return <span style={{ color: 'var(--muted2, #9ca3af)' }}>—</span>;
    }
    if (col.isCurrency && typeof val === 'number') {
      return formatInr(val);
    }
    if (col.isNumeric && typeof val === 'number') {
      return val.toLocaleString('en-IN');
    }
    return String(val);
  };

  return (
    <div>
      <div className="crumb">Manager access / Reports centre</div>

      <PageHero
        navKey="reports"
        title="Reports centre"
        eyebrow={`${canViewPayroll ? 20 : 11} REPORTS · DAILY, WEEKLY, MONTHLY OR ANY DATE RANGE`}
      >
        <button
          className="btn primary"
          type="button"
          onClick={handleDownloadCsv}
          disabled={exporting}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: '6px' }}
          >
            <path d="M12 3v12" />
            <path d="M7.5 10.5L12 15l4.5-4.5" />
            <path d="M4 20h16" />
          </svg>
          {exporting ? 'Downloading...' : 'Download CSV'}
        </button>
      </PageHero>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fee2e2',
            color: '#b91c1c',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '13px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => loadReport(selectedType)}
            className="btn sm secondary"
            style={{ fontSize: '11px' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Grid g32: Left card "Build a report" (1fr), Right card table (2fr) */}
      <div className="grid g32">
        {/* Left card */}
        <div className="card">
          <h3>Build a report</h3>
          <div className="fgrid">
            <div className="f">
              <label>Report</label>
              <select
                id="rpType"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as ReportType)}
              >
                <optgroup label="Attendance">
                  <option value="attendance">Attendance — day by day</option>
                  <option value="attsummary">Attendance summary — on time, late, absent</option>
                  <option value="late">Late logins</option>
                  <option value="nologin">No login activity</option>
                  <option value="active">Daily active hours</option>
                </optgroup>
                {canViewPayroll && (
                  <optgroup label="Payroll">
                    <option value="salary">Salary register</option>
                    <option value="pf">Provident fund</option>
                    <option value="pt">Professional tax</option>
                    <option value="tds">TDS — new regime</option>
                    <option value="loan">Loans and advances</option>
                    <option value="net_pay">Net Pay (Bank Disbursement Advice)</option>
                    <option value="income_tax">Income Tax Monthly Statement</option>
                    <option value="loan_details">Loan Details Report</option>
                  </optgroup>
                )}
                <optgroup label="People">
                  <option value="leave">Leave</option>
                  <option value="goals">Goals and progress</option>
                  <option value="basic">Employee basic information</option>
                  <option value="all_employees">All Active Employees</option>
                  <option value="recent_joinees">Recent Joinees</option>
                  <option value="recent_resignees">Recent Resignees</option>
                  {canViewPayroll && <option value="appraisals">Appraisal &amp; Increment Report</option>}
                </optgroup>
              </select>
            </div>

            <div className="f">
              <label>Period</label>
              <select
                id="rpPeriod"
                value={period}
                onChange={(e) =>
                  setPeriod(e.target.value as 'daily' | 'weekly' | 'monthly' | 'range' | 'fytd')
                }
              >
                <option value="daily">A single day</option>
                <option value="weekly">A week</option>
                <option value="monthly">A month</option>
                <option value="range">Custom date range</option>
                <option value="fytd">Financial year to date</option>
              </select>
            </div>

            {/* Date field - present whenever daily or monthly (matching prototype design) */}
            {(period === 'daily' || period === 'monthly') && (
              <div className="f" id="rpDayWrap">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}
                >
                  <label style={{ margin: 0 }}>Date</label>
                  {day && period === 'monthly' && (
                    <button
                      type="button"
                      onClick={() => setDay('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: 'var(--blue, #2563eb)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      Clear (all days)
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  id="rpDay"
                  value={day}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDay(val);
                    if (val) {
                      setMonth(val.slice(0, 7));
                    }
                  }}
                />
              </div>
            )}

            {period === 'weekly' && (
              <div className="f" id="rpWeekWrap">
                <label>Week starting</label>
                <input
                  type="date"
                  id="rpWeek"
                  value={week}
                  onChange={(e) => setWeek(e.target.value)}
                />
                <div className="hint">Runs Monday to Sunday from the date you pick.</div>
              </div>
            )}

            {period === 'monthly' && (
              <div className="f" id="rpMonthWrap">
                <label>Month</label>
                <input
                  type="month"
                  id="rpMonth"
                  value={month}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMonth(val);
                    if (day && !day.startsWith(val)) {
                      setDay(`${val}-01`);
                    }
                  }}
                />
              </div>
            )}

            {period === 'range' && (
              <div className="grid g2" id="rpRangeWrap">
                <div className="f">
                  <label>From</label>
                  <input
                    type="date"
                    id="rpFrom"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="f">
                  <label>To</label>
                  <input
                    type="date"
                    id="rpTo"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="f">
              <label>Department</label>
              <select
                id="rpDept"
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

            <div className="f">
              <label>Employee</label>
              <select
                id="rpEmp"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              >
                <option value="">Everyone in scope</option>
                {activeEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeCode} · {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap', marginTop: '16px' }}>
            <button
              className="btn primary"
              type="button"
              onClick={handleDownloadCsv}
              disabled={exporting}
            >
              {exporting ? 'Downloading...' : 'Download CSV'}
            </button>
            <button className="btn ghost" type="button" onClick={handlePrint}>
              Print
            </button>
          </div>

          {reportNote && (
            <div className="hint" id="rpNote" style={{ marginTop: '14px', lineHeight: '1.4' }}>
              {reportNote}
            </div>
          )}
        </div>

        {/* Right card: Report Table View */}
        <div className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <h3 id="rpTitle">{reportTitle}</h3>
              <div className="hint" id="rpMeta" style={{ margin: '0 0 12px' }}>
                {reportResult?.meta?.periodLabel || periodLabel} ·{' '}
                {reportResult?.meta?.totalRecords ?? activeEmployees.length} employee
                {(reportResult?.meta?.totalRecords ?? activeEmployees.length) === 1 ? '' : 's'} ·{' '}
                {/* Says what is on screen AND what was filtered out, so a short
                    table never looks like a report that returned little. */}
                {rowSearch.trim()
                  ? `${rows.length} of ${allRows.length} rows`
                  : `${rows.length} row${rows.length === 1 ? '' : 's'}`}
              </div>
            </div>

            <div style={{ position: 'relative', flexShrink: 0 }}>
              <input
                type="search"
                value={rowSearch}
                onChange={(e) => setRowSearch(e.target.value)}
                placeholder="Search employee or code"
                aria-label="Filter rows by employee name or code"
                style={{ width: 230, paddingRight: rowSearch ? 26 : undefined }}
              />
              {rowSearch && (
                <button
                  type="button"
                  onClick={() => setRowSearch('')}
                  aria-label="Clear search"
                  title="Clear"
                  style={{
                    position: 'absolute',
                    right: 6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--muted2)',
                    fontSize: 15,
                    lineHeight: 1,
                    cursor: 'pointer',
                    padding: 2,
                  }}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="scroll" style={{ maxHeight: '640px' }}>
            <table>
              <thead id="rpHead">
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} className={col.isNumeric ? 'num-col' : ''}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody id="rpBody">
                {loadingData ? (
                  <tr>
                    <td
                      colSpan={columns.length || 1}
                      style={{ textAlign: 'center', padding: '48px', color: 'var(--muted)' }}
                    >
                      Generating report...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length || 1}>
                      <div className="empty">
                        <b>No rows for this selection</b>
                        Try a wider period, or clear the department and employee filters.
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={idx}>
                      {columns.map((col) => (
                        <td key={col.key} className={col.isNumeric ? 'num-col' : ''}>
                          {renderCell(col, row[col.key])}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
              {totals && Object.keys(totals).length > 0 && rows.length > 0 && (
                <tfoot id="rpFoot">
                  <tr>
                    {columns.map((col, idx) => {
                      const totalVal = totals[col.key];
                      return (
                        <td key={col.key} className={col.isNumeric ? 'num-col' : ''}>
                          {totalVal != null
                            ? col.isCurrency && typeof totalVal === 'number'
                              ? formatInr(totalVal)
                              : typeof totalVal === 'number'
                              ? totalVal.toLocaleString('en-IN')
                              : String(totalVal)
                            : idx === 0
                            ? `Total · ${rows.length} rows`
                            : ''}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
