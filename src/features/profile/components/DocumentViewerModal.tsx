import { useEffect, useState, type ReactNode } from 'react'
import { messageOf } from '../../../shared/api/errors'
import { profileApi } from '../profile.api'
import type { DocumentKey } from '../profile.types'

export interface DocumentViewerTarget {
  key: DocumentKey | string
  label: string
  icon?: ReactNode
  docNumber?: string | null
  path?: string | null
}

interface DocumentViewerModalProps {
  document: DocumentViewerTarget
  employeeId?: number
  isSelf?: boolean
  onClose: () => void
  onUpdate?: () => void
}

export function DocumentViewerModal({
  document: doc,
  employeeId,
  isSelf = true,
  onClose,
  onUpdate,
}: DocumentViewerModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState<string>('')
  const [fileSize, setFileSize] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const directViewUrl = profileApi.getDocumentDownloadUrl(
    doc.key,
    isSelf ? undefined : employeeId,
  )

  useEffect(() => {
    let active = true
    let createdUrl: string | null = null

    setLoading(true)
    setError(null)
    setBlobUrl(null)

    profileApi
      .fetchDocumentBlob(doc.key, isSelf ? undefined : employeeId)
      .then((blob) => {
        if (!active) return
        const type = (blob.type || '').toLowerCase()
        setMimeType(type)
        setFileSize(blob.size)
        createdUrl = URL.createObjectURL(blob)
        setBlobUrl(createdUrl)
        setLoading(false)
      })
      .catch((err) => {
        if (!active) return
        setError(
          messageOf(
            err,
            'Could not load document preview in the browser. You can still open it in a new tab.',
          ),
        )
        setLoading(false)
      })

    return () => {
      active = false
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl)
      }
    }
  }, [doc.key, employeeId, isSelf])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleDownload = () => {
    const ext = mimeType.includes('pdf')
      ? 'pdf'
      : mimeType.includes('png')
        ? 'png'
        : mimeType.includes('jpeg') || mimeType.includes('jpg')
          ? 'jpg'
          : doc.path?.split('.').pop() || 'pdf'
    const fileName = `${doc.key}_${doc.docNumber || 'document'}.${ext}`
    profileApi.downloadDocumentFile(
      doc.key,
      isSelf ? undefined : employeeId,
      fileName,
    )
  }

  const isImage =
    mimeType.startsWith('image/') ||
    /\.(png|jpe?g|webp|gif|svg)$/i.test(doc.path || '')

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div
      className="modal on"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        zIndex: 1050,
        backgroundColor: 'rgba(15, 23, 41, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="box"
        style={{
          width: '94vw',
          maxWidth: 920,
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 16,
          background: 'var(--card, #ffffff)',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.28)',
          border: '1px solid var(--line, #e2e8f0)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '14px 20px',
            borderBottom: '1px solid var(--line2, #ede7de)',
            background: 'var(--panel, #fbf8f4)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>
              {doc.icon || '📄'}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--ink, #0f1729)',
                  }}
                >
                  {doc.label}
                </h3>
                <span
                  className="tag"
                  style={{
                    background: '#ecfdf5',
                    color: '#059669',
                    borderColor: '#a7f3d0',
                    fontSize: 10.5,
                    padding: '1px 6px',
                  }}
                >
                  ✓ On file
                </span>
                {fileSize && (
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--muted, #8a8578)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {formatSize(fileSize)}
                  </span>
                )}
              </div>
              {doc.docNumber && (
                <div
                  style={{
                    fontSize: 11.5,
                    fontFamily: 'monospace',
                    letterSpacing: '0.04em',
                    color: 'var(--ink2, #344054)',
                    marginTop: 2,
                  }}
                >
                  Document No.: <b>{doc.docNumber}</b>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <a
              href={directViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn ghost sm"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '5px 10px',
                fontSize: 11.5,
              }}
              title="Open document in a new browser tab"
            >
              <span>↗</span> Open tab
            </a>

            <button
              type="button"
              className="btn ghost sm"
              onClick={handleDownload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '5px 10px',
                fontSize: 11.5,
              }}
              title="Download file to device"
            >
              <span>⤓</span> Download
            </button>

            {onUpdate && (
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => {
                  onClose()
                  onUpdate()
                }}
                style={{ padding: '5px 10px', fontSize: 11.5 }}
                title="Upload a replacement document or change number"
              >
                Update
              </button>
            )}

            <button
              type="button"
              className="x"
              onClick={onClose}
              aria-label="Close modal"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 16,
                padding: '4px 8px',
                color: 'var(--muted2, #667085)',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div
          style={{
            flex: 1,
            minHeight: 420,
            maxHeight: 'calc(94vh - 130px)',
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isImage ? '#1a1f2c' : '#f8fafc',
            position: 'relative',
            padding: isImage ? 20 : 0,
          }}
        >
          {loading && (
            <div
              style={{
                textAlign: 'center',
                padding: 40,
                color: 'var(--muted2, #667085)',
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  marginBottom: 12,
                  animation: 'pulse 1.4s ease-in-out infinite',
                }}
              >
                📄
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink, #0f1729)' }}>
                Loading document preview…
              </div>
              <div className="hint" style={{ marginTop: 4 }}>
                Preparing secure document stream
              </div>
            </div>
          )}

          {error && !loading && (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 24px',
                maxWidth: 460,
                background: 'var(--card, #fff)',
                borderRadius: 12,
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                margin: 20,
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
              <h4
                style={{
                  margin: '0 0 8px',
                  fontSize: 15,
                  color: 'var(--ink, #0f1729)',
                }}
              >
                Document preview unavailable directly
              </h4>
              <p
                style={{
                  fontSize: 12.5,
                  color: 'var(--muted2, #667085)',
                  lineHeight: 1.5,
                  marginBottom: 20,
                }}
              >
                {error}
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <a
                  href={directViewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn primary sm"
                  style={{ textDecoration: 'none' }}
                >
                  Open in new tab ↗
                </a>
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={handleDownload}
                >
                  Download file ⤓
                </button>
              </div>
            </div>
          )}

          {blobUrl && !loading && !error && (
            isImage ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'auto',
                }}
              >
                <img
                  src={blobUrl}
                  alt={doc.label}
                  style={{
                    maxWidth: '100%',
                    maxHeight: 'calc(94vh - 170px)',
                    objectFit: 'contain',
                    borderRadius: 8,
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
                  }}
                />
              </div>
            ) : (
              <iframe
                src={blobUrl}
                title={doc.label}
                style={{
                  width: '100%',
                  height: 'calc(94vh - 130px)',
                  minHeight: 460,
                  border: 'none',
                  display: 'block',
                  background: '#ffffff',
                }}
              />
            )
          )}
        </div>

        {/* Footer info notice */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 18px',
            borderTop: '1px solid var(--line2, #ede7de)',
            background: 'var(--panel, #fbf8f4)',
            fontSize: 11.5,
            color: 'var(--muted2, #667085)',
            flexShrink: 0,
          }}
        >
          <span>
            🔒 Confidential document • Visible to you and HR administrators only
          </span>
          <button
            type="button"
            className="btn ghost sm"
            onClick={onClose}
            style={{ padding: '4px 12px', fontSize: 11.5 }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
