import type { CompanyPolicy } from '../policies.types'

interface PolicyViewModalProps {
  policy: CompanyPolicy
  onClose: () => void
  onEdit?: (policy: CompanyPolicy) => void
}

const formatDate = (isoString: string): string => {
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return isoString
  }
}

export function PolicyViewModal({ policy, onClose, onEdit }: PolicyViewModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          width: '100%',
          maxWidth: 820,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          animation: 'fadeScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border, #E4DDD3)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            background: '#FAF7F2',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: '#E0E7FF',
                  color: '#3730A3',
                }}
              >
                {policy.category}
              </span>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background:
                    policy.status === 'active'
                      ? '#DCFCE7'
                      : policy.status === 'draft'
                        ? '#FEF3C7'
                        : '#F3F4F6',
                  color:
                    policy.status === 'active'
                      ? '#166534'
                      : policy.status === 'draft'
                        ? '#92400E'
                        : '#374151',
                }}
              >
                {policy.status === 'active'
                  ? 'Active / Published'
                  : policy.status === 'draft'
                    ? 'Draft'
                    : 'Archived'}
              </span>
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--ink, #1F1D1A)',
                lineHeight: 1.3,
              }}
            >
              {policy.title}
            </h2>
            <div style={{ marginTop: 6, fontSize: 12.5, color: '#78716C' }}>
              Last updated on {formatDate(policy.updatedAt)}
              {policy.createdByName ? ` · Managed by ${policy.createdByName}` : ''}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: '#78716C',
              padding: '4px 8px',
              borderRadius: 6,
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div
          style={{
            padding: '28px 32px',
            overflowY: 'auto',
            flex: 1,
            color: 'var(--ink, #1F1D1A)',
            fontSize: 14.5,
            lineHeight: 1.7,
          }}
          className="policy-rendered-content"
          dangerouslySetInnerHTML={{ __html: policy.description }}
        />

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border, #E4DDD3)',
            background: '#FAF7F2',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 12.5, color: '#78716C' }}>
            ID: #{policy.id} · Official Company Policy
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onEdit(policy)
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--border, #E4DDD3)',
                  background: '#FFFFFF',
                  color: 'var(--ink, #1F1D1A)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ✏️ Edit Policy
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--blue, #2563EB)',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
      <style>{`
        .policy-rendered-content h1 {
          font-size: 22px;
          margin-top: 18px;
          margin-bottom: 8px;
          color: #111827;
        }
        .policy-rendered-content h2 {
          font-size: 18px;
          margin-top: 16px;
          margin-bottom: 6px;
          color: #1F2937;
        }
        .policy-rendered-content h3 {
          font-size: 16px;
          margin-top: 14px;
          margin-bottom: 4px;
          color: #374151;
        }
        .policy-rendered-content p {
          margin-top: 0;
          margin-bottom: 12px;
        }
        .policy-rendered-content ul,
        .policy-rendered-content ol {
          margin-top: 4px;
          margin-bottom: 14px;
          padding-left: 24px;
        }
        .policy-rendered-content li {
          margin-bottom: 4px;
        }
        .policy-rendered-content blockquote {
          border-left: 4px solid var(--blue, #2563EB);
          padding-left: 14px;
          margin: 12px 0;
          color: #4B5563;
          background: #F8FAFC;
          padding: 8px 14px;
          border-radius: 0 6px 6px 0;
        }
        .policy-rendered-content pre {
          background: #F3F4F6;
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          font-family: monospace;
          font-size: 13px;
        }
      `}</style>
    </div>
  )
}
