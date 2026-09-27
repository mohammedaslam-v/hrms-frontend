import { request } from '../../../shared/api/client';
import type {
  PayrollMonthView,
  PushSalaryResponseDto,
  PushSalaryResultItem,
  CsvReconciliationResult,
} from '../types/payroll.types';

export const payrollApi = {
  getPayrollView: (month?: string) => {
    const params = month ? `?month=${encodeURIComponent(month)}` : '';
    return request<PayrollMonthView>(`/payroll${params}`);
  },

  calculatePayroll: (month?: string) => {
    return request<PayrollMonthView>('/payroll/calculate', {
      method: 'POST',
      body: JSON.stringify({ month }),
    });
  },

  pushSalaryPayouts: (month: string, employeeIds: number[], mode = 'NEFT') => {
    return request<PushSalaryResponseDto>('/payouts/push-salary', {
      method: 'POST',
      body: JSON.stringify({ month, employeeIds, mode }),
    });
  },

  pushSingleSalary: (employeeId: number, month: string, mode = 'NEFT') => {
    return request<PushSalaryResultItem>('/payouts/push-single', {
      method: 'POST',
      body: JSON.stringify({ employeeId, month, mode }),
    });
  },

  pushLoanDisbursement: (loanId: number, mode = 'NEFT') => {
    return request<{
      loanId: number;
      employeeId: number;
      amount: number;
      payoutId: number;
      razorpayPayoutId: string | null;
      status: string;
      utr?: string | null;
    }>('/payouts/push-loan', {
      method: 'POST',
      body: JSON.stringify({ loanId, mode }),
    });
  },

  importCsvReconciliation: (csvContent: string) => {
    return request<CsvReconciliationResult>('/payouts/import-csv', {
      method: 'POST',
      body: JSON.stringify({ csvContent }),
    });
  },

  updateBankDetails: (
    employeeId: number,
    bankName: string,
    accountNo: string,
    ifscCode: string
  ) => {
    return request<{ success: boolean; message: string }>('/payouts/bank-details', {
      method: 'POST',
      body: JSON.stringify({ employeeId, bankName, accountNo, ifscCode }),
    });
  },
};
