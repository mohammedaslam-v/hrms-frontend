import React, { useEffect, useState, useMemo } from 'react';
import { PageHero } from '../../../shared/ui/PageHero';
import { payrollApi } from '../api/payroll.api';
import type {
  PayrollMonthView,
  PayrollEmployeeItem,
} from '../types/payroll.types';
import { PayrollKpiCards } from '../components/PayrollKpiCards';
import { BulkPushModal } from '../components/BulkPushModal';
import { CsvImportModal } from '../components/CsvImportModal';
import { EditBankModal } from '../components/EditBankModal';
import { formatInr } from '../../../shared/lib/format';
import { useNavigate } from 'react-router-dom';

export const PayrollRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewData, setViewData] = useState<PayrollMonthView | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Checkbox selections for bulk payout
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modals
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [editingBankEmployee, setEditingBankEmployee] = useState<PayrollEmployeeItem | null>(null);

  const loadData = React.useCallback(async (monthKey?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await payrollApi.getPayrollView(monthKey);
      setViewData(data);
      if (!selectedMonth) {
        setSelectedMonth(data.monthKey);
      }
      setSelectedIds([]);
    } catch (err: any) {
      setError(err.message || 'Failed to load payroll register');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  const handleRefreshCalculate = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const data = await payrollApi.calculatePayroll(selectedMonth);
      setViewData(data);
      setSelectedIds([]);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh payroll calculation');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(selectedMonth || undefined);
  }, [selectedMonth, loadData]);

  // Unique departments for filter
  const departments = useMemo(() => {
    if (!viewData?.employees) return [];
    return Array.from(new Set(viewData.employees.map((e) => e.department).filter(Boolean)));
  }, [viewData]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    if (!viewData?.employees) return [];
    return viewData.employees.filter((emp) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        emp.fullName.toLowerCase().includes(q) ||
        emp.employeeCode.toLowerCase().includes(q) ||
        emp.designation.toLowerCase().includes(q);

      const matchesDept = deptFilter === 'ALL' || emp.department === deptFilter;

      let matchesStatus = true;
      if (statusFilter === 'PROCESSED') matchesStatus = emp.payoutStatus === 'processed';
      else if (statusFilter === 'PROCESSING') matchesStatus = emp.payoutStatus === 'processing' || emp.payoutStatus === 'queued' || emp.payoutStatus === 'pending';
      else if (statusFilter === 'FAILED') matchesStatus = emp.payoutStatus === 'failed' || emp.payoutStatus === 'reversed' || emp.payoutStatus === 'rejected';
      else if (statusFilter === 'NOT_PUSHED') matchesStatus = emp.payoutStatus === 'not_pushed';

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [viewData, searchQuery, deptFilter, statusFilter]);

  // Eligible employees for bulk selection (those not yet processed)
  const selectableEmployees = useMemo(() => {
    return filteredEmployees.filter((e) => e.payoutStatus !== 'processed' && e.netPay > 0);
  }, [filteredEmployees]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(selectableEmployees.map((emp) => emp.employeeId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedEmployeeItems = useMemo(() => {
    if (!viewData?.employees) return [];
    return viewData.employees.filter((e) => selectedIds.includes(e.employeeId));
  }, [viewData, selectedIds]);

  const handlePushBulk = async (mode: 'NEFT' | 'IMPS') => {
    if (!viewData) return;
    await payrollApi.pushSalaryPayouts(viewData.month, selectedIds, mode);
    await loadData(viewData.monthKey);
  };

  const handlePushSingle = async (employeeId: number) => {
    if (!viewData) return;
    try {
      await payrollApi.pushSingleSalary(employeeId, viewData.month);
      await loadData(viewData.monthKey);
    } catch (err: any) {
      alert(`Error pushing payout: ${err.message}`);
    }
  };

  // CSV export helper
  const exportCsv = (type: 'salary' | 'pf' | 'pt' | 'tds') => {
    if (!viewData?.employees) return;
    let headers: string[] = [];
    let rows: string[][] = [];

    if (type === 'salary') {
      headers = ['Employee Code', 'Name', 'Department', 'Designation', 'Bank Name', 'Account No', 'IFSC', 'Gross Pay', 'Net Pay', 'Status', 'UTR'];
      rows = viewData.employees.map((e) => [
        e.employeeCode,
        e.fullName,
        e.department,
        e.designation,
        e.bankName || '—',
        e.accountNo || '—',
        e.ifscCode || '—',
        String(e.gross),
        String(e.netPay),
        e.payoutStatus,
        e.utr || '—',
      ]);
    } else if (type === 'pf') {
      headers = ['Employee Code', 'Name', 'Basic Pay', 'Employee PF (12%)', 'Employer PF (12%)', 'Total PF'];
      rows = viewData.employees.map((e) => [
        e.employeeCode,
        e.fullName,
        String(e.basic),
        String(e.employeePf),
        String(e.employerPf),
        String(e.employeePf + e.employerPf),
      ]);
    } else if (type === 'pt') {
      headers = ['Employee Code', 'Name', 'Work State', 'Gross Pay', 'Professional Tax (PT)'];
      rows = viewData.employees.map((e) => [
        e.employeeCode,
        e.fullName,
        e.workState,
        String(e.gross),
        String(e.professionalTax),
      ]);
    } else if (type === 'tds') {
      headers = ['Employee Code', 'Name', 'Gross Pay', 'Monthly TDS'];
      rows = viewData.employees.map((e) => [
        e.employeeCode,
        e.fullName,
        String(e.gross),
        String(e.tds),
      ]);
    }

    const csvStr = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${type}_register_${viewData.monthKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string, utr?: string | null, reason?: string | null) => {
    switch (status) {
      case 'processed':
        return (
          <div>
            <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '6px', background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 700 }}>
              ✓ Processed
            </span>
            {utr && (
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#166534', marginTop: '3px' }}>
                UTR: {utr}
              </div>
            )}
          </div>
        );
      case 'processing':
      case 'queued':
      case 'pending':
        return (
          <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '6px', background: '#fef3c7', color: '#b45309', fontSize: '11px', fontWeight: 700 }}>
            ⏳ Processing
          </span>
        );
      case 'failed':
      case 'reversed':
      case 'rejected':
        return (
          <div>
            <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '6px', background: '#fee2e2', color: '#b91c1c', fontSize: '11px', fontWeight: 700 }}>
              ✕ {status === 'reversed' ? 'Reversed' : 'Failed'}
            </span>
            {reason && (
              <div style={{ fontSize: '10.5px', color: '#991b1b', marginTop: '2px', maxWidth: '140px', wordBreak: 'break-word' }}>
                {reason}
              </div>
            )}
          </div>
        );
      default:
        return (
          <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#64748b', fontSize: '11px', fontWeight: 600 }}>
            Not Pushed
          </span>
        );
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '60px' }}>
      <PageHero
        navKey="payroll"
        title="Payroll Register"
        eyebrow="Monthly salary computation, statutory remittances, and RazorpayX bank disbursement"
      />

      {error && (
        <div
          style={{
            padding: '14px 18px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            color: '#b91c1c',
            fontSize: '14px',
            marginBottom: '20px',
          }}
        >
          {error}
        </div>
      )}

      {/* Top Controls Header */}
      <div
        style={{
          background: 'var(--card, #fff)',
          border: '1px solid var(--line, #e2e8f0)',
          borderRadius: '14px',
          padding: '18px 24px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted, #64748b)', marginBottom: '4px' }}>
              Payroll Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line, #cbd5e1)',
                background: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--ink, #0f172a)',
                cursor: 'pointer',
              }}
            >
              {viewData?.availableMonths.map((m) => (
                <option key={m.monthKey} value={m.monthKey}>
                  {m.label} ({m.monthKey})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={handleRefreshCalculate}
              disabled={refreshing}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #0284c7',
                background: '#f0f9ff',
                color: '#0284c7',
                fontSize: '13px',
                fontWeight: 700,
                cursor: refreshing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {refreshing ? 'Calculating...' : '⚡ Refresh / Calculate'}
            </button>
          </div>

          {viewData?.lastCalculatedAt && (
            <div style={{ fontSize: '11.5px', color: 'var(--muted, #64748b)', paddingTop: '20px' }}>
              Calculated: {new Date(viewData.lastCalculatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>

        {/* Action Buttons Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            disabled={selectedIds.length === 0}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              background: selectedIds.length > 0 ? '#0284c7' : '#cbd5e1',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: selectedIds.length > 0 ? '0 2px 4px rgba(2, 132, 199, 0.25)' : 'none',
            }}
          >
            ⚡ Push Selected to Razorpay ({selectedIds.length})
          </button>

          <button
            type="button"
            onClick={() => setShowCsvModal(true)}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              border: '1px solid #16a34a',
              background: '#f0fdf4',
              color: '#166534',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📂 Import Razorpay CSV
          </button>

          {/* Export Dropdown / Buttons */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => exportCsv('salary')}
              title="Download Salary Register CSV"
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid var(--line, #cbd5e1)',
                background: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📥 Salary
            </button>
            <button
              type="button"
              onClick={() => exportCsv('pf')}
              title="Download PF Remittance CSV"
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid var(--line, #cbd5e1)',
                background: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📥 PF
            </button>
            <button
              type="button"
              onClick={() => exportCsv('pt')}
              title="Download PT Remittance CSV"
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid var(--line, #cbd5e1)',
                background: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📥 PT
            </button>
            <button
              type="button"
              onClick={() => exportCsv('tds')}
              title="Download TDS Statement CSV"
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid var(--line, #cbd5e1)',
                background: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📥 TDS
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {viewData?.kpis && <PayrollKpiCards kpis={viewData.kpis} />}

      {/* Filter Bar */}
      <div
        style={{
          background: 'var(--card, #fff)',
          border: '1px solid var(--line, #e2e8f0)',
          borderRadius: '12px 12px 0 0',
          padding: '14px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          borderBottom: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="Search by name, employee code (BAM-...), title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--line, #cbd5e1)',
              fontSize: '13px',
              width: '100%',
              maxWidth: '360px',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: '6px',
                border: '1px solid var(--line, #cbd5e1)',
                fontSize: '12.5px',
                color: 'var(--ink, #0f172a)',
              }}
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: '6px',
                border: '1px solid var(--line, #cbd5e1)',
                fontSize: '12.5px',
                color: 'var(--ink, #0f172a)',
              }}
            >
              <option value="ALL">All Razorpay Statuses</option>
              <option value="NOT_PUSHED">Not Pushed</option>
              <option value="PROCESSING">Processing / Queued</option>
              <option value="PROCESSED">Processed (Paid)</option>
              <option value="FAILED">Failed / Reversed</option>
            </select>
          </div>

          <div style={{ fontSize: '13px', color: 'var(--muted, #64748b)' }}>
            Showing <b>{filteredEmployees.length}</b> of {viewData?.employees.length || 0}
          </div>
        </div>
      </div>

      {/* Main Payroll Table */}
      <div
        style={{
          background: 'var(--card, #fff)',
          border: '1px solid var(--line, #e2e8f0)',
          borderRadius: '0 0 12px 12px',
          overflowX: 'auto',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--line, #e2e8f0)', color: 'var(--muted, #64748b)' }}>
              <th style={{ padding: '12px 16px', width: '40px' }}>
                <input
                  type="checkbox"
                  checked={
                    selectableEmployees.length > 0 &&
                    selectableEmployees.every((e) => selectedIds.includes(e.employeeId))
                  }
                  onChange={handleSelectAll}
                  disabled={selectableEmployees.length === 0}
                />
              </th>
              <th style={{ padding: '12px 16px', fontWeight: 700 }}>Employee</th>
              <th style={{ padding: '12px 16px', fontWeight: 700 }}>Bank Details</th>
              <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Gross Pay</th>
              <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Deductions</th>
              <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Net Take-Home</th>
              <th style={{ padding: '12px 16px', fontWeight: 700 }}>Razorpay Status</th>
              <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--muted, #64748b)' }}>
                  Calculating and loading monthly payroll register...
                </td>
              </tr>
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--muted, #64748b)' }}>
                  No employees found matching the filters for this month.
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => {
                const isSelected = selectedIds.includes(emp.employeeId);
                const hasBankDetails = Boolean(emp.accountNo && emp.ifscCode);

                return (
                  <tr
                    key={emp.employeeId}
                    style={{
                      borderBottom: '1px solid var(--line, #f1f5f9)',
                      background: isSelected ? '#f0f9ff' : 'transparent',
                    }}
                  >
                    {/* Checkbox */}
                    <td style={{ padding: '14px 16px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(emp.employeeId)}
                        disabled={emp.payoutStatus === 'processed' || emp.netPay <= 0}
                      />
                    </td>

                    {/* Employee Profile */}
                    <td style={{ padding: '14px 16px' }}>
                      <div
                        onClick={() => navigate(`/pay/${emp.employeeId}`)}
                        style={{ fontWeight: 700, color: 'var(--ink, #0f172a)', cursor: 'pointer' }}
                      >
                        {emp.fullName}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--muted, #64748b)' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0284c7' }}>
                          {emp.employeeCode}
                        </span>{' '}
                        · {emp.designation} · {emp.department}
                      </div>
                    </td>

                    {/* Bank Details */}
                    <td style={{ padding: '14px 16px' }}>
                      {hasBankDetails ? (
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--ink, #0f172a)' }}>
                            {emp.bankName || 'Bank'} ·{' '}
                            <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                              •••• {emp.accountNo ? emp.accountNo.slice(-4) : ''}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--muted, #64748b)', fontFamily: 'monospace' }}>
                            IFSC: {emp.ifscCode}
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingBankEmployee(emp)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px dashed #f59e0b',
                            background: '#fffbeb',
                            color: '#b45309',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          ⚠️ Add Bank Details
                        </button>
                      )}
                    </td>

                    {/* Gross */}
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600 }}>
                      {formatInr(emp.gross)}
                      <div style={{ fontSize: '11px', color: 'var(--muted, #64748b)', fontWeight: 400 }}>
                        Basic: {formatInr(emp.basic)}
                      </div>
                    </td>

                    {/* Deductions */}
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#b91c1c' }}>
                      −{formatInr(emp.totalDeductions)}
                      <div style={{ fontSize: '11px', color: 'var(--muted, #64748b)', fontWeight: 400 }}>
                        PF: {formatInr(emp.employeePf)} · TDS: {formatInr(emp.tds)}
                        {emp.loanEmi > 0 && ` · EMI: ${formatInr(emp.loanEmi)}`}
                      </div>
                    </td>

                    {/* Net Pay */}
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#0284c7' }}>
                        {formatInr(emp.netPay)}
                      </div>
                    </td>

                    {/* Razorpay Status */}
                    <td style={{ padding: '14px 16px' }}>
                      {getStatusBadge(emp.payoutStatus, emp.utr, emp.failureReason)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', alignItems: 'center' }}>
                        {emp.payoutStatus === 'not_pushed' && (
                          <button
                            type="button"
                            onClick={() => handlePushSingle(emp.employeeId)}
                            disabled={!hasBankDetails || emp.netPay <= 0}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: 'none',
                              background: hasBankDetails && emp.netPay > 0 ? '#0284c7' : '#cbd5e1',
                              color: '#fff',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: hasBankDetails && emp.netPay > 0 ? 'pointer' : 'not-allowed',
                            }}
                          >
                            Pay
                          </button>
                        )}

                        {(emp.payoutStatus === 'failed' || emp.payoutStatus === 'reversed') && (
                          <button
                            type="button"
                            onClick={() => handlePushSingle(emp.employeeId)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: 'none',
                              background: '#b91c1c',
                              color: '#fff',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Retry
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setEditingBankEmployee(emp)}
                          title="Edit Bank Details"
                          style={{
                            padding: '5px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--line, #cbd5e1)',
                            background: '#fff',
                            color: 'var(--ink, #334155)',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          🏦
                        </button>

                        <button
                          type="button"
                          onClick={() => navigate(`/pay/${emp.employeeId}?month=${viewData?.monthKey}`)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--line, #cbd5e1)',
                            background: '#fff',
                            color: 'var(--ink, #334155)',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Slip
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showBulkModal && viewData && (
        <BulkPushModal
          monthLabel={viewData.monthLabel}
          selectedEmployees={selectedEmployeeItems}
          onConfirm={handlePushBulk}
          onClose={() => setShowBulkModal(false)}
        />
      )}

      {showCsvModal && (
        <CsvImportModal
          onSuccess={() => {
            if (viewData?.monthKey) loadData(viewData.monthKey);
          }}
          onClose={() => setShowCsvModal(false)}
        />
      )}

      {editingBankEmployee && (
        <EditBankModal
          employee={editingBankEmployee}
          onSuccess={() => {
            if (viewData?.monthKey) loadData(viewData.monthKey);
          }}
          onClose={() => setEditingBankEmployee(null)}
        />
      )}
    </div>
  );
};
