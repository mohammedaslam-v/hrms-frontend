import { request, fetchBlob } from '../../../shared/api/client';
import type {
  ReportCatalogItem,
  ReportFilterDto,
  ReportResult,
} from '../types/reports.types';

export const reportsApi = {
  getCatalog: () => {
    return request<ReportCatalogItem[]>('/reports/catalog');
  },

  getReportData: (filter: ReportFilterDto) => {
    const params = new URLSearchParams();
    params.set('type', filter.type);
    if (filter.period) params.set('period', filter.period);
    if (filter.date) params.set('date', filter.date);
    if (filter.week) params.set('week', filter.week);
    if (filter.month) params.set('month', filter.month);
    if (filter.from) params.set('from', filter.from);
    if (filter.to) params.set('to', filter.to);
    if (filter.state) params.set('state', filter.state);
    if (filter.department && filter.department !== 'ALL') params.set('department', filter.department);
    if (filter.employeeId) params.set('employeeId', String(filter.employeeId));

    return request<ReportResult>(`/reports/data?${params.toString()}`);
  },

  downloadCsv: async (filter: ReportFilterDto) => {
    const params = new URLSearchParams();
    params.set('type', filter.type);
    if (filter.period) params.set('period', filter.period);
    if (filter.date) params.set('date', filter.date);
    if (filter.week) params.set('week', filter.week);
    if (filter.month) params.set('month', filter.month);
    if (filter.from) params.set('from', filter.from);
    if (filter.to) params.set('to', filter.to);
    if (filter.state) params.set('state', filter.state);
    if (filter.department && filter.department !== 'ALL') params.set('department', filter.department);
    if (filter.employeeId) params.set('employeeId', String(filter.employeeId));

    const blob = await fetchBlob(`/reports/export?${params.toString()}`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const stamp =
      filter.from && filter.to
        ? `${filter.from}_to_${filter.to}`
        : filter.month || filter.date || new Date().toISOString().split('T')[0];
    a.download = `bambinos_${filter.type}_${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
