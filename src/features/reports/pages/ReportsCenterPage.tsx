import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { PageHero } from '../../../shared/ui/PageHero';
import { reportsApi } from '../api/reports.api';
import type {
  ReportCatalogItem,
  ReportFilterDto,
  ReportResult,
  ReportType,
} from '../types/reports.types';
import { ReportsSidebar } from '../components/ReportsSidebar';
import { ReportFilterBar } from '../components/ReportFilterBar';
import { ReportCompanyHeader } from '../components/ReportCompanyHeader';
import { ReportDataTable } from '../components/ReportDataTable';

export const ReportsCenterPage: React.FC = () => {
  const [catalog, setCatalog] = useState<ReportCatalogItem[]>([]);
  const [selectedType, setSelectedType] = useState<ReportType>('income_tax');
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);

  // Filter state
  const [filter, setFilter] = useState<ReportFilterDto>({
    type: 'income_tax',
    month: '2026-08',
    state: 'Karnataka',
    department: 'ALL',
  });

  // Load catalog on mount
  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoadingCatalog(true);
        const data = await reportsApi.getCatalog();
        setCatalog(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load reports catalog');
      } finally {
        setLoadingCatalog(false);
      }
    }
    loadCatalog();
  }, []);

  // Current selected catalog item
  const selectedCatalogItem = useMemo(() => {
    return catalog.find((c) => c.type === selectedType);
  }, [catalog, selectedType]);

  // Load report data
  const loadReport = useCallback(async (currentFilter: ReportFilterDto) => {
    try {
      setLoadingData(true);
      setError(null);
      const data = await reportsApi.getReportData(currentFilter);
      setReportResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load report data');
      setReportResult(null);
    } finally {
      setLoadingData(false);
    }
  }, []);

  // When type or filter parameters change, reload report
  useEffect(() => {
    loadReport({ ...filter, type: selectedType });
  }, [selectedType, filter.month, filter.from, filter.to, filter.state, filter.department, loadReport]);

  const handleSelectType = (type: ReportType) => {
    setSelectedType(type);
    setFilter((prev) => ({
      ...prev,
      type,
    }));
  };

  const handleFilterChange = (newValues: Partial<ReportFilterDto>) => {
    setFilter((prev) => ({
      ...prev,
      ...newValues,
    }));
  };

  const handleDownloadCsv = async () => {
    try {
      setExporting(true);
      await reportsApi.downloadCsv({ ...filter, type: selectedType });
    } catch (err: any) {
      alert(err.message || 'Failed to download report CSV');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Derive department list from current rows if available
  const departments = useMemo(() => {
    return [
      'Engineering',
      'Curriculum',
      'Operations',
      'Marketing',
      'Sales',
      'Human Resources',
      'Finance',
    ];
  }, []);

  return (
    <div>
      <PageHero
        navKey="reports"
        title="Reports Centre"
        eyebrow="Comprehensive statutory filings, corporate bank disbursement advice, workforce lifecycle tracking, and compensation appraisals"
      />

      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fee2e2',
            color: '#b91c1c',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '13px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => loadReport({ ...filter, type: selectedType })}
            className="btn sm secondary"
            style={{ fontSize: '11px' }}
          >
            Retry
          </button>
        </div>
      )}

      {loadingCatalog ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted, #6b7280)' }}>
          Loading reports catalog...
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          {/* Left Sidebar: 9 Reports by category */}
          <ReportsSidebar
            catalog={catalog}
            selectedType={selectedType}
            onSelect={handleSelectType}
          />

          {/* Right Main Panel */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Filter Bar */}
            <ReportFilterBar
              selectedCatalogItem={selectedCatalogItem}
              filter={filter}
              onFilterChange={handleFilterChange}
              onDownloadCsv={handleDownloadCsv}
              onPrint={handlePrint}
              exporting={exporting}
              departments={departments}
            />

            {/* Report Content */}
            {loadingData ? (
              <div
                style={{
                  padding: '60px',
                  background: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid var(--line2, #e5e7eb)',
                  textAlign: 'center',
                  color: 'var(--muted, #6b7280)',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '8px' }}>⚡</div>
                <div>Generating {selectedCatalogItem?.title || 'report'}...</div>
              </div>
            ) : reportResult ? (
              <div>
                {/* Standardized Letterhead Matching Screenshots */}
                <ReportCompanyHeader meta={reportResult.meta} />

                {/* Data Table */}
                <ReportDataTable report={reportResult} />
              </div>
            ) : (
              <div
                style={{
                  padding: '48px',
                  background: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid var(--line2, #e5e7eb)',
                  textAlign: 'center',
                  color: 'var(--muted, #6b7280)',
                }}
              >
                No data available for this report.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
