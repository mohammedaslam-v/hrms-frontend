import { useState } from 'react'
import { policiesApi } from '../policies.api'
import type { CompanyPolicy } from '../policies.types'

interface PolicyDeleteModalProps {
  policy: CompanyPolicy
  onClose: () => void
  onSuccess: () => void
}

export function PolicyDeleteModal({ policy, onClose, onSuccess }: PolicyDeleteModalProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    try {
      setBusy(true)
      setError(null)
      await policiesApi.delete(policy.id)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete policy.')
      setBusy(false)
    }
  }

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
        if (e.target === e.currentTarget && !busy) onClose()
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          width: '100%',
          maxWidth: 460,
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          animation: 'fadeScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{ padding: '24px 24px 16px' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              marginBottom: 14,
            }}
          >
            🗑️
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#1F1D1A' }}>
            Delete Policy?
          </h3>
          <p style={{ margin: 0, fontSize: 13.5, color: '#57534E', lineHeight: 1.5 }}>
            Are you sure you want to delete{' '}
            <strong style={{ color: '#1F1D1A' }}>“{policy.title}”</strong>? This action cannot be
            undone and will remove it from the employee portal.
          </p>

          {error && (
            <div
              style={{
                marginTop: 14,
                padding: '8px 12px',
                borderRadius: 6,
                background: '#FEF2F2',
                color: '#991B1B',
                fontSize: 12.5,
              }}
            >
              ⚠️ {error}
            </div>
          )}
        </div>

        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border, #E4DDD3)',
            background: '#FAF7F2',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--border, #E4DDD3)',
              background: '#FFFFFF',
              color: '#44403C',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={busy}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              background: '#DC2626',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 600,
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? 'Deleting…' : 'Delete Policy'}
          </button>
        </div>
      </div>
    </div>
  )
}
