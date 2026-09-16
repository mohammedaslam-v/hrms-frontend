import { useState } from 'react'
import { messageOf } from '../../../shared/api/errors'
import { profileApi } from '../profile.api'
import type { DocumentKey, ProfileAccess, ProfileDocument } from '../profile.types'
import { DOCUMENT_OPTIONS, UploadDocumentModal } from './UploadDocumentModal'
import { DocumentViewerModal, type DocumentViewerTarget } from './DocumentViewerModal'

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

  const [viewingDoc, setViewingDoc] = useState<DocumentViewerTarget | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{
    key: DocumentKey | string
    label: string
  } | null>(null)
  const [deleting, setDeleting] = useState<boolean>(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Can upload, update or delete: the employee themselves, or an HR/admin
  const canUpload = isSelf || access === 'admin'
  const isManagerViewingReport = !isSelf && access === 'manager'

  const openUpload = (key: DocumentKey = 'pan', docNumber = '') => {
    setModalState({ open: true, key, docNumber })
  }

  const closeUpload = () => {
    setModalState((prev) => ({ ...prev, open: false }))
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await profileApi.deleteDocument(
        deleteTarget.key,
        isSelf ? undefined : employeeId,
      )
      setDeleting(false)
      setDeleteTarget(null)
      onRefresh()
    } catch (err) {
      setDeleteError(messageOf(err, 'Failed to remove document. Please try again.'))
      setDeleting(false)
    }
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

            const handleRowClick = () => {
              if (hasFile) {
                setViewingDoc({
                  key: opt.key,
                  label: opt.label,
                  icon: opt.icon,
                  docNumber: found?.docNumber,
                  path: found?.path,
                })
              } else if (canUpload) {
                openUpload(opt.key, found?.docNumber || '')
              }
            }

            return (
              <div
                className={`doc ${hasFile || canUpload ? 'doc-clickable' : ''}`}
                key={opt.key}
                onClick={handleRowClick}
                title={
                  hasFile
                    ? `Click to view ${opt.label}`
                    : canUpload
                      ? `Click to upload ${opt.label}`
                      : undefined
                }
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
                  {hasFile && (
                    <button
                      type="button"
                      className="btn ghost sm"
                      style={{
                        padding: '3px 8px',
                        fontSize: 11,
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setViewingDoc({
                          key: opt.key,
                          label: opt.label,
                          icon: opt.icon,
                          docNumber: found?.docNumber,
                          path: found?.path,
                        })
                      }}
                      title={`Open ${opt.label}`}
                    >
                      View
                    </button>
                  )}

                  {canUpload && (
                    <button
                      type="button"
                      className="btn ghost sm"
                      style={{ padding: '3px 8px', fontSize: 11 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        openUpload(opt.key, found?.docNumber || '')
                      }}
                      title={isOnFile ? 'Replace file or change number' : 'Upload document'}
                    >
                      {isOnFile ? 'Update' : 'Upload'}
                    </button>
                  )}

                  {isOnFile && canUpload && (
                    <button
                      type="button"
                      className="btn ghost sm"
                      style={{
                        padding: '3px 8px',
                        fontSize: 11,
                        color: 'var(--red, #dc3e43)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteError(null)
                        setDeleteTarget({
                          key: opt.key,
                          label: opt.label,
                        })
                      }}
                      title={`Remove ${opt.label}`}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* Any additional documents attached in record */}
          {extraDocs.map((doc) => {
            const hasFile = Boolean(doc.path)
            const isOnFile = hasFile || Boolean(doc.docNumber)

            const handleExtraRowClick = () => {
              if (hasFile) {
                setViewingDoc({
                  key: doc.key,
                  label: doc.label,
                  icon: '📄',
                  docNumber: doc.docNumber,
                  path: doc.path,
                })
              }
            }

            return (
              <div
                className={`doc ${hasFile ? 'doc-clickable' : ''}`}
                key={doc.key}
                onClick={handleExtraRowClick}
                title={hasFile ? `Click to view ${doc.label}` : undefined}
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

                  {hasFile && (
                    <button
                      type="button"
                      className="btn ghost sm"
                      style={{
                        padding: '3px 8px',
                        fontSize: 11,
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setViewingDoc({
                          key: doc.key,
                          label: doc.label,
                          icon: '📄',
                          docNumber: doc.docNumber,
                          path: doc.path,
                        })
                      }}
                    >
                      View
                    </button>
                  )}

                  {isOnFile && canUpload && (
                    <button
                      type="button"
                      className="btn ghost sm"
                      style={{
                        padding: '3px 8px',
                        fontSize: 11,
                        color: 'var(--red, #dc3e43)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteError(null)
                        setDeleteTarget({
                          key: doc.key,
                          label: doc.label,
                        })
                      }}
                      title={`Remove ${doc.label}`}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* Upload/Update Document Modal */}
      {modalState.open && (
        <UploadDocumentModal
          employeeId={isSelf ? undefined : employeeId}
          initialKey={modalState.key}
          initialDocNumber={modalState.docNumber}
          isOnFile={Boolean(
            documents.find((d) => d.key === modalState.key)?.path ||
            documents.find((d) => d.key === modalState.key)?.docNumber,
          )}
          onClose={closeUpload}
          onSuccess={() => {
            onRefresh()
          }}
          onDelete={() => {
            onRefresh()
          }}
        />
      )}

      {/* Interactive Document Viewer Modal */}
      {viewingDoc && (
        <DocumentViewerModal
          document={viewingDoc}
          employeeId={isSelf ? undefined : employeeId}
          isSelf={isSelf}
          canDelete={canUpload}
          onClose={() => setViewingDoc(null)}
          onDelete={() => onRefresh()}
          onUpdate={
            canUpload
              ? () => {
                  const targetKey = viewingDoc.key as DocumentKey
                  const targetNum = viewingDoc.docNumber || ''
                  setViewingDoc(null)
                  openUpload(targetKey, targetNum)
                }
              : undefined
          }
        />
      )}

      {/* Confirmation Modal for Document Deletion from List */}
      {deleteTarget && (
        <div
          className="modal on"
          style={{
            zIndex: 1100,
            backgroundColor: 'rgba(15, 23, 41, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) {
              setDeleteTarget(null)
            }
          }}
        >
          <div className="box" style={{ maxWidth: 440, padding: 22 }}>
            <div className="mh">
              <h3 style={{ margin: 0, fontSize: 16 }}>Remove Document?</h3>
              <button
                type="button"
                className="x"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                ✕
              </button>
            </div>

            {deleteError && (
              <div className="notice bad" style={{ marginBottom: 12 }}>
                {deleteError}
              </div>
            )}

            <p
              style={{
                fontSize: 13,
                color: 'var(--ink2, #344054)',
                margin: '14px 0 20px',
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to remove <b>{deleteTarget.label}</b>? This will delete the uploaded file and clear stored information from this employee profile.
            </p>

            <div className="mfoot">
              <button
                className="btn ghost"
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn danger"
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Removing…' : 'Yes, Remove Document'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
