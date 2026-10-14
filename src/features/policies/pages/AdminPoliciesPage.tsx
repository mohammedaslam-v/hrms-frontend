import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHero } from '../../../shared/ui/PageHero'
import { PolicyDeleteModal } from '../components/PolicyDeleteModal'
import { PolicyFormModal } from '../components/PolicyFormModal'
import { PolicyViewModal } from '../components/PolicyViewModal'
import { policiesApi } from '../policies.api'
import type { CompanyPolicy } from '../policies.types'

const stripHtml = (html: string): string => {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

const formatDate = (isoString: string): string => {
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return isoString
  }
}

export function AdminPoliciesPage() {
  const [policies, setPolicies] = useState<CompanyPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<CompanyPolicy | null>(null)
  const [viewingPolicy, setViewingPolicy] = useState<CompanyPolicy | null>(null)
  const [deletingPolicy, setDeletingPolicy] = useState<CompanyPolicy | null>(null)

  const loadPolicies = useCallback(async () => {
    try {
      setLoading(true)
      const data = await policiesApi.list()
      setPolicies(data)
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load company policies.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void loadPolicies()
  }, [loadPolicies])

  // Extract unique categories for filter dropdown
  const categories = useMemo(() => {
    const set = new Set<string>()
    policies.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return Array.from(set).sort()
  }, [policies])

  // Filtered list
  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase().trim()
        const matchTitle = p.title.toLowerCase().includes(q)
        const matchCategory = p.category.toLowerCase().includes(q)
        const matchContent = stripHtml(p.description).toLowerCase().includes(q)
        if (!matchTitle && !matchCategory && !matchContent) return false
      }
      return true
    })
  }, [policies, statusFilter, categoryFilter, search])

  // Summary counts
  const totalCount = policies.length
  const activeCount = policies.filter((p) => p.status === 'active').length
  const draftCount = policies.filter((p) => p.status === 'draft').length

  return (
    <div className="page">
      {/* Hero Header */}
      <PageHero
        navKey="admin_policies"
        title="Policy Management"
        eyebrow="Create, edit, and publish official workplace policies for the organization"
      />

      {/* Controls Bar: Search Filters (Left) + Add Button (Right Corner) */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          marginTop: 16,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {/* Left Side: Search & Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 auto', minWidth: 260, flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
            <span
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted)',
                fontSize: 13,
                pointerEvents: 'none',
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Search policies by title or content…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 28px 7px 32px',
                borderRadius: 8,
                border: '1px solid var(--line)',
                background: 'var(--panel)',
                fontSize: 13,
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: 'var(--muted)',
                  padding: 2,
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              width: 160,
              padding: '7px 10px',
              borderRadius: 8,
              border: '1px solid var(--line)',
              background: 'var(--panel)',
              fontSize: 13,
              fontFamily: 'inherit',
              color: 'var(--ink)',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status Filter Tabs */}
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              padding: 2,
              gap: 2,
            }}
          >
            {(['all', 'active', 'draft'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: statusFilter === s ? 600 : 500,
                  background: statusFilter === s ? '#FFFFFF' : 'transparent',
                  color: statusFilter === s ? 'var(--ink)' : 'var(--muted2)',
                  boxShadow: statusFilter === s ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {s === 'all'
                  ? `All (${totalCount})`
                  : s === 'active'
                    ? `Active (${activeCount})`
                    : `Draft (${draftCount})`}
              </button>
            ))}
          </div>
        </div>

        {/* Right Corner: Add Policy Button */}
        <div>
          <button
            type="button"
            className="btn primary"
            onClick={() => setIsAddOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
            <span>Add Policy</span>
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="notice bad" style={{ marginBottom: 16 }} role="alert">
          {error}
        </div>
      )}

      {/* Main Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--muted2)', fontSize: 14 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
            Loading policies…
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
            <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>
              {search || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'No matching policies found'
                : 'No company policies added yet'}
            </h4>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--muted2)', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
              {search || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try clearing the search or category filters to see more results.'
                : 'Click “Add Policy” above to write the first policy for your team.'}
            </p>
            {!search && statusFilter === 'all' && categoryFilter === 'all' && (
              <button
                type="button"
                className="btn primary"
                onClick={() => setIsAddOpen(true)}
                style={{ marginTop: 16 }}
              >
                + Add First Policy
              </button>
            )}
          </div>
        ) : (
          <div className="scroll">
            <table style={{ margin: 0, width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: 44, textAlign: 'center' }}>#</th>
                  <th style={{ minWidth: 160, width: '22%' }}>Policy Title</th>
                  <th style={{ width: 140 }}>Category</th>
                  <th style={{ minWidth: 220, width: '38%' }}>Content Preview</th>
                  <th style={{ width: 120, whiteSpace: 'nowrap' }}>Updated</th>
                  <th style={{ width: 100, whiteSpace: 'nowrap' }}>Status</th>
                  <th style={{ width: 170, whiteSpace: 'nowrap', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPolicies.map((p, idx) => {
                  const plainText = stripHtml(p.description)

                  return (
                    <tr key={p.id}>
                      {/* Index */}
                      <td style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
                        {idx + 1}
                      </td>

                      {/* Title */}
                      <td>
                        <div
                          style={{
                            fontWeight: 600,
                            color: 'var(--ink)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                          onClick={() => setViewingPolicy(p)}
                          title="Click to view full policy"
                        >
                          <span style={{ fontSize: 16 }}>📜</span>
                          <span>{p.title}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span className="tag">{p.category}</span>
                      </td>

                      {/* Description Preview (clipped safely to avoid any overlap) */}
                      <td style={{ minWidth: 200, maxWidth: 360 }}>
                        <div
                          style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: 'var(--muted2, #6B7280)',
                            fontSize: 13,
                            maxWidth: '100%',
                          }}
                          title={plainText}
                        >
                          {plainText || '—'}
                        </div>
                      </td>

                      {/* Updated Date */}
                      <td style={{ whiteSpace: 'nowrap', width: 120, color: 'var(--muted2, #78716C)', fontSize: 13 }}>
                        {formatDate(p.updatedAt)}
                      </td>

                      {/* Status */}
                      <td style={{ whiteSpace: 'nowrap', width: 100 }}>
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 600,
                            padding: '3px 9px',
                            borderRadius: 999,
                            display: 'inline-block',
                            background:
                              p.status === 'active'
                                ? '#DCFCE7'
                                : p.status === 'draft'
                                  ? '#FEF3C7'
                                  : '#F3F4F6',
                            color:
                              p.status === 'active'
                                ? '#166534'
                                : p.status === 'draft'
                                  ? '#92400E'
                                  : '#4B5563',
                          }}
                        >
                          {p.status === 'active'
                            ? '● Active'
                            : p.status === 'draft'
                              ? '● Draft'
                              : '● Archived'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ whiteSpace: 'nowrap', width: 170, textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn ghost sm"
                            onClick={() => setViewingPolicy(p)}
                            title="View / Read Policy"
                            style={{ padding: '4px 10px', fontSize: 12 }}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="btn ghost sm"
                            onClick={() => setEditingPolicy(p)}
                            title="Edit Policy"
                            style={{ padding: '4px 10px', fontSize: 12, color: 'var(--blue)' }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn ghost sm"
                            onClick={() => setDeletingPolicy(p)}
                            title="Delete Policy"
                            style={{ padding: '4px 10px', fontSize: 12, color: 'var(--red)' }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Policy Modal */}
      {isAddOpen && (
        <PolicyFormModal
          onClose={() => setIsAddOpen(false)}
          onSuccess={() => void loadPolicies()}
        />
      )}

      {/* Edit Policy Modal */}
      {editingPolicy && (
        <PolicyFormModal
          policy={editingPolicy}
          onClose={() => setEditingPolicy(null)}
          onSuccess={() => void loadPolicies()}
        />
      )}

      {/* View Policy Modal */}
      {viewingPolicy && (
        <PolicyViewModal
          policy={viewingPolicy}
          onClose={() => setViewingPolicy(null)}
          onEdit={(p) => setEditingPolicy(p)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingPolicy && (
        <PolicyDeleteModal
          policy={deletingPolicy}
          onClose={() => setDeletingPolicy(null)}
          onSuccess={() => void loadPolicies()}
        />
      )}
    </div>
  )
}
