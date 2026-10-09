import { useEffect, useRef, useState, type CSSProperties } from 'react'

export interface SearchableDropdownOption {
  value: string
  label: string
  subLabel?: string | null
}

export interface SearchableDropdownProps {
  id?: string
  value: string
  onChange: (value: string) => void
  options: SearchableDropdownOption[]
  placeholder?: string
  searchPlaceholder?: string
  style?: CSSProperties
}

export function SearchableDropdown({
  id,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  style,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find((o) => o.value === value)
  const displayLabel = selectedOption ? selectedOption.label : placeholder

  const q = searchTerm.toLowerCase().trim()
  const filteredOptions = options.filter((o) => {
    if (!q) return true
    const matchLabel = o.label.toLowerCase().includes(q)
    const matchSub = (o.subLabel || '').toLowerCase().includes(q)
    return matchLabel || matchSub
  })

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 40)
    } else {
      setSearchTerm('')
    }
  }, [isOpen])

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', minWidth: 0, ...style }}>
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          height: 32,
          padding: '5px 10px',
          borderRadius: 8,
          border: isOpen ? '1px solid var(--blue)' : '1px solid var(--line)',
          boxShadow: isOpen ? '0 0 0 2.5px rgba(37, 99, 235, 0.12)' : 'none',
          fontSize: 12.5,
          fontFamily: "'Inter', sans-serif",
          backgroundColor: '#ffffff',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          textAlign: 'left',
          color: value && value !== 'all' ? 'var(--ink)' : 'var(--ink)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          gap: 6,
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: value && value !== 'all' ? 600 : 400,
            flex: 1,
          }}
        >
          {displayLabel}
        </span>
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
            color: 'var(--muted)',
            flexShrink: 0,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            minWidth: '100%',
            width: 'max-content',
            maxWidth: 'min(380px, 90vw)',
            backgroundColor: '#ffffff',
            border: '1px solid var(--line)',
            borderRadius: 9,
            boxShadow: '0 12px 28px -4px rgba(24, 19, 13, 0.18)',
            zIndex: 10000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search Header */}
          <div
            style={{
              padding: '6px 8px',
              borderBottom: '1px solid var(--line2)',
              backgroundColor: '#faf8f5',
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: 'absolute',
                  left: 8,
                  color: 'var(--muted)',
                  pointerEvents: 'none',
                }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.stopPropagation()
                    setIsOpen(false)
                  }
                }}
                style={{
                  width: '100%',
                  height: 28,
                  padding: '4px 24px 4px 26px',
                  borderRadius: 6,
                  border: '1px solid var(--line)',
                  fontSize: 12,
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box',
                  color: 'var(--ink)',
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: 6,
                    background: 'none',
                    border: 'none',
                    fontSize: 11,
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    padding: 0,
                    lineHeight: 1,
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div
            style={{
              maxHeight: 220,
              overflowY: 'auto',
              padding: '4px 0',
              scrollbarWidth: 'thin',
            }}
          >
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
                No matches found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value
                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value)
                      setIsOpen(false)
                    }}
                    style={{
                      padding: '7px 12px',
                      fontSize: 12.5,
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--blue-soft, #eff6ff)' : 'transparent',
                      color: isSelected ? 'var(--blue, #2563eb)' : 'var(--ink)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      transition: 'background 0.1s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--panel, #f8f6f2)'
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div
                        style={{
                          fontWeight: isSelected ? 600 : 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {opt.label}
                      </div>
                      {opt.subLabel && (
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginTop: 1,
                          }}
                        >
                          {opt.subLabel}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <span style={{ fontSize: 12, color: 'var(--blue, #2563eb)', fontWeight: 700, flexShrink: 0 }}>
                        ✓
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
