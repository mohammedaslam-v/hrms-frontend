export type PayoutStatus =
  | 'queued'
  | 'pending'
  | 'processing'
  | 'processed'
  | 'failed'
  | 'reversed'
  | 'rejected'
  | 'cancelled'
  | 'not_pushed';

export interface PayrollEmployeeItem {
  employeeId: number;
  employeeCode: string;
  fullName: string;
  designation: string;
  department: string;
  employmentType: string;
  workState: string;
  dateOfJoining: string;
  bankName: string | null;
  accountNo: string | null;
  ifscCode: string | null;
  basic: number;
  hra: number;
  special: number;
  gross: number;
  lopDays: number;
  lopAmount: number;
  employeePf: number;
  professionalTax: number;
  tds: number;
  loanEmi: number;
  totalDeductions: number;
  netPay: number;
  employerPf: number;
  payoutId?: number;
  razorpayPayoutId?: string | null;
  payoutStatus: PayoutStatus;
  utr?: string | null;
  failureReason?: string | null;
}

export interface PayrollKpis {
  onPayroll: number;
  grossPayout: number;
  netDisbursement: number;
  disbursedAmount: number;
  pendingDisbursement: number;
  pfRemittance: number;
  tdsDeposit: number;
}

export interface AvailableMonth {
  monthKey: string;
  monthDate: string;
  label: string;
}

export interface PayrollMonthView {
  month: string;
  monthKey: string;
  monthLabel: string;
  lastCalculatedAt: string;
  kpis: PayrollKpis;
  employees: PayrollEmployeeItem[];
  availableMonths: AvailableMonth[];
}

export interface PushSalaryResultItem {
  employeeId: number;
  employeeCode: string;
  fullName: string;
  amount: number;
  payoutId?: number;
  razorpayPayoutId?: string | null;
  status: PayoutStatus;
  error?: string;
}

export interface PushSalaryResponseDto {
  month: string;
  totalRequested: number;
  totalSuccess: number;
  totalFailed: number;
  totalAmount: number;
  items: PushSalaryResultItem[];
}

export interface CsvReconciliationResult {
  totalRows: number;
  updatedCount: number;
  notFoundCount: number;
  skippedCount: number;
  details: {
    payoutId: string;
    oldStatus?: string;
    newStatus: string;
    utr?: string;
    updated: boolean;
  }[];
}
