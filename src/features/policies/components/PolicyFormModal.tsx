import { useRef, useState, type FormEvent } from 'react'
import { policiesApi } from '../policies.api'
import type { CompanyPolicy, PolicyStatus } from '../policies.types'
import { openPolicyFile } from '../policyFiles'
import { RichTextEditor } from './RichTextEditor'

const PRESET_CATEGORIES = [
  'General',
  'HR & Culture',
  'Leave & Attendance',
  'Code of Conduct',
  'IT & Security',
  'Finance & Travel',
  'Compensation & Benefits',
  'POSH & Compliance',
]

interface PolicyFormModalProps {
  policy?: CompanyPolicy | null
  onClose: () => void
  onSuccess: () => void
}

interface AttachedFile {
  url: string
  key: string
  fileName: string
  fileSize: number
  mimeType: string
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function PolicyFormModal({ policy, onClose, onSuccess }: PolicyFormModalProps) {
  const isEditing = Boolean(policy)

  const [title, setTitle] = useState(policy?.title || '')
  const [description, setDescription] = useState(policy?.description || '')
  const [category, setCategory] = useState(policy?.category || 'General')
  const [customCategory, setCustomCategory] = useState('')
  const [isCustomCategory, setIsCustomCategory] = useState(
    Boolean(policy?.category && !PRESET_CATEGORIES.includes(policy.category)),
  )
  const [status, setStatus] = useState<PolicyStatus>(policy?.status || 'active')

  // Attached files state
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Direct file attachment handler
  const handleDirectAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingFile(true)
      setUploadError(null)

      const result = await policiesApi.uploadAttachment(file)
      setAttachedFiles((prev) => [...prev, result])

      // Automatically append attachment card to description
      const isPdf = file.name.toLowerCase().endsWith('.pdf')
      const iconChar = isPdf ? '📄' : '📎'
      const cardHtml = `
        <div class="policy-attachment-card" data-url="${result.url}" data-name="${result.fileName}" data-size="${result.fileSize}" contenteditable="false" style="display: flex; align-items: center; justify-content: space-between; gap: 14px; background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 4px solid #3B49A8; border-radius: 10px; padding: 12px 16px; margin: 14px 0; user-select: none;">
          <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
            <span style="width: 36px; height: 36px; border-radius: 8px; background: #EEF2FF; color: #3B49A8; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">${iconChar}</span>
            <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0;">
              <strong style="font-size: 13.5px; color: #1E293B; word-break: break-all;">${result.fileName}</strong>
              <span style="font-size: 11.5px; color: #64748B;">${formatBytes(result.fileSize)} · Attachment</span>
            </div>
          </div>
          <a href="${result.url}" target="_blank" rel="noopener noreferrer" download="${result.fileName}" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 6px; background: #3B49A8; color: #FFFFFF !important; font-size: 12.5px; font-weight: 600; text-decoration: none; flex-shrink: 0;">
            Download ⤓
          </a>
        </div>
        <p><br></p>
      `
      setDescription((prev) => `${prev || ''}${cardHtml}`)
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload attachment.')
    } finally {
      setUploadingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Please provide a title for the policy.')
      return
    }

    const trimmedDesc = description.trim()
    if (!trimmedDesc || trimmedDesc === '<p><br></p>') {
      setError('Please provide the policy description or content.')
      return
    }

    const resolvedCategory = isCustomCategory
      ? customCategory.trim() || 'General'
      : category

