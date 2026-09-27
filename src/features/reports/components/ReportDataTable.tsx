import React, { useState, useMemo } from 'react';
import type { ReportResult } from '../types/reports.types';
import { formatInr } from '../../../shared/lib/format';

interface Props {
  report: ReportResult;
}

export const ReportDataTable: React.FC<Props> = ({ report }) => {
  const [search, setSearch] = useState('');

  const filteredRows = useMemo(() => {
    if (!search.trim()) return report.rows;
    const q = search.toLowerCase();
    return report.rows.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(q))
    );
  }, [report.rows, search]);

  const renderCell = (colKey: string, val: any, isCurrency?: boolean, isNumeric?: boolean) => {
    if (val === null || val === undefined || val === '') {
      return <span style={{ color: 'var(--muted2, #9ca3af)' }}>—</span>;
    }

    // Special status styling
    if (colKey === 'panStatus') {
      if (val === 'PAN AVAILABLE') {
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#047857',
            }}
          >
            PAN AVAILABLE
          </span>
        );
      }
      return <span style={{ color: 'var(--muted, #6b7280)', fontSize: '11px' }}>NOT AVAILABLE</span>;
    }

    if (colKey === 'status' || colKey === 'employmentStatus') {
      const s = String(val).toLowerCase();
      let bg = '#f3f4f6';
      let color = '#4b5563';
      if (s.includes('active') || s.includes('confirmed')) {
        bg = 'rgba(16, 185, 129, 0.12)';
        color = '#047857';
      } else if (s.includes('probation') || s.includes('notice')) {
        bg = 'rgba(245, 158, 11, 0.12)';
        color = '#b45309';
      } else if (s.includes('closed') || s.includes('exited')) {
        bg = 'rgba(107, 114, 128, 0.12)';
        color = '#4b5563';
      }
      return (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            background: bg,
            color: color,
          }}
        >
          {val}
        </span>
      );
    }

    // Bank Account Number format - ensure monospace and clear display
    if (colKey === 'beneficiaryAccountNo' || colKey === 'account_no') {
      return (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.5px' }}>
          {String(val)}
        </span>
      );
    }

    if (isCurrency && typeof val === 'number') {
      return formatInr(val);
    }

    if (isNumeric && typeof val === 'number') {
      return val.toLocaleString('en-IN');
    }

    return String(val);
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--line2, #e5e7eb)',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}
    >
      {/* Table search bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          borderBottom: '1px solid var(--line, #e5e7eb)',
          background: 'var(--panel, #f9fafb)',
        }}
      >
        <div style={{ fontSize: '12px', color: 'var(--muted, #6b7280)' }}>
          Showing <strong>{filteredRows.length}</strong> of <strong>{report.rows.length}</strong> records
        </div>
        <div style={{ width: '220px' }}>
          <input
            type="text"
            className="input"
            placeholder="Search report rows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '5px 10px', fontSize: '12px' }}
          />
        </div>
      </div>

      {/* Table Data */}
      <div style={{ overflowX: 'auto', maxHeight: '640px' }}>
        <table style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--line2, #e5e7eb)' }}>
              {report.columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: '10px 12px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    color: 'var(--ink, #111827)',
                    textAlign: col.isNumeric ? 'right' : (col.align || 'left'),
                    whiteSpace: 'nowrap',
                    width: col.width,
                    position: 'sticky',
                    top: 0,
                    background: '#f8fafc',
                    zIndex: 2,
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={report.columns.length}
                  style={{
                    textAlign: 'center',
                    padding: '36px',
                    color: 'var(--muted, #6b7280)',
                    fontSize: '13px',
                  }}
                >
                  No records match your filter criteria.
                </td>
              </tr>
            ) : (
              filteredRows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  style={{
                    borderBottom: '1px solid var(--line, #e5e7eb)',
                    background: rIdx % 2 === 1 ? 'rgba(249, 250, 251, 0.6)' : '#ffffff',
                    transition: 'background 0.1s ease',
                  }}
                >
                  {report.columns.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding: '9px 12px',
                        fontSize: '12.5px',
                        color: 'var(--ink, #111827)',
                        textAlign: col.isNumeric ? 'right' : (col.align || 'left'),
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {renderCell(col.key, row[col.key], col.isCurrency, col.isNumeric)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>

          {/* Footer Totals Row */}
          {report.totals && (
            <tfoot>
              <tr
                style={{
                  background: '#f1f5f9',
                  borderTop: '2px solid var(--line2, #cbd5e1)',
                  fontWeight: 700,
                }}
              >
                {report.columns.map((col, cIdx) => {
                  const val = report.totals![col.key];
                  return (
                    <td
                      key={col.key}
                      style={{
                        padding: '10px 12px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        color: 'var(--ink, #111827)',
                        textAlign: col.isNumeric ? 'right' : (col.align || (cIdx === 0 ? 'left' : 'left')),
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {val !== undefined && val !== null
                        ? (col.isCurrency && typeof val === 'number' ? formatInr(val) : String(val))
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
  );
};
