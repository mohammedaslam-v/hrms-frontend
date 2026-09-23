import { useState, type ChangeEvent, type FormEvent } from 'react'
import { reimbursementApi } from '../reimbursement.api'
import type { ReimbursementCategory } from '../reimbursement.types'

const CATEGORIES: ReimbursementCategory[] = [
  'Travel & Conveyance',
  'Meals & Food',
  'Client Entertainment',
  'Office & Supplies',
  'Telephone & Internet',
  'Training & Certification',
  'Medical',
  'Other',
]

interface NewReimbursementModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function NewReimbursementModal({
  onClose,
  onSuccess,
}: NewReimbursementModalProps) {
  const [category, setCategory] = useState<ReimbursementCategory>('Travel & Conveyance')
  const [title, setTitle] = useState('')
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [claimAmount, setClaimAmount] = useState('')
  const [description, setDescription] = useState('')
  const [fileBase64, setFileBase64] = useState<string | undefined>(undefined)
  const [fileName, setFileName] = useState<string | undefined>(undefined)
  const [fileSize, setFileSize] = useState<number | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10 MB limit.')
      return
    }

    setError(null)
    setFileName(file.name)
    setFileSize(file.size)

    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl(null)
    }

    const reader = new FileReader()
    reader.onload = () => {
      setFileBase64(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const amountNum = parseFloat(claimAmount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount greater than ₹0.')
      return
    }
    if (!title.trim()) {
      setError('Please provide a claim title or purpose.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await reimbursementApi.createReimbursement({
        category,
        title: title.trim(),
        description: description.trim() || undefined,
        expenseDate,
        claimAmount: amountNum,
        fileBase64,
        fileName,
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit reimbursement.')
    } finally {
      setSubmitting(false)
    }
  }

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
        if (e.target === e.currentTarget && !submitting) onClose()
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 580,
          maxHeight: '92vh',
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
              <b style={{ fontSize: 16, color: 'var(--ink)' }}>Claim Reimbursement</b>
            </div>
            <small style={{ color: 'var(--muted)', fontSize: 12 }}>
              Reimbursed separately from payroll · Requires HR approval
            </small>
          </div>
          <button
            type="button"
            className="btn ghost sm"
            onClick={onClose}
            disabled={submitting}
            style={{ minWidth: 32, padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 6,
                  backgroundColor: 'var(--red-soft, #fef2f2)',
                  color: 'var(--red, #ef4444)',
                  fontSize: 13,
                  fontWeight: 500,
                  border: '1px solid #fecaca',
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink2)', marginBottom: 6 }}>
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ReimbursementCategory)}
                  style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid var(--line2)', padding: '0 10px' }}
                  required
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink2)', marginBottom: 6 }}>
                  Date of Expense *
                </label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid var(--line2)', padding: '0 10px' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink2)', marginBottom: 6 }}>
                Purpose / Claim Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Taxi fare for client meeting at Whitefield"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid var(--line2)', padding: '0 12px' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink2)', marginBottom: 6 }}>
                Claim Amount (₹) *
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--muted)',
                    fontWeight: 700,
                  }}
                >
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="0.00"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(e.target.value)}
                  style={{
                    width: '100%',
                    height: 40,
                    borderRadius: 6,
                    border: '1px solid var(--line2)',
                    paddingLeft: 30,
                    paddingRight: 12,
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink2)', marginBottom: 6 }}>
                Attach Invoice / Receipt / Bill
              </label>
              <div
                style={{
                  border: '2px dashed var(--line2)',
                  borderRadius: 8,
                  padding: '16px 14px',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg, #f8fafc)',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,application/pdf"
                  onChange={handleFileChange}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%',
                  }}
                />
                {fileName ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }}
                      />
                    ) : (
                      <span style={{ fontSize: 24 }}>📄</span>
                    )}
                    <div style={{ textAlign: 'left' }}>
                      <b style={{ fontSize: 13, color: 'var(--ink)' }}>{fileName}</b>
                      {fileSize && (
                        <small style={{ display: 'block', color: 'var(--muted)', fontSize: 11 }}>
                          {(fileSize / 1024).toFixed(1)} KB · Click to replace
                        </small>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>📎</div>
                    <b style={{ fontSize: 13, color: 'var(--ink)' }}>Click or drag receipt file here</b>
                    <small style={{ display: 'block', color: 'var(--muted)', fontSize: 11, marginTop: 2 }}>
                      PNG, JPG or PDF up to 10 MB
                    </small>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink2)', marginBottom: 6 }}>
                Additional Notes / Business Justification (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Provide any context or project details for the approver…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: 6,
                  border: '1px solid var(--line2)',
                  padding: 10,
                  fontSize: 13,
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--line2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10,
              backgroundColor: 'var(--panel)',
            }}
          >
            <button type="button" className="btn ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
