import { useEffect, useRef, useState } from 'react'
import type { ManagerOption } from '../types/employee-form.types'

export interface SearchableManagerSelectProps {
  id?: string
  value: string
  onChange: (id: string) => void
  managers: ManagerOption[]
  fallbackName?: string | null
  loading?: boolean
  placeholder?: string
  size?: 'compact' | 'standard'
}

export function SearchableManagerSelect({
  id = 'mgrSelect',
  value,
  onChange,
  managers,
  fallbackName,
  loading = false,
  placeholder = 'None / Self',
  size = 'standard',
}: SearchableManagerSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const isCompact = size === 'compact'

  const selectedManager = managers.find((m) => String(m.id) === value)
  const displayLabel = selectedManager
    ? `${selectedManager.name} (${selectedManager.employeeCode})${
        selectedManager.department ? ` · ${selectedManager.department}` : ''
      }`
    : value
      ? fallbackName || `Manager #${value}`
      : placeholder

  const q = searchTerm.toLowerCase().trim()
  const filteredManagers = managers.filter((m) => {
    if (!q) return true
    const matchName = m.name.toLowerCase().includes(q)
    const matchCode = m.employeeCode.toLowerCase().includes(q)
    const matchDept = m.department?.toLowerCase().includes(q)
    return matchName || matchCode || matchDept
  })

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

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 40)
    } else {
      setSearchTerm('')
    }
  }, [isOpen])

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          height: isCompact ? 34 : 40,
          padding: isCompact ? '5px 10px' : '9px 12px',
          borderRadius: isCompact ? 8 : 11,
          border: isOpen ? '1px solid var(--blue)' : '1px solid var(--line)',
          boxShadow: isOpen
            ? isCompact
              ? '0 0 0 2.5px rgba(37, 99, 235, 0.12)'
              : '0 0 0 3px rgba(37, 99, 235, 0.12)'
            : 'none',
          fontSize: isCompact ? 12.5 : 13,
          fontFamily: "'Inter', sans-serif",
          backgroundColor: '#ffffff',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          textAlign: 'left',
          color: value ? 'var(--ink)' : 'var(--muted2)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginRight: 6,
            fontWeight: value ? 500 : 400,
          }}
        >
          {loading ? 'Loading managers…' : displayLabel}
        </span>
        <span
          style={{
            fontSize: isCompact ? 10 : 11,
            color: 'var(--muted2)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
            flexShrink: 0,
          }}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            border: '1px solid var(--line)',
            borderRadius: isCompact ? 8 : 10,
            boxShadow: '0 10px 25px -4px rgba(24, 19, 13, 0.18)',
            zIndex: 10000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search Header */}
          <div
            style={{
              padding: isCompact ? '6px 8px' : '8px 10px',
              borderBottom: '1px solid var(--line2)',
              backgroundColor: 'var(--panel)',
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 8,
                  fontSize: 11,
                  color: 'var(--muted2)',
                  pointerEvents: 'none',
                }}
              >
                🔍
              </span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by name, BAM code, dept..."
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
                  height: isCompact ? 28 : 32,
                  padding: isCompact ? '4px 8px 4px 26px' : '6px 10px 6px 28px',
                  borderRadius: isCompact ? 6 : 8,
                  border: '1px solid var(--line)',
                  fontSize: isCompact ? 11.5 : 12.5,
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box',
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
                    fontSize: 12,
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

          {/* Manager Options List */}
          <div
            style={{
              maxHeight: isCompact ? 180 : 220,
              overflowY: 'auto',
              padding: '4px 0',
              scrollbarWidth: 'thin',
            }}
          >
            {/* None / Self Option */}
            <div
              onClick={() => {
                onChange('')
                setIsOpen(false)
              }}
              style={{
                padding: isCompact ? '6px 10px' : '8px 12px',
                fontSize: isCompact ? 12 : 13,
                cursor: 'pointer',
                backgroundColor: !value ? 'var(--blue-soft)' : 'transparent',
                color: !value ? 'var(--blue)' : 'var(--ink2)',
                fontWeight: !value ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                if (value) e.currentTarget.style.backgroundColor = 'var(--panel)'
              }}
              onMouseLeave={(e) => {
                if (value) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <span>None / Self (No manager)</span>
              {!value && <span style={{ fontSize: 11, color: 'var(--blue)' }}>✓</span>}
            </div>

            {filteredManagers.map((m) => {
              const isSelected = String(m.id) === value
              return (
                <div
                  key={m.id}
                  onClick={() => {
                    onChange(String(m.id))
                    setIsOpen(false)
                  }}
                  style={{
                    padding: isCompact ? '6px 10px' : '8px 12px',
                    fontSize: isCompact ? 12 : 13,
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--blue-soft)' : 'transparent',
                    color: isSelected ? 'var(--blue)' : 'var(--ink)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 6,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--panel)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: isSelected ? 600 : 500 }}>{m.name}</span>
                    <span style={{ color: 'var(--muted2)', fontSize: 11.5, marginLeft: 5 }}>
                      ({m.employeeCode})
                    </span>
                    {m.department && (
                      <span style={{ color: 'var(--muted)', fontSize: 11, marginLeft: 4 }}>
                        · {m.department}
                      </span>
                    )}
                  </div>
                  {isSelected && <span style={{ fontSize: 11, color: 'var(--blue)' }}>✓</span>}
                </div>
              )
            })}

            {filteredManagers.length === 0 && (
              <div
                style={{
                  padding: '16px 12px',
                  textAlign: 'center',
                  fontSize: 12,
                  color: 'var(--muted)',
                }}
              >
                No managers found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
