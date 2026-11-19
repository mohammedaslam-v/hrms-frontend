import { useEffect, useRef, useState, type ReactNode } from 'react'
import './MultiSelectDropdown.css'

/*
 * Two dropdowns that look and open identically, so a filter bar reads as one
 * set: SelectDropdown (pick one) and MultiSelectDropdown (pick several, with
 * search). Built from buttons and divs on purpose — the site's global `label`
 * and `input` styles (uppercase labels, full-width inputs) would otherwise
 * leak into the list.
 */

function useMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', away)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', away)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  return { open, setOpen, ref }
}

function Trigger({
  id,
  open,
  strong,
  onClick,
  children,
}: {
  id?: string
  open: boolean
  strong: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      id={id}
      className={`msd-btn${open ? ' open' : ''}${strong ? ' picked' : ''}`}
      onClick={onClick}
      aria-haspopup="listbox"
      aria-expanded={open}
    >
      <span className="msd-label">{children}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  )
}

const Tick = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" aria-hidden>
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// ── Pick one ────────────────────────────────────────────────────────────────

export interface SelectOption<T extends string> {
  value: T
  label: string
}

export function SelectDropdown<T extends string>({
  id,
  options,
  value,
  onChange,
}: {
  id?: string
  options: SelectOption<T>[]
  value: T
  onChange: (next: T) => void
}) {
  const { open, setOpen, ref } = useMenu()
  const current = options.find((o) => o.value === value)

  return (
    <div className="msd" ref={ref}>
      <Trigger id={id} open={open} strong={false} onClick={() => setOpen((o) => !o)}>
        {current?.label ?? ''}
      </Trigger>
      {open && (
        <div className="msd-menu" role="listbox">
          <div className="msd-list">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={o.value === value}
                className={`msd-opt${o.value === value ? ' on' : ''}`}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
              >
                <span className="msd-name">{o.label}</span>
                {o.value === value && (
                  <span className="msd-check">
                    <Tick />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Pick several ────────────────────────────────────────────────────────────

export interface MultiSelectOption {
  value: number
  label: string
}

/** An empty selection means "all": the button then reads `allLabel`. */
export function MultiSelectDropdown({
  id,
  options,
  selected,
  onChange,
  allLabel = 'Everyone',
  noun = 'selected',
  searchPlaceholder = 'Search…',
}: {
  id?: string
  options: MultiSelectOption[]
  selected: number[]
  onChange: (next: number[]) => void
  allLabel?: string
  /** "3 employees" rather than "3 selected". */
  noun?: string
  searchPlaceholder?: string
}) {
  const { open, setOpen, ref } = useMenu()
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => searchRef.current?.focus(), 40)
    return () => window.clearTimeout(t)
  }, [open])

  const chosen = new Set(selected)
  const q = query.trim().toLowerCase()
  const shown = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options

  const toggle = (value: number) =>
    onChange(chosen.has(value) ? selected.filter((v) => v !== value) : [...selected, value])

  const label =
    selected.length === 0
      ? allLabel
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? `1 ${noun}`)
        : `${selected.length} ${noun}`

  return (
    <div className="msd" ref={ref}>
      <Trigger id={id} open={open} strong={selected.length > 0} onClick={() => setOpen((o) => !o)}>
        {label}
      </Trigger>

      {open && (
        <div className="msd-menu">
          <div className="msd-search-wrap">
            <input
              ref={searchRef}
              className="msd-search"
              type="search"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={searchPlaceholder}
            />
          </div>
          <div className="msd-actions">
            <span>{selected.length ? `${selected.length} selected` : 'Showing everyone'}</span>
            {q && shown.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([...new Set([...selected, ...shown.map((o) => o.value)])])}
              >
                Select {shown.length}
              </button>
            )}
            {selected.length > 0 && (
              <button type="button" onClick={() => onChange([])}>
                Clear
              </button>
            )}
          </div>
          <div className="msd-list" role="listbox" aria-multiselectable="true">
            {shown.length === 0 ? (
              <div className="msd-empty">No one matches.</div>
            ) : (
              shown.map((o) => {
                const on = chosen.has(o.value)
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="option"
                    aria-selected={on}
                    className={`msd-opt${on ? ' on' : ''}`}
                    onClick={() => toggle(o.value)}
                  >
                    <span className={`msd-box${on ? ' on' : ''}`}>{on && <Tick />}</span>
                    <span className="msd-name">{o.label}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
