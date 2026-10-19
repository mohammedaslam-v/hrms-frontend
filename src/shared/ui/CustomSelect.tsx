import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

export interface CustomSelectOption<T = string | number> {
  value: T
  label: string
  dotColor?: string
  icon?: ReactNode
}

export interface CustomSelectProps<T extends string | number> {
  id?: string
  value: T
  onChange: (value: T) => void
  options: CustomSelectOption<T>[]
  ariaLabel?: string
  variant?: 'default' | 'pill'
  size?: 'sm' | 'md'
  placeholder?: string
  minWidth?: number | string
  align?: 'left' | 'right'
  disabled?: boolean
  style?: CSSProperties
  buttonStyle?: CSSProperties
  menuStyle?: CSSProperties
}

export function CustomSelect<T extends string | number = string>({
  id,
  value,
  onChange,
  options,
  ariaLabel,
  variant = 'default',
  size = 'md',
  placeholder = 'Select...',
  minWidth,
  align = 'left',
  disabled = false,
  style,
  buttonStyle,
  menuStyle,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((o) => o.value === value)
  const displayLabel = selectedOption ? selectedOption.label : placeholder

  // Close on outside click
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

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Scroll selected option into view when opening
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const activeEl = menuRef.current.querySelector<HTMLElement>('[data-selected="true"]')
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [isOpen])

  const isSmall = size === 'sm'
  const isPill = variant === 'pill'

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-block',
        ...style,
      }}
    >
      <button
        type="button"
        id={id}
        aria-label={ariaLabel || displayLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        style={{
          height: isSmall ? 32 : 34,
          padding: isPill ? (isSmall ? '0 12px' : '0 14px') : isSmall ? '0 10px' : '0 12px',
          borderRadius: isPill ? 99 : 8,
          border: isOpen ? '1px solid var(--blue, #2563eb)' : '1px solid var(--line, #e2e8f0)',
          boxShadow: isOpen
            ? '0 0 0 2px rgba(37, 99, 235, 0.15)'
            : '0 1px 2px rgba(0, 0, 0, 0.03)',
          backgroundColor: '#ffffff',
          color: 'var(--ink, #0f172a)',
          fontSize: isSmall ? 13 : 13,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          fontWeight: 500,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          outline: 'none',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
          ...buttonStyle,
        }}
        onMouseEnter={(e) => {
          if (!disabled && !isOpen) {
            e.currentTarget.style.backgroundColor = 'var(--panel, #f8f6f2)'
            e.currentTarget.style.borderColor = 'var(--muted, #cbd5e1)'
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !isOpen) {
            e.currentTarget.style.backgroundColor = '#ffffff'
            e.currentTarget.style.borderColor = 'var(--line, #e2e8f0)'
          }
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
          {selectedOption?.dotColor && (
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: selectedOption.dotColor,
                flexShrink: 0,
              }}
            />
          )}
          {selectedOption?.icon && (
            <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
              {selectedOption.icon}
            </span>
          )}
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayLabel}
          </span>
        </div>

        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.18s ease',
            color: 'var(--muted, #8a8276)',
            flexShrink: 0,
            marginLeft: 2,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          aria-label={ariaLabel || displayLabel}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: align === 'right' ? 'auto' : 0,
            right: align === 'right' ? 0 : 'auto',
            minWidth: minWidth ?? '100%',
            width: 'max-content',
            maxWidth: 280,
            maxHeight: 230,
            overflowY: 'auto',
            backgroundColor: '#ffffff',
            border: '1px solid var(--line, #e2e8f0)',
            borderRadius: 10,
            boxShadow: '0 10px 25px -4px rgba(24, 19, 13, 0.12), 0 4px 10px -2px rgba(24, 19, 13, 0.05)',
            zIndex: 10000,
            padding: 4,
            boxSizing: 'border-box',
            scrollbarWidth: 'thin',
            ...menuStyle,
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <div
                key={String(opt.value)}
                role="option"
                aria-selected={isSelected}
                data-selected={isSelected}
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'var(--blue-soft, #eff6ff)' : 'transparent',
                  color: isSelected ? 'var(--blue, #2563eb)' : 'var(--ink, #0f172a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  userSelect: 'none',
                  transition: 'background-color 0.1s ease, color 0.1s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'var(--panel, #f8f6f2)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  {opt.dotColor && (
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        backgroundColor: opt.dotColor,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  {opt.icon && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                      {opt.icon}
                    </span>
                  )}
                  <span>{opt.label}</span>
                </div>

                {isSelected && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--blue, #2563eb)"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0, marginLeft: 6 }}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
