import type { DocumentOption } from './UploadDocumentModal'
import type { RequiredPersonalField } from '../personal-details.required'

interface DocumentGatePopupProps {
  missingDocs: DocumentOption[]
  totalDocs: number
  /** Personal details still blank. Listed beside the documents, not separately:
   *  two competing warnings about the same incomplete profile is one too many. */
  missingPersonal?: RequiredPersonalField[]
  totalPersonal?: number
  onGoToSection: () => void
  onClose?: () => void
  onAdminBypass?: () => void
  isAdmin?: boolean
}

/**
 * The one thing standing between an employee and the portal, so it says what is
 * missing and nothing else.
 *
 * Deliberately quiet: one amber mark, one line of red text per group, no chips,
 * no progress bar, no emoji. An earlier version boxed every item in its own
 * coloured pill, which turned four missing fields into a wall of red badges —
 * loud enough that the actual words stopped registering.
 */
export function DocumentGatePopup({
  missingDocs,
  totalDocs,
  missingPersonal = [],
  totalPersonal = 0,
  onGoToSection,
  onClose,
  onAdminBypass,
  isAdmin,
}: DocumentGatePopupProps) {
  const totalItems = totalDocs + totalPersonal
  const doneCount = totalItems - (missingDocs.length + missingPersonal.length)

  // Where the work is. Documents first when both are outstanding, since that
  // section carries the upload button — and the label has to match, or it sends
  // people to a section where the thing they need is not.
  const docsFirst = missingDocs.length > 0
  const destination = docsFirst ? 'Documents' : 'Personal details'

  return (
    <div className="doc-gate-popup" role="alertdialog" aria-labelledby="doc-gate-title">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span aria-hidden style={{ fontSize: 15, lineHeight: '20px', flexShrink: 0 }}>
          ⚠️
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            id="doc-gate-title"
            style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}
          >
            Complete your profile to continue
          </h4>

          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {missingDocs.length > 0 && (
              <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                <span style={{ color: 'var(--muted)' }}>Documents to upload — </span>
                <span style={{ color: '#be123c', fontWeight: 600 }}>
                  {missingDocs.map((d) => d.label).join(', ')}
                </span>
              </div>
            )}

            {missingPersonal.length > 0 && (
              <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                <span style={{ color: 'var(--muted)' }}>Details to fill in — </span>
                <span style={{ color: '#be123c', fontWeight: 600 }}>
                  {missingPersonal.map((f) => f.label).join(', ')}
                </span>
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              className="btn primary sm"
              onClick={onGoToSection}
              style={{ fontSize: 11.5, padding: '4px 12px' }}
            >
              Go to {destination} ↓
            </button>

            <span style={{ fontSize: 11, color: 'var(--muted2)' }}>
              {doneCount} of {totalItems} complete
            </span>

            {isAdmin && onAdminBypass && (
              <button
                type="button"
                className="btn ghost sm"
                onClick={onAdminBypass}
                style={{ fontSize: 11, color: 'var(--muted2)', padding: '3px 8px' }}
                title="Admin testing bypass"
              >
                Bypass
              </button>
            )}
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--muted2)',
              fontSize: 17,
              cursor: 'pointer',
              padding: '0 2px',
              lineHeight: 1,
              flexShrink: 0,
            }}
            title="Close"
            aria-label="Close alert"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
