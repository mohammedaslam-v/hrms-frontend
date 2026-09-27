import React from 'react';
import type { ReportCatalogItem, ReportFilterDto } from '../types/reports.types';

interface Props {
  selectedCatalogItem?: ReportCatalogItem;
  filter: ReportFilterDto;
  onFilterChange: (newFilter: Partial<ReportFilterDto>) => void;
  onDownloadCsv: () => void;
  onPrint: () => void;
  exporting: boolean;
  departments: string[];
}

export const ReportFilterBar: React.FC<Props> = ({
  selectedCatalogItem,
  filter,
  onFilterChange,
  onDownloadCsv,
  onPrint,
  exporting,
  departments,
}) => {
  const filterType = selectedCatalogItem?.filterType || 'month';

  // Last 12 months for month selector
  const availableMonths = React.useMemo(() => {
    const list: { key: string; label: string }[] = [];
    const date = new Date(2026, 7, 1); // Start from Aug 2026 downwards
    for (let i = 0; i < 12; i++) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
      list.push({ key, label });
    }
    return list;
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 18px',
        background: '#ffffff',
        border: '1px solid var(--line2, #e5e7eb)',
        borderRadius: '10px',
        marginBottom: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
        {/* Month Selector */}
        {(filterType === 'month' || filterType === 'month_state') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted, #6b7280)' }}>Month:</span>
            <select
              className="input"
              value={filter.month || '2026-08'}
              onChange={(e) => onFilterChange({ month: e.target.value })}
              style={{ minWidth: '130px', padding: '6px 10px', fontSize: '13px' }}
            >
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* State Selector for Profession Tax */}
        {filterType === 'month_state' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted, #6b7280)' }}>State:</span>
            <select
              className="input"
              value={filter.state || 'Karnataka'}
              onChange={(e) => onFilterChange({ state: e.target.value })}
              style={{ minWidth: '130px', padding: '6px 10px', fontSize: '13px' }}
            >
              <option value="Karnataka">Karnataka</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Telangana">Telangana</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="West Bengal">West Bengal</option>
            </select>
          </div>
        )}

        {/* Date Range Inputs */}
        {filterType === 'range' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted, #6b7280)' }}>From:</span>
              <input
                type="date"
                className="input"
                value={filter.from || ''}
                onChange={(e) => onFilterChange({ from: e.target.value })}
                style={{ padding: '5px 8px', fontSize: '12.5px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted, #6b7280)' }}>To:</span>
              <input
                type="date"
                className="input"
                value={filter.to || ''}
                onChange={(e) => onFilterChange({ to: e.target.value })}
                style={{ padding: '5px 8px', fontSize: '12.5px' }}
              />
            </div>
          </div>
        )}

        {/* Department Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted, #6b7280)' }}>Dept:</span>
          <select
            className="input"
            value={filter.department || 'ALL'}
            onChange={(e) => onFilterChange({ department: e.target.value })}
            style={{ minWidth: '130px', padding: '6px 10px', fontSize: '13px' }}
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons: Export CSV & Print */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={onPrint}
          className="btn secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
          title="Print or Save as PDF"
        >
          <span>🖨️</span>
          <span>Print</span>
        </button>

        <button
          type="button"
          onClick={onDownloadCsv}
          disabled={exporting}
          className="btn primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12.5px',
            background: 'var(--green, #10b981)',
            borderColor: 'var(--green, #10b981)',
          }}
        >
          <span>{exporting ? '⏳' : '📊'}</span>
          <span>{exporting ? 'Exporting...' : 'Download CSV'}</span>
        </button>
      </div>
    </div>
  );
};
