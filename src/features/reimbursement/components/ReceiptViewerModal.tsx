import { useEffect, useState } from 'react'
import { reimbursementApi } from '../reimbursement.api'

interface ReceiptViewerModalProps {
  claimId: number
  claimRef: string
  claimTitle: string
  filename: string | null
  onClose: () => void
}

export function ReceiptViewerModal({
  claimId,
  claimRef,
  claimTitle,
  filename,
  onClose,
}: ReceiptViewerModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let createdUrl: string | null = null
    setLoading(true)
    setError(null)

    reimbursementApi
      .getReceiptBlob(claimId)
      .then((blob) => {
        if (!active) return
        setMimeType((blob.type || '').toLowerCase())
        createdUrl = URL.createObjectURL(blob)
        setBlobUrl(createdUrl)
        setLoading(false)
      })
      .catch((err) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Could not load receipt.')
        setLoading(false)
      })

    return () => {
      active = false
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl)
      }
    }
  }, [claimId])

  const isPdf = mimeType.includes('pdf') || (filename?.toLowerCase().endsWith('.pdf') ?? false)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 780,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--panel)',
          borderRadius: 12,
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--line2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🧾</span>
              <b style={{ fontSize: 16, color: 'var(--ink)' }}>{claimTitle}</b>
              <span className="tag" style={{ fontSize: 11 }}>
                {claimRef}
              </span>
            </div>
            {filename && (
              <small style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2, display: 'block' }}>
                {filename}
              </small>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {blobUrl && (
              <a
                href={blobUrl}
                download={filename || `receipt_${claimRef}.pdf`}
                className="btn ghost sm"
                style={{ textDecoration: 'none' }}
              >
                Download
              </a>
            )}
            <button
              type="button"
              className="btn ghost sm"
              onClick={onClose}
              style={{ minWidth: 32, padding: '4px 8px' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 360,
            background: 'var(--bg, #f8fafc)',
          }}
        >
          {loading && (
            <div style={{ color: 'var(--muted)', textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
              Loading receipt file…
            </div>
          )}

          {error && (
            <div style={{ color: 'var(--red, #ef4444)', textAlign: 'center', maxWidth: 400 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
              <b>Unable to display receipt</b>
              <p style={{ fontSize: 13, marginTop: 4 }}>{error}</p>
            </div>
          )}

          {!loading && !error && blobUrl && (
            isPdf ? (
              <iframe
                src={blobUrl}
                title="Receipt PDF Preview"
                style={{
                  width: '100%',
                  height: 520,
                  border: 'none',
                  borderRadius: 8,
                  backgroundColor: '#ffffff',
                }}
              />
            ) : (
              <img
                src={blobUrl}
                alt="Receipt preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: 520,
                  objectFit: 'contain',
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
            )
          )}
        </div>
      </div>
    </div>
  )
}
