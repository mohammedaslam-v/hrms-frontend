import { useState } from 'react'
import { profileApi } from '../profile.api'
import type { DocumentKey, ProfileAccess, ProfileDocument } from '../profile.types'
import { DOCUMENT_OPTIONS, UploadDocumentModal } from './UploadDocumentModal'

interface DocumentsCardProps {
  documents: ProfileDocument[]
  isSelf: boolean
  access: ProfileAccess
  employeeId: number
  onRefresh: () => void
}

export function DocumentsCard({
  documents,
  isSelf,
  access,
  employeeId,
  onRefresh,
}: DocumentsCardProps) {
  const [modalState, setModalState] = useState<{
    open: boolean
    key: DocumentKey
    docNumber: string
  }>({
    open: false,
    key: 'pan',
    docNumber: '',
  })

  // Can upload or update: the employee themselves, or an HR/admin
  const canUpload = isSelf || access === 'admin'
  const isManagerViewingReport = !isSelf && access === 'manager'

  const openUpload = (key: DocumentKey = 'pan', docNumber = '') => {
    setModalState({ open: true, key, docNumber })
  }

  const closeUpload = () => {
    setModalState((prev) => ({ ...prev, open: false }))
  }

  // Count how many documents are on file
  const onFileCount = documents.filter((d) => Boolean(d.path || d.docNumber)).length

  // Find extra documents if any exist beyond the standard 5
  const standardKeySet = new Set<string>(DOCUMENT_OPTIONS.map((opt) => opt.key))
  const extraDocs = documents.filter((d) => !standardKeySet.has(d.key))

  return (
    <div className="card">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0 }}>Documents</h3>
          {!isManagerViewingReport && onFileCount > 0 && (
            <span
              className="tag"
              style={{
                background: '#ecfdf5',
                color: '#059669',
                borderColor: '#a7f3d0',
                fontSize: 11,
              }}
            >
              {onFileCount} on file
            </span>
          )}
        </div>

        {canUpload && (
          <button
            type="button"
            className="btn ghost sm"
            onClick={() => openUpload('pan', '')}
            style={{ fontSize: 11.5 }}
          >
            + Upload
          </button>
        )}
      </div>

      {isManagerViewingReport ? (
        <div className="empty" style={{ padding: '24px 12px' }}>
          <b>Documents restricted</b>
          Personal identity and onboarding documents are confidential and visible to the employee
          and HR only.
        </div>
      ) : (
        <>
          {DOCUMENT_OPTIONS.map((opt) => {
            const found = documents.find((d) => d.key === opt.key)
            const hasFile = Boolean(found?.path)
            const hasNumber = Boolean(found?.docNumber)
            const isOnFile = hasFile || hasNumber
            const viewUrl = hasFile
              ? profileApi.getDocumentDownloadUrl(opt.key, isSelf ? undefined : employeeId)
              : null

            return (
              <div
                className="doc"
                key={opt.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 0',
                }}
              >
                <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{opt.icon}</span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>
                      {opt.label}
                    </span>

                    {isOnFile ? (
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
                    ) : (
                      <span
                        className="tag"
                        style={{
                          color: 'var(--muted2)',
                          fontSize: 10.5,
                          padding: '1px 6px',
                        }}
                      >
                        Not provided
                      </span>
                    )}
                  </div>

                  {found?.docNumber && (
                    <div
                      className="hint"
                      style={{
                        fontFamily: 'monospace',
                        letterSpacing: '0.04em',
                        fontSize: 11,
                        marginTop: 2,
                      }}
                    >
                      {opt.key === 'pan' ? 'PAN' : opt.key === 'aadhaar' ? 'UID' : 'No.'}:{' '}
                      <b style={{ color: 'var(--ink2)' }}>{found.docNumber}</b>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  {viewUrl && (
                    <a
                      href={viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn ghost sm"
                      style={{
                        textDecoration: 'none',
                        padding: '3px 8px',
                        fontSize: 11,
                      }}
                      title={`Open ${opt.label} in new tab`}
                    >
                      View
                    </a>
                  )}

                  {canUpload && (
                    <button
                      type="button"
                      className="btn ghost sm"
                      style={{ padding: '3px 8px', fontSize: 11 }}
                      onClick={() => openUpload(opt.key, found?.docNumber || '')}
                    >
                      {isOnFile ? 'Update' : 'Upload'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* Any additional documents attached in record */}
          {extraDocs.map((doc) => {
            const viewUrl = doc.path
              ? profileApi.getDocumentDownloadUrl(doc.key, isSelf ? undefined : employeeId)
              : null

            return (
              <div
                className="doc"
                key={doc.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 0',
                }}
              >
                <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>📄</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{doc.label}</div>
                  {doc.docNumber && (
                    <div className="hint" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                      No.: <b>{doc.docNumber}</b>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
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
                    On file
                  </span>

                  {viewUrl && (
                    <a
                      href={viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn ghost sm"
                      style={{
                        textDecoration: 'none',
                        padding: '3px 8px',
                        fontSize: 11,
                      }}
                    >
                      View
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </>
      )}

      {modalState.open && (
        <UploadDocumentModal
          employeeId={isSelf ? undefined : employeeId}
          initialKey={modalState.key}
          initialDocNumber={modalState.docNumber}
          onClose={closeUpload}
          onSuccess={() => {
            onRefresh()
          }}
        />
      )}
    </div>
  )
}
