import React, { useState } from 'react';
import { payrollApi } from '../api/payroll.api';
import type { PayrollEmployeeItem } from '../types/payroll.types';

interface EditBankModalProps {
  employee: PayrollEmployeeItem;
  onSuccess: () => void;
  onClose: () => void;
}

export const EditBankModal: React.FC<EditBankModalProps> = ({
  employee,
  onSuccess,
  onClose,
}) => {
  const [bankName, setBankName] = useState(employee.bankName || '');
  const [accountNo, setAccountNo] = useState(employee.accountNo || '');
  const [ifscCode, setIfscCode] = useState(employee.ifscCode || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !accountNo.trim() || !ifscCode.trim()) {
      setError('Bank name, account number, and IFSC code are all required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await payrollApi.updateBankDetails(
        employee.employeeId,
        bankName,
        accountNo,
        ifscCode
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update bank details');
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
          maxWidth: '480px',
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
              background: '#e0e7ff',
              color: '#4338ca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            🏦
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--ink, #0f172a)' }}>
              Update Bank Details
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted, #64748b)' }}>
              {employee.fullName} ({employee.employeeCode})
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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink, #0f172a)', marginBottom: '6px' }}>
              Bank Name *
            </label>
            <input
              type="text"
              required
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. HDFC Bank, ICICI Bank"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line, #cbd5e1)',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink, #0f172a)', marginBottom: '6px' }}>
              Account Number *
            </label>
            <input
              type="text"
              required
              value={accountNo}
              onChange={(e) => setAccountNo(e.target.value)}
              placeholder="e.g. 5010023456789"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line, #cbd5e1)',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink, #0f172a)', marginBottom: '6px' }}>
              IFSC Code *
            </label>
            <input
              type="text"
              required
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
              placeholder="e.g. HDFC0001234"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line, #cbd5e1)',
                fontSize: '13px',
                boxSizing: 'border-box',
                textTransform: 'uppercase',
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
              type="submit"
              disabled={submitting}
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                border: 'none',
                background: '#4338ca',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Saving...' : 'Save Bank Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
