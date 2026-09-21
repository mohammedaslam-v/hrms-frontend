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
    key: DocumentKey | string
    label?: string
    docNumber: string
    isCustom?: boolean
  }>({
    open: false,
    key: 'pan',
    label: '',
    docNumber: '',
    isCustom: false,
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

  const openUpload = (key: DocumentKey | string = 'pan', docNumber = '', label = '', isCustom = false) => {
    setModalState({ open: true, key, docNumber, label, isCustom })
  }

  const openUploadCustom = (key = '', label = '', docNumber = '') => {
    setModalState({ open: true, key: key || 'custom', label, docNumber, isCustom: true })
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

  // Find extra/custom documents beyond the standard 5
  const standardKeySet = new Set<string>(DOCUMENT_OPTIONS.map((opt) => opt.key))
  const extraDocs = documents.filter((d) => !standardKeySet.has(d.key))

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          flexShrink: 0,
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

        {canUpload && !isManagerViewingReport && (
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
          <div className="docs-scroll">
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

            {/* Custom / Extra documents added */}
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
                } else if (canUpload) {
                  openUploadCustom(doc.key, doc.label, doc.docNumber || '')
                }
              }

              return (
                <div
                  className={`doc ${hasFile || canUpload ? 'doc-clickable' : ''}`}
                  key={doc.key}
                  onClick={handleExtraRowClick}
                  title={hasFile ? `Click to view ${doc.label}` : canUpload ? `Click to edit ${doc.label}` : undefined}
                >
                  <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>📄</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{doc.label}</span>
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
                    {doc.docNumber && (
                      <div className="hint" style={{ fontFamily: 'monospace', fontSize: 11, marginTop: 2 }}>
                        Ref:{' '}<b style={{ color: 'var(--ink2)' }}>{doc.docNumber}</b>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
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

                    {canUpload && (
                      <button
                        type="button"
                        className="btn ghost sm"
                        style={{ padding: '3px 8px', fontSize: 11 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          openUploadCustom(doc.key, doc.label, doc.docNumber || '')
                        }}
                        title={isOnFile ? 'Update file or document reference' : `Upload ${doc.label}`}
                      >
                        {isOnFile ? 'Update' : 'Upload'}
                      </button>
                    )}

                    {canUpload && (
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
          </div>

          {/* Add New Custom Document Button */}
          {canUpload && (
            <button
              type="button"
              className="btn ghost sm mt"
              onClick={() => openUploadCustom()}
              style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
            >
              + Add new document
            </button>
          )}
        </>
      )}

      {/* Upload/Update Document Modal */}
      {modalState.open && (
        <UploadDocumentModal
          employeeId={isSelf ? undefined : employeeId}
          initialKey={modalState.key}
          initialLabel={modalState.label}
          initialDocNumber={modalState.docNumber}
          isCustom={modalState.isCustom}
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
                  const isStd = DOCUMENT_OPTIONS.some((opt) => opt.key === viewingDoc.key)
                  if (isStd) {
                    openUpload(viewingDoc.key as DocumentKey, viewingDoc.docNumber || '')
                  } else {
                    openUploadCustom(viewingDoc.key, viewingDoc.label, viewingDoc.docNumber || '')
                  }
                }
              : undefined
          }
        />
      )}

      {/* Direct Delete Confirmation Dialog */}
      {deleteTarget && (
        <div
          className="modal on"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) {
              setDeleteTarget(null)
            }
          }}
          style={{ zIndex: 1100 }}
        >
          <div className="box" style={{ maxWidth: 440 }}>
            <div className="mh">
              <h3 style={{ margin: 0, color: 'var(--red, #dc3e43)' }}>
                Remove Document
              </h3>
              <button
                type="button"
                className="x"
                onClick={() => !deleting && setDeleteTarget(null)}
                disabled={deleting}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '16px 0 8px' }}>
              <p style={{ fontSize: 13.5, color: 'var(--ink)', margin: '0 0 12px' }}>
                Are you sure you want to remove <b>{deleteTarget.label}</b>?
              </p>
              <div
                className="notice bad"
                style={{
                  fontSize: 12,
                  marginBottom: 14,
                  lineHeight: 1.5,
                }}
              >
                This will delete the file from the system and clear any stored document number.
              </div>

              {deleteError && (
                <div
                  className="notice red"
                  style={{
                    fontSize: 12,
                    marginBottom: 12,
                  }}
                >
                  {deleteError}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 8,
                  marginTop: 16,
                }}
              >
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn danger sm"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  style={{
                    background: '#dc3e43',
                    borderColor: '#dc3e43',
                    color: '#fff',
                  }}
                >
                  {deleting ? 'Removing…' : 'Yes, Remove Document'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
