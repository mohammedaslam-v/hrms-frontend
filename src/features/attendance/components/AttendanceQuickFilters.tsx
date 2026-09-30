export interface QuickFilterOption {
  value: string
  label: string
}

export const ATT_QUICK_FILTERS: QuickFilterOption[] = [
  { value: '', label: 'All' },
  { value: 'On time', label: 'On time' },
  { value: 'Late', label: 'Late' },
  { value: 'Absent', label: 'No login' },
  { value: 'Leave', label: 'On leave' },
  { value: 'Weekly off', label: 'Off / holiday' },
]

export function AttendanceQuickFilters({
  activeFilter,
  counts,
  onSelect,
}: {
  activeFilter: string
  counts: Record<string, number>
  onSelect: (filter: string) => void
}) {
  return (
    <div className="tabs" style={{ marginBottom: 0 }}>
      {ATT_QUICK_FILTERS.map((f) => {
        const count = counts[f.value] ?? 0
        const isActive = activeFilter === f.value
        return (
          <button
            key={f.value}
            type="button"
            className={`tab ${isActive ? 'on' : ''}`}
            onClick={() => onSelect(f.value)}
          >
            {f.label} <span className="n">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