    try {
      setBusy(true)
      setError(null)

      if (isEditing && policy) {
        await policiesApi.update(policy.id, {
          title: trimmedTitle,
          description: trimmedDesc,
          category: resolvedCategory,
          status,
        })
      } else {
        await policiesApi.create({
          title: trimmedTitle,
          description: trimmedDesc,
          category: resolvedCategory,
          status,
        })
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save policy.')
    } finally {
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
          maxWidth: 820,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.25), 0 0 1px rgba(0,0,0,0.1)',
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
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FAF7F2',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--ink, #1F1D1A)' }}>
              {isEditing ? 'Edit Company Policy' : 'Create New Company Policy'}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#78716C' }}>
              {isEditing
                ? 'Update policy text, attachments, or publication status.'
                : 'Define a new policy. You can write rich text and attach files (PDF, handbooks, etc.).'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: '#78716C',
              padding: '4px 8px',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflowY: 'auto',
          }}
        >
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {error && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  color: '#991B1B',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 13.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 6,
                  color: 'var(--ink, #1F1D1A)',
                }}
              >
                Policy Title <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Employee Leave & Attendance Policy, Code of Conduct"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={busy}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--border, #E4DDD3)',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Category & Status Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
              }}
            >
              {/* Category */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 6,
                    color: 'var(--ink, #1F1D1A)',
                  }}
                >
                  Category
                </label>
                {!isCustomCategory ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select
                      value={category}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomCategory(true)
                        } else {
                          setCategory(e.target.value)
                        }
                      }}
                      disabled={busy}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--border, #E4DDD3)',
                        fontSize: 13.5,
                        fontFamily: 'inherit',
                        background: '#FFFFFF',
                      }}
                    >
                      {PRESET_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__custom__">+ Custom category...</option>
                    </select>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      placeholder="Enter custom category"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      disabled={busy}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--border, #E4DDD3)',
                        fontSize: 13.5,
                        fontFamily: 'inherit',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomCategory(false)}
                      style={{
                        padding: '0 12px',
                        fontSize: 12.5,
                        borderRadius: 6,
                        border: '1px solid #D6D3D1',
                        background: '#F5F5F4',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 6,
                    color: 'var(--ink, #1F1D1A)',
                  }}
                >
                  Publication Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PolicyStatus)}
                  disabled={busy}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border, #E4DDD3)',
                    fontSize: 13.5,
                    fontFamily: 'inherit',
                    background: '#FFFFFF',
                  }}
                >
                  <option value="active">Active (Visible to all employees)</option>
                  <option value="draft">Draft (Hidden from employees)</option>
                  <option value="archived">Archived (Inactive)</option>
                </select>
              </div>
            </div>

            {/* Description & Attachments (Rich Text Editor) */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 6,
                }}
              >
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--ink, #1F1D1A)',
                  }}
                >
                  Policy Description & Content <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <span style={{ fontSize: 12, color: '#A8A29E' }}>
                  Supports rich formatting & document file attachments
                </span>
              </div>

              {/* Rich Text Editor */}
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Enter the full policy terms, guidelines, objectives, eligibility, and rules..."
                minHeight={250}
                onFileUploaded={(uploaded) => {
                  setAttachedFiles((prev) => [...prev, uploaded])
                }}
              />

              {/* Dedicated Attachment Row */}
              <div
                style={{
                  marginTop: 10,
                  padding: '12px 14px',
                  background: '#F8FAFC',
                  border: '1px dashed #CBD5E1',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>📎</span>
                  <div>
                    <strong style={{ fontSize: 13, color: '#334155', display: 'block' }}>
                      Attach Policy File / Handbook
                    </strong>
                    <span style={{ fontSize: 12, color: '#64748B' }}>
                      Upload PDF, DOCX, or Image files directly to policy content
                    </span>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={handleDirectAttach}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.webp"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile || busy}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: '1px solid #94A3B8',
                    background: '#FFFFFF',
                    color: '#1E293B',
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: uploadingFile ? 'wait' : 'pointer',
                  }}
                >
                  <span>{uploadingFile ? '⏳ Uploading…' : '+ Attach Document'}</span>
                </button>
              </div>

              {uploadError && (
                <div style={{ marginTop: 8, fontSize: 12.5, color: '#DC2626' }}>
                  ⚠️ {uploadError}
                </div>
              )}

              {/* List of currently attached files */}
              {attachedFiles.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>
                    Attached in this session ({attachedFiles.length}):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {attachedFiles.map((f, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: 12.5,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>📄</span>
                          <span style={{ fontWeight: 500, color: '#1E293B' }}>{f.fileName}</span>
                          <span style={{ color: '#94A3B8' }}>({formatBytes(f.fileSize)})</span>
                        </div>
                        <a
                          href={f.url}
                          onClick={(e) => {
                            e.preventDefault()
                            void openPolicyFile(f.url, f.fileName)
                          }}
                          style={{
                            color: 'var(--blue, #2563EB)',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          View File ↗
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border, #E4DDD3)',
              background: '#FAF7F2',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              style={{
                padding: '9px 18px',
                borderRadius: 8,
                border: '1px solid var(--border, #E4DDD3)',
                background: '#FFFFFF',
                color: '#44403C',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{
                padding: '9px 22px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--blue, #2563EB)',
                color: '#FFFFFF',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.7 : 1,
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
              }}
            >
              {busy
                ? 'Saving Policy…'
                : isEditing
                  ? 'Update Policy'
                  : 'Create & Publish Policy'}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes fadeScaleIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}
