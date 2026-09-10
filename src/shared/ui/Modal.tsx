import { useEffect, type FormEvent, type ReactNode } from 'react'

/**
 * The dialog shell every write in the portal happens inside: a dimmed backdrop,
 * a titled box, a place for an error, and a footer whose Cancel button is always
 * the same button.
 *
 * Only the body and the confirming button differ between one dialog and the next,
 * so only those are props. The three that existed before this had drifted — same
 * markup typed out three times, with the Escape handler subtly different in each.
 */
export function Modal({
  title,
  onClose,
  onSubmit,
  confirm,
  error,
  busy = false,
  maxWidth,
  children,
}: {
  title: ReactNode
  onClose: () => void
  onSubmit: (event: FormEvent) => void
  /** The action button. Cancel is supplied here; only the affirmative differs. */
  confirm: ReactNode
  error?: string | null
  /** While a submit is in flight, Escape stops closing the dialog under it. */
  busy?: boolean
  maxWidth?: number
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, busy])

  return (
    <div className="modal on" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="box" onSubmit={onSubmit} style={maxWidth ? { maxWidth } : undefined}>
        <div className="mh">
          <h3>{title}</h3>
          <button className="x" type="button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {error && (
          <div className="notice bad" style={{ marginBottom: 14 }} role="alert">
            {error}
          </div>
        )}

        {children}

        <div className="mfoot">
          <button className="btn ghost" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          {confirm}
        </div>
      </form>
    </div>
  )
}
