import React from 'react';
import type { ReportMeta } from '../types/reports.types';

interface Props {
  meta: ReportMeta;
}

export const ReportCompanyHeader: React.FC<Props> = ({ meta }) => {
  return (
    <div
      style={{
        padding: '20px 24px',
        background: '#ffffff',
        border: '1px solid var(--line2, #e5e7eb)',
        borderRadius: '10px',
        marginBottom: '16px',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}
    >
      <div
        style={{
          fontSize: '17px',
          fontWeight: 800,
          letterSpacing: '0.5px',
          color: 'var(--ink, #111827)',
          textTransform: 'uppercase',
          marginBottom: '4px',
        }}
      >
        {meta.companyName}
      </div>

      <div
        style={{
          fontSize: '11px',
          color: 'var(--muted, #6b7280)',
          maxWidth: '820px',
          margin: '0 auto 12px auto',
          lineHeight: '1.4',
        }}
      >
        {meta.companyAddress}
      </div>

      <div
        style={{
          display: 'inline-block',
          padding: '4px 16px',
          background: 'var(--panel, #f9fafb)',
          borderRadius: '6px',
          border: '1px solid var(--line, #e5e7eb)',
        }}
      >
        <div
          style={{
            fontSize: '14.5px',
            fontWeight: 700,
            color: 'var(--ink, #111827)',
          }}
        >
          {meta.reportTitle}
        </div>
        {meta.reportSubtitle && (
          <div
            style={{
              fontSize: '11.5px',
              fontWeight: 500,
              color: 'var(--blue, #2563eb)',
              marginTop: '2px',
            }}
          >
            {meta.reportSubtitle}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '12px',
          paddingTop: '10px',
          borderTop: '1px dashed var(--line, #e5e7eb)',
          fontSize: '11px',
          color: 'var(--muted, #6b7280)',
        }}
      >
        <div>
          <span>Total Records: </span>
          <strong style={{ color: 'var(--ink, #111827)' }}>{meta.totalRecords}</strong>
        </div>
        <div>
          <span>Generated At: </span>
          <span>{new Date(meta.generatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
        </div>
      </div>
    </div>
  );
};
