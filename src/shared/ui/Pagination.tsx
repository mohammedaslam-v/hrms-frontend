import { useState } from 'react'

/** Rows per page. One number so every table in the app agrees. */
export const PAGE_SIZE = 25

export interface Page<T> {
  items: T[]
  page: number
  pageCount: number
  total: number
  /** 1-based position of the first and last row on screen. */
  from: number
  to: number
  setPage: (page: number) => void
}

/**
 * Slices a list into pages.
 *
 * The current page is CLAMPED during render rather than corrected by an effect:
 * filter a 450-row list down to three while sitting on page twelve and you would
 * otherwise be shown an empty table with no hint why. Clamping means the page
 * follows the data with no extra render and nothing to keep in sync.
 */
export function usePage<T>(items: T[], pageSize: number = PAGE_SIZE): Page<T> {
  const [requested, setRequested] = useState(1)

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const page = Math.min(Math.max(1, requested), pageCount)
  const start = (page - 1) * pageSize
  const pageItems = items.slice(start, start + pageSize)

  return {
    items: pageItems,
    page,
    pageCount,
    total: items.length,
    from: items.length === 0 ? 0 : start + 1,
    to: start + pageItems.length,
    setPage: setRequested,
  }
}

/**
 * The control under a table.
 *
 * Renders nothing when everything already fits — a pager under six rows is
 * furniture, not navigation.
 */
export function Pagination<T>({ page, unit = 'rows' }: { page: Page<T>; unit?: string }) {
  if (page.pageCount <= 1) return null

  return (
    <div className="pager">
      <span className="hint">
        Showing {page.from}–{page.to} of {page.total} {unit}
      </span>
      <div className="pager-nav">
        <button
          className="btn ghost sm"
          onClick={() => page.setPage(page.page - 1)}
          disabled={page.page === 1}
        >
          ‹ Previous
        </button>
        <span className="hint">
          Page {page.page} of {page.pageCount}
        </span>
        <button
          className="btn ghost sm"
          onClick={() => page.setPage(page.page + 1)}
          disabled={page.page === page.pageCount}
        >
          Next ›
        </button>
      </div>
    </div>
  )
}
