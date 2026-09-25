import React from 'react';
import type { PayrollKpis } from '../types/payroll.types';
import { formatInr } from '../../../shared/lib/format';

interface PayrollKpiCardsProps {
  kpis: PayrollKpis;
}

export const PayrollKpiCards: React.FC<PayrollKpiCardsProps> = ({ kpis }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
      {/* 1. On Payroll */}
      <div style={{
        background: 'var(--card, #fff)',
        border: '1px solid var(--line, #e2e8f0)',
        borderRadius: '12px',
        padding: '16px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted, #64748b)', marginBottom: '6px' }}>
          On This Payroll
        </div>
        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--ink, #0f172a)' }}>
          {kpis.onPayroll} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--muted, #64748b)' }}>employees</span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--muted, #64748b)', marginTop: '4px' }}>
          Active this month
        </div>
      </div>

      {/* 2. Gross Payout */}
      <div style={{
        background: 'var(--card, #fff)',
        border: '1px solid var(--line, #e2e8f0)',
        borderRadius: '12px',
        padding: '16px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted, #64748b)', marginBottom: '6px' }}>
          Gross Payout
        </div>
        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--ink, #0f172a)' }}>
          {formatInr(kpis.grossPayout)}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--muted, #64748b)', marginTop: '4px' }}>
          Total company earnings
        </div>
      </div>

      {/* 3. Net Disbursement */}
      <div style={{
        background: 'var(--card, #fff)',
        border: '1px solid var(--line, #e2e8f0)',
        borderRadius: '12px',
        padding: '16px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted, #64748b)', marginBottom: '6px' }}>
          Net Disbursement
        </div>
        <div style={{ fontSize: '24px', fontWeight: 800, color: '#0284c7' }}>
          {formatInr(kpis.netDisbursement)}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--muted, #64748b)', marginTop: '4px' }}>
          Bank transfer requirement
        </div>
      </div>

      {/* 4. Disbursed via Razorpay */}
      <div style={{
        background: 'var(--card, #fff)',
        border: '1px solid #bbf7d0',
        borderRadius: '12px',
        padding: '16px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#15803d', marginBottom: '6px' }}>
          Disbursed (Settled)
        </div>
        <div style={{ fontSize: '24px', fontWeight: 800, color: '#16a34a' }}>
          {formatInr(kpis.disbursedAmount)}
        </div>
        <div style={{ fontSize: '12px', color: '#15803d', marginTop: '4px' }}>
          Confirmed in bank accounts
        </div>
      </div>

      {/* 5. Pending Disbursement */}
      <div style={{
        background: 'var(--card, #fff)',
        border: '1px solid #fed7aa',
        borderRadius: '12px',
        padding: '16px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c2410c', marginBottom: '6px' }}>
          Pending Disbursement
        </div>
        <div style={{ fontSize: '24px', fontWeight: 800, color: '#ea580c' }}>
          {formatInr(kpis.pendingDisbursement)}
        </div>
        <div style={{ fontSize: '12px', color: '#c2410c', marginTop: '4px' }}>
          Remaining to push
        </div>
      </div>
    </div>
  );
};
