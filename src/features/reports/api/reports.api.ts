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
    if (filter.month) params.set('month', filter.month);
    if (filter.from) params.set('from', filter.from);
    if (filter.to) params.set('to', filter.to);
    if (filter.state) params.set('state', filter.state);
    if (filter.department && filter.department !== 'ALL') params.set('department', filter.department);

    return request<ReportResult>(`/reports/data?${params.toString()}`);
  },

  downloadCsv: async (filter: ReportFilterDto) => {
    const params = new URLSearchParams();
    params.set('type', filter.type);
    if (filter.month) params.set('month', filter.month);
    if (filter.from) params.set('from', filter.from);
    if (filter.to) params.set('to', filter.to);
    if (filter.state) params.set('state', filter.state);
    if (filter.department && filter.department !== 'ALL') params.set('department', filter.department);

    const blob = await fetchBlob(`/reports/export?${params.toString()}`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filter.type}_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
