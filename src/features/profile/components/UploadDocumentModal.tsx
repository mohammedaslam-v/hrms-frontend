import { useState, useRef, type FormEvent, type ChangeEvent, type DragEvent } from 'react'
import { Modal } from '../../../shared/ui/Modal'
import { messageOf } from '../../../shared/api/errors'
import { profileApi } from '../profile.api'
import type { DocumentKey, ProfileDocument } from '../profile.types'

export interface DocumentOption {
  key: DocumentKey
  label: string
  icon: string
  hasNumber?: boolean
  numberLabel?: string
  numberPlaceholder?: string
}

export const DOCUMENT_OPTIONS: DocumentOption[] = [
  {
    key: 'pan',
    label: 'PAN Card',
    icon: '🪪',
    hasNumber: true,
    numberLabel: 'PAN Number',
    numberPlaceholder: 'e.g. ABCDE1234F (10 alphanumeric)',
  },
  {
    key: 'aadhaar',
    label: 'Aadhaar Card',
    icon: '🆔',
    hasNumber: true,
    numberLabel: 'Aadhaar Number',
    numberPlaceholder: 'e.g. 1234 5678 9012 (12 digits)',
  },
  {
    key: 'resume',
    label: 'Resume / CV',
    icon: '📄',
  },
  {
    key: 'permanentAddress',
    label: 'Permanent Address Proof',
    icon: '🏠',
  },
  {
    key: 'temporaryAddress',
    label: 'Current Address Proof',
    icon: '📍',
  },
]

interface UploadDocumentModalProps {
  employeeId?: number
  initialKey?: DocumentKey | string
  initialLabel?: string
  initialDocNumber?: string
  isCustom?: boolean
  isOnFile?: boolean
  onClose: () => void
  onSuccess: (saved: ProfileDocument) => void
  onDelete?: () => void
}

