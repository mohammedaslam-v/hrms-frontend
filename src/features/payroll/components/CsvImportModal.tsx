import React, { useState } from 'react';
import { payrollApi } from '../api/payroll.api';
import type { CsvReconciliationResult } from '../types/payroll.types';

interface CsvImportModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ onSuccess, onClose }) => {
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CsvReconciliationResult | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleReconcile = async () => {
    if (!csvContent.trim()) {
      setError('Please choose a Razorpay CSV file or paste the CSV text.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await payrollApi.importCsvReconciliation(csvContent);
      setResult(res);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to reconcile CSV');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--card, #fff)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          padding: '28px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--line, #e2e8f0)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#f0fdf4',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            📂
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--ink, #0f172a)' }}>
              Reconcile via Razorpay CSV
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted, #64748b)' }}>
              Upload the settlement report downloaded from RazorpayX to update statuses & bank UTRs
            </p>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#b91c1c',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        {result ? (
          <div>
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '20px',
              }}
            >
              <h4 style={{ margin: '0 0 10px 0', color: '#166534', fontSize: '15px', fontWeight: 700 }}>
                ✅ Reconciliation Complete
              </h4>
              <div style={{ fontSize: '13px', color: '#15803d', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Total rows processed: <b>{result.totalRows}</b></div>
                <div>Successfully matched & updated: <b>{result.updatedCount}</b></div>
                {result.notFoundCount > 0 && (
                  <div>Not found in HRMS database: <b>{result.notFoundCount}</b></div>
                )}
                {result.skippedCount > 0 && (
                  <div>Skipped invalid rows: <b>{result.skippedCount}</b></div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#16a34a',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Close & View Updated Register
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div
              style={{
                border: '2px dashed var(--line, #cbd5e1)',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                background: 'var(--bg, #f8fafc)',
                marginBottom: '16px',
                cursor: 'pointer',
              }}
              onClick={() => document.getElementById('razorpayCsvInput')?.click()}
            >
              <input
                id="razorpayCsvInput"
                type="file"
                accept=".csv,text/csv"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink, #0f172a)' }}>
                {fileName ? fileName : 'Click to select Razorpay CSV report'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted, #64748b)', marginTop: '4px' }}>
                Reads payout ID, status, and bank UTR numbers automatically
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--muted, #64748b)', marginBottom: '6px' }}>
                Or paste CSV contents directly:
              </label>
              <textarea
                rows={4}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="payout_id,status,utr..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--line, #cbd5e1)',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--line, #cbd5e1)',
                  background: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: 'var(--ink, #334155)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReconcile}
                disabled={submitting || !csvContent.trim()}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: submitting || !csvContent.trim() ? '#94a3b8' : '#16a34a',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: submitting || !csvContent.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Reconciling...' : 'Import & Update Register'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
