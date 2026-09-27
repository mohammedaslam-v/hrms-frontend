import React from 'react';
import type { ReportCatalogItem, ReportType } from '../types/reports.types';

interface Props {
  catalog: ReportCatalogItem[];
  selectedType: ReportType;
  onSelect: (type: ReportType) => void;
}

export const ReportsSidebar: React.FC<Props> = ({ catalog, selectedType, onSelect }) => {
  // Group catalog by category
  const categories: Record<string, ReportCatalogItem[]> = {
    'Statutory & Tax': [],
    'Banking & Payroll': [],
    'People & Lifecycle': [],
  };

  catalog.forEach((item) => {
    if (categories[item.category]) {
      categories[item.category].push(item);
    } else {
      categories[item.category] = [item];
    }
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Statutory & Tax':
        return '🏛️';
      case 'Banking & Payroll':
        return '💳';
      case 'People & Lifecycle':
        return '👥';
      default:
        return '📄';
    }
  };

  return (
    <div
      style={{
        width: '280px',
        flexShrink: 0,
        background: '#ffffff',
        border: '1px solid var(--line2, #e5e7eb)',
        borderRadius: '10px',
        padding: '16px 12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          color: 'var(--muted, #6b7280)',
          padding: '0 8px 12px 8px',
          borderBottom: '1px solid var(--line, #e5e7eb)',
          marginBottom: '12px',
        }}
      >
        Available Reports ({catalog.length})
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {Object.entries(categories).map(([category, items]) => {
          if (items.length === 0) return null;
          return (
            <div key={category}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--muted, #6b7280)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{getCategoryIcon(category)}</span>
                <span>{category}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                {items.map((item) => {
                  const isSelected = item.type === selectedType;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => onSelect(item.type)}
                      style={{
                        textAlign: 'left',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: isSelected ? '1px solid var(--blue, #2563eb)' : '1px solid transparent',
                        background: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? 'var(--blue, #2563eb)' : 'var(--ink, #111827)',
                          lineHeight: '1.3',
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: '10.5px',
                          color: isSelected ? 'var(--ink, #111827)' : 'var(--muted, #6b7280)',
                          marginTop: '2px',
                          lineHeight: '1.3',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {item.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
