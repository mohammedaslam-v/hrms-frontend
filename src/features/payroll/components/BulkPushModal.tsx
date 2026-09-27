import React, { useState } from 'react';
import type { PayrollEmployeeItem } from '../types/payroll.types';
import { formatInr } from '../../../shared/lib/format';

interface BulkPushModalProps {
  monthLabel: string;
  selectedEmployees: PayrollEmployeeItem[];
  onConfirm: (mode: 'NEFT' | 'IMPS') => Promise<void>;
  onClose: () => void;
}

export const BulkPushModal: React.FC<BulkPushModalProps> = ({
  monthLabel,
  selectedEmployees,
  onConfirm,
  onClose,
}) => {
  const [mode, setMode] = useState<'NEFT' | 'IMPS'>('NEFT');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAmount = selectedEmployees.reduce((sum, e) => sum + (e.netPay || 0), 0);
  const missingBankCount = selectedEmployees.filter(
    (e) => !e.accountNo || !e.ifscCode
  ).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (missingBankCount > 0) {
      setError(
        `Cannot push: ${missingBankCount} employee(s) have missing bank account or IFSC details.`
      );
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onConfirm(mode);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit batch payout');
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
          maxWidth: '520px',
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
              background: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            ⚡
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--ink, #0f172a)' }}>
              Push Salaries to Razorpay
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted, #64748b)' }}>
              Payroll for {monthLabel}
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

        <div
          style={{
            background: 'var(--bg, #f8fafc)',
            border: '1px solid var(--line, #e2e8f0)',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
            <span style={{ color: 'var(--muted, #64748b)' }}>Selected Employees:</span>
            <span style={{ fontWeight: 700, color: 'var(--ink, #0f172a)' }}>{selectedEmployees.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
            <span style={{ color: 'var(--muted, #64748b)' }}>Total Net Disbursement:</span>
            <span style={{ fontWeight: 800, color: '#0284c7', fontSize: '16px' }}>
              {formatInr(totalAmount)}
            </span>
          </div>
          {missingBankCount > 0 && (
            <div style={{ marginTop: '10px', padding: '8px 10px', background: '#fffbeb', borderRadius: '6px', color: '#b45309', fontSize: '12px' }}>
              ⚠️ {missingBankCount} employee(s) have incomplete bank details and must be updated first.
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink, #0f172a)', marginBottom: '8px' }}>
              Transfer Mode
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: mode === 'NEFT' ? '2px solid #0284c7' : '1px solid var(--line, #cbd5e1)',
                  background: mode === 'NEFT' ? '#f0f9ff' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <input
                  type="radio"
                  name="payoutMode"
                  value="NEFT"
                  checked={mode === 'NEFT'}
                  onChange={() => setMode('NEFT')}
                />
                <div>
                  <div>NEFT</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted, #64748b)', fontWeight: 400 }}>Standard batch payout</div>
                </div>
              </label>

              <label
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: mode === 'IMPS' ? '2px solid #0284c7' : '1px solid var(--line, #cbd5e1)',
                  background: mode === 'IMPS' ? '#f0f9ff' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <input
                  type="radio"
                  name="payoutMode"
                  value="IMPS"
                  checked={mode === 'IMPS'}
                  onChange={() => setMode('IMPS')}
                />
                <div>
                  <div>IMPS</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted, #64748b)', fontWeight: 400 }}>Instant 24x7 transfer</div>
                </div>
              </label>
            </div>
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
              type="submit"
              disabled={submitting || missingBankCount > 0}
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                border: 'none',
                background: submitting || missingBankCount > 0 ? '#94a3b8' : '#0284c7',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: submitting || missingBankCount > 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {submitting ? 'Submitting to Razorpay...' : `Push ${selectedEmployees.length} Payments`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