export function UploadDocumentModal({
  employeeId,
  initialKey = 'pan',
  initialLabel = '',
  initialDocNumber = '',
  isCustom = false,
  isOnFile = false,
  onClose,
  onSuccess,
  onDelete,
}: UploadDocumentModalProps) {
  const isStandardInitial = DOCUMENT_OPTIONS.some((opt) => opt.key === initialKey)
  const isExistingCustom = !isStandardInitial && Boolean(initialKey) && initialKey !== 'custom'
  const customKey = isExistingCustom ? (initialKey as string) : ''

  const [selectedKey, setSelectedKey] = useState<string>(
    isCustom || !isStandardInitial ? 'custom' : initialKey,
  )

  const [customLabel, setCustomLabel] = useState<string>(initialLabel)
  const [docNumber, setDocNumber] = useState<string>(initialDocNumber)
  const [file, setFile] = useState<File | null>(null)
  const [fileBase64, setFileBase64] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const isCustomMode = selectedKey === 'custom'

  const currentOption = isCustomMode
    ? {
        key: 'custom' as DocumentKey,
        label: customLabel.trim() || 'Custom Document',
        icon: '📄',
        hasNumber: true,
        numberLabel: 'Document / Reference Number',
        numberPlaceholder: 'e.g. DOC-1234 or Certificate No.',
      }
    : DOCUMENT_OPTIONS.find((opt) => opt.key === selectedKey) || DOCUMENT_OPTIONS[0]

  const handleKeyChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const nextKey = e.target.value
    setSelectedKey(nextKey)
    if (nextKey === 'custom') {
      setCustomLabel(initialLabel || '')
      setDocNumber(isExistingCustom ? initialDocNumber : '')
    } else if (nextKey !== initialKey) {
      setDocNumber('')
    } else {
      setDocNumber(initialDocNumber)
    }
    setError(null)
  }

  const handleNumberChange = (val: string) => {
    if (selectedKey === 'pan') {
      const cleaned = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
      setDocNumber(cleaned)
    } else if (selectedKey === 'aadhaar') {
      const digits = val.replace(/\D/g, '').slice(0, 12)
      const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ')
      setDocNumber(formatted)
    } else {
      setDocNumber(val)
    }
  }

  const handleFile = (picked: File) => {
    setError(null)
    const validExts = ['pdf', 'png', 'jpg', 'jpeg']
    const ext = picked.name.split('.').pop()?.toLowerCase() || ''
    if (!validExts.includes(ext)) {
      setError('Please choose a valid PDF, PNG, or JPG file.')
      return
    }

    if (picked.size > 10 * 1024 * 1024) {
      setError('File size must not exceed 10 MB.')
      return
    }

    setFile(picked)
    const reader = new FileReader()
    reader.onload = () => {
      setFileBase64(reader.result as string)
    }
    reader.onerror = () => {
      setError('Could not read the selected file.')
    }
    reader.readAsDataURL(picked)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const removeFile = () => {
    setFile(null)
    setFileBase64(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const canSubmit = isCustomMode
    ? Boolean(customLabel.trim())
    : Boolean(fileBase64 || docNumber.trim() || isOnFile)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (isCustomMode && !customLabel.trim()) {
      setError('Please give the document a name (e.g. Experience Letter, Degree Certificate).')
      return
    }

    // Validation for standard IDs
    const cleanDocNum = docNumber.trim().replace(/\s+/g, '')
    if (selectedKey === 'pan' && cleanDocNum && cleanDocNum.length !== 10) {
      setError('PAN number must be 10 characters long (e.g. ABCDE1234F).')
      return
    }
    if (selectedKey === 'aadhaar' && cleanDocNum && cleanDocNum.length !== 12) {
      setError('Aadhaar number must be 12 digits long.')
      return
    }

    // For standard documents, require a file or document number if not already on file
    if (!isCustomMode && !fileBase64 && !cleanDocNum && !isOnFile) {
      setError('Please select a file to upload or enter a document reference number.')
      return
    }

    const finalKey = isCustomMode
      ? (customKey ? customKey : `custom_${Date.now()}`)
      : selectedKey

    const finalLabel = isCustomMode ? customLabel.trim() : currentOption.label

    setSaving(true)
    try {
      const saved = await profileApi.uploadDocument(
        {
          key: finalKey,
          label: finalLabel,
          fileName: file ? file.name : undefined,
          fileBase64: fileBase64 || undefined,
          docNumber: cleanDocNum || undefined,
        },
        employeeId,
      )
      onSuccess(saved)
      onClose()
    } catch (err) {
      setError(messageOf(err, 'Could not save document. Please try again.'))
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    const keyToDelete = isCustomMode ? customKey : selectedKey
    if (!keyToDelete || keyToDelete === 'custom') {
      onClose()
      return
    }
    setDeleting(true)
    setError(null)
    try {
      await profileApi.deleteDocument(keyToDelete, employeeId)
      setDeleting(false)
      onDelete?.()
      onClose()
    } catch (err) {
      setError(messageOf(err, 'Could not remove document. Please try again.'))
      setDeleting(false)
    }
  }

  return (
    <Modal
      title={
        isCustomMode
          ? `📄 ${isOnFile || isExistingCustom ? 'Update' : 'Add'} Custom Document`
          : `${currentOption.icon} Upload / Update ${currentOption.label}`
      }
      onClose={onClose}
      onSubmit={submit}
      busy={saving || deleting}
      error={error}
      maxWidth={520}
      confirm={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {(isOnFile || isExistingCustom) && (
            <button
              type="button"
              className="btn danger"
              onClick={() => setConfirmingDelete(true)}
              disabled={saving || deleting}
              style={{
                background: '#dc3e43',
                borderColor: '#dc3e43',
                color: '#ffffff',
                fontSize: 12,
              }}
            >
              {deleting ? 'Removing…' : 'Delete Document'}
            </button>
          )}
          <button
            className="btn primary"
            type="submit"
            disabled={saving || deleting || !canSubmit}
          >
            {saving
              ? 'Saving…'
              : isOnFile
                ? 'Save Changes'
                : isCustomMode && !fileBase64
                  ? 'Add Document'
                  : 'Upload Document'}
          </button>
        </div>
      }
    >
      {confirmingDelete && (
        <div className="notice bad" style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            Remove {currentOption.label}?
          </div>
          <div style={{ fontSize: 12, marginBottom: 10 }}>
            This will delete the uploaded file and clear stored information from your profile.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => setConfirmingDelete(false)}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn danger sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Removing…' : 'Yes, Delete'}
            </button>
          </div>
        </div>
      )}

      {/* Document Type Selector */}
      <div className="f">
        <label htmlFor="docTypeSelect">Document Type</label>
        <select
          id="docTypeSelect"
          value={selectedKey}
          onChange={handleKeyChange}
          disabled={saving || (isCustom && Boolean(customKey))}
        >
          {DOCUMENT_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.icon} {opt.label}
            </option>
          ))}
          <option value="custom">➕ Other / Custom Document...</option>
        </select>
      </div>

      {/* Custom Document Name Input */}
      {isCustomMode && (
        <div className="f mt">
          <label htmlFor="customDocName">
            Document Name / Title <span style={{ color: 'var(--red)' }}>*</span>
          </label>
          <input
            id="customDocName"
            type="text"
            placeholder="e.g. Experience Letter, Degree Certificate, Offer Letter"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            disabled={saving}
            required
            autoFocus
          />
        </div>
      )}

      {/* Document Number Input */}
      {(currentOption.hasNumber || isCustomMode) && (
        <div className="f mt">
          <label htmlFor="docNumberInput">{currentOption.numberLabel}</label>
          <input
            id="docNumberInput"
            type="text"
            value={docNumber}
            onChange={(e) => handleNumberChange(e.target.value)}
            placeholder={currentOption.numberPlaceholder}
            disabled={saving}
            style={{
              fontFamily: selectedKey === 'pan' || selectedKey === 'aadhaar' ? 'monospace' : 'inherit',
              letterSpacing: selectedKey === 'pan' || selectedKey === 'aadhaar' ? '0.05em' : 'normal',
            }}
          />
          {selectedKey === 'pan' && (
            <div className="hint">10-character alphanumeric PAN issued by the Income Tax Department</div>
          )}
          {selectedKey === 'aadhaar' && (
            <div className="hint">12-digit UIDAI Aadhaar identification number</div>
          )}
        </div>
      )}

      {/* File Upload Area */}
      <div className="f mt">
        <label>
          Document File (PDF, PNG, JPG — Max 10MB)
          {isOnFile && <span className="hint" style={{ marginLeft: 6 }}>(Select new file to replace existing)</span>}
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,image/png,image/jpeg,application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0])
            }
          }}
          disabled={saving}
        />

        {!file ? (
          <div
            onClick={() => !saving && fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragging ? 'var(--blue)' : 'var(--line)'}`,
              borderRadius: 11,
              padding: '22px 16px',
              textAlign: 'center',
              background: dragging ? 'var(--blue-soft)' : 'var(--panel)',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ fontSize: 26, marginBottom: 6 }}>📁</div>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>
              Click to select or drag &amp; drop document file
            </div>
            <div className="hint" style={{ marginTop: 4 }}>
              Supports PDF, PNG, JPG up to 10 MB
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              border: '1px solid var(--line)',
              borderRadius: 11,
              background: 'var(--panel)',
            }}
          >
            <span style={{ fontSize: 24 }}>📄</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {file.name}
              </div>
              <div className="hint">{formatFileSize(file.size)}</div>
            </div>
            <button
              type="button"
              className="btn ghost sm"
              onClick={removeFile}
              disabled={saving}
              style={{ flexShrink: 0, padding: '4px 8px', fontSize: 12 }}
              aria-label="Remove selected file"
            >
              ✕ Remove
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 14,
          padding: '10px 12px',
          borderRadius: 9,
          background: 'var(--panel)',
          border: '1px solid var(--line2)',
          fontSize: 11.5,
          color: 'var(--muted2)',
          lineHeight: 1.45,
        }}
      >
        🔒 <b>Privacy Notice:</b> Identity and onboarding paperwork is encrypted and strictly accessible only to you and authorized HR administrators.
      </div>
    </Modal>
  )
}
