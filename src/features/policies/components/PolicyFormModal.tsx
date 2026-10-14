import { useState, type FormEvent } from 'react'
import { policiesApi } from '../policies.api'
import type { CompanyPolicy, PolicyStatus } from '../policies.types'
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

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          maxWidth: 780,
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
                ? 'Update the policy details or publish status below.'
                : 'Define a new policy. Active policies will be visible to all employees.'}
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

            {/* Description (Rich Text Editor) */}
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
                  Supports rich text, headings, lists & links
                </span>
              </div>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Enter the full policy terms, guidelines, objectives, eligibility, and rules..."
                minHeight={260}
              />
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
