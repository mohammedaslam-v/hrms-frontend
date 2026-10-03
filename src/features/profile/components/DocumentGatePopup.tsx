import type { DocumentOption } from './UploadDocumentModal'

interface DocumentGatePopupProps {
  missingDocs: DocumentOption[]
  totalDocs: number
  onGoToSection: () => void
  onClose?: () => void
  onAdminBypass?: () => void
  isAdmin?: boolean
}

export function DocumentGatePopup({
  missingDocs,
  totalDocs,
  onGoToSection,
  onClose,
  onAdminBypass,
  isAdmin,
}: DocumentGatePopupProps) {
  const uploadedCount = totalDocs - missingDocs.length
  const pct = Math.round((uploadedCount / totalDocs) * 100)

  return (
    <div className="doc-gate-popup" role="alertdialog" aria-labelledby="doc-gate-title">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#fef3c7',
              border: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            ⚠️
          </div>
          <div>
            <h4 id="doc-gate-title" style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>
              Action Required: Upload Required Documents
            </h4>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              To access the HRMS portal, please upload all required documents.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span
            className="tag"
            style={{
              background: missingDocs.length > 0 ? '#fff1f2' : '#ecfdf5',
              color: missingDocs.length > 0 ? '#e11d48' : '#059669',
              borderColor: missingDocs.length > 0 ? '#fecdd3' : '#a7f3d0',
              fontWeight: 700,
              fontSize: 11,
              padding: '3px 8px',
            }}
          >
            {uploadedCount} of {totalDocs} Completed
          </span>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--muted2)',
                fontSize: 18,
                cursor: 'pointer',
                padding: '0 4px',
                lineHeight: 1,
                borderRadius: 4,
              }}
              title="Close popup"
              aria-label="Close alert"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div
          style={{
            height: 6,
            width: '100%',
            background: '#e2e8f0',
            borderRadius: 999,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: 'linear-gradient(90deg, var(--blue, #2563eb) 0%, #3b82f6 100%)',
              transition: 'width 0.4s ease',
              borderRadius: 999,
            }}
          />
        </div>
      </div>

      {/* Missing items list (display only, no upload button) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Missing:</span>
        {missingDocs.map((doc) => (
          <span
            key={doc.key}
            className="chip"
            style={{
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              color: '#be123c',
              fontSize: 11,
              padding: '2px 8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontWeight: 500,
              borderRadius: 6,
            }}
          >
            <span>{doc.icon}</span>
            <span>{doc.label}</span>
          </span>
        ))}
      </div>

      {/* Bottom info & actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 8,
          borderTop: '1px solid var(--line, #f1f5f9)',
          marginTop: 2,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ fontSize: 11, color: 'var(--muted2)' }}>
          Only the <b>Documents/Information</b> section is interactive until completed.
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          {isAdmin && onAdminBypass && (
            <button
              type="button"
              className="btn ghost sm"
              onClick={onAdminBypass}
              style={{ fontSize: 11, color: 'var(--muted)', padding: '3px 8px' }}
              title="Admin Testing Bypass"
            >
              Admin Bypass
            </button>
          )}

          <button
            type="button"
            className="btn primary sm"
            onClick={onGoToSection}
            style={{ fontSize: 11.5, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <span>Go to Documents/Information</span>
            <span>↓</span>
          </button>
        </div>
      </div>
    </div>
  )
}
