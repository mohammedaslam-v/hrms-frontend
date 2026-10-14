import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHero } from '../../../shared/ui/PageHero'
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
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return isoString
  }
}

export function EmployeePoliciesPage() {
  const [policies, setPolicies] = useState<CompanyPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Selected policy for reading modal
  const [viewingPolicy, setViewingPolicy] = useState<CompanyPolicy | null>(null)

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

  // Extract unique categories from published policies
  const categories = useMemo(() => {
    const set = new Set<string>()
    policies.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return Array.from(set).sort()
  }, [policies])

  // Filtered policies (title, content, category, and search query)
  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false
      if (search.trim()) {
        const q = search.toLowerCase().trim()
        const matchTitle = p.title.toLowerCase().includes(q)
        const matchCategory = p.category.toLowerCase().includes(q)
        const matchContent = stripHtml(p.description).toLowerCase().includes(q)
        if (!matchTitle && !matchCategory && !matchContent) return false
      }
      return true
    })
  }, [policies, selectedCategory, search])

  return (
    <div className="page" style={{ paddingBottom: 60 }}>
      {/* Hero Header */}
      <PageHero
        navKey="policies"
        title="Company Policies & Guidelines"
        eyebrow="Official workplace guidelines, codes of conduct, and organizational policies"
      />

      {/* Search & Category Filter Bar */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          marginTop: 16,
          marginBottom: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        {/* Left Side: Search Box */}
        <div style={{ position: 'relative', width: 320, maxWidth: '100%' }}>
          <span
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--muted)',
              fontSize: 14,
              pointerEvents: 'none',
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="Search policies by keyword…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 28px 8px 34px',
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
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right Side: Category Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: selectedCategory === 'all' ? '1px solid #3B49A8' : '1px solid var(--line)',
              background: selectedCategory === 'all' ? '#3B49A8' : 'var(--panel)',
              color: selectedCategory === 'all' ? '#FFFFFF' : 'var(--ink)',
              fontSize: 12.5,
              fontWeight: selectedCategory === 'all' ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            All Policies ({policies.length})
          </button>

          {categories.map((cat) => {
            const count = policies.filter((p) => p.category === cat).length
            const isSelected = selectedCategory === cat

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: isSelected ? '1px solid #3B49A8' : '1px solid var(--line)',
                  background: isSelected ? '#3B49A8' : 'var(--panel)',
                  color: isSelected ? '#FFFFFF' : 'var(--ink)',
                  fontSize: 12.5,
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="notice bad" style={{ marginBottom: 18 }} role="alert">
          {error}
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--muted2)', fontSize: 14 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
          Loading company policies…
        </div>
      ) : filteredPolicies.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: '#FFFFFF',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
          <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
            {search || selectedCategory !== 'all'
              ? 'No policies found matching your search'
              : 'No company policies available'}
          </h4>
          <p
            style={{
              margin: '0 auto',
              fontSize: 13.5,
              color: 'var(--muted2)',
              maxWidth: 420,
              lineHeight: 1.5,
            }}
          >
            {search || selectedCategory !== 'all'
              ? 'Try adjusting your search keyword or selecting a different category filter.'
              : 'Company policies and guidelines published by administration will appear here.'}
          </p>
          {(search || selectedCategory !== 'all') && (
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => {
                setSearch('')
                setSelectedCategory('all')
              }}
              style={{ marginTop: 16 }}
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        /* Cards / Tiles Grid */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20,
          }}
        >
          {filteredPolicies.map((policy) => {
            const plainText = stripHtml(policy.description)

            return (
              <div
                key={policy.id}
                onClick={() => setViewingPolicy(policy)}
                className="policy-tile-card"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setViewingPolicy(policy)
                  }
                }}
                style={{
                  background: 'linear-gradient(145deg, #3747A6 0%, #253386 100%)',
                  borderRadius: 16,
                  padding: '20px 22px',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 180,
                  boxShadow: '0 4px 14px rgba(37, 51, 134, 0.18), 0 1px 3px rgba(0, 0, 0, 0.08)',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  userSelect: 'none',
                }}
              >
                {/* Top Row: Date Pill & Category Tag */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginBottom: 14,
                    }}
                  >
                    {/* Date Pill (Matching the reference design) */}
                    <span
                      style={{
                        background: '#FFFFFF',
                        color: '#1E286F',
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: '4px 12px',
                        borderRadius: 20,
                        letterSpacing: '0.02em',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        display: 'inline-block',
                      }}
                    >
                      {formatDate(policy.updatedAt || policy.createdAt)}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {(policy.description.includes('policy-attachment-card') ||
                        policy.description.includes('/company-policies/files/')) && (
                        <span
                          style={{
                            background: 'rgba(255, 255, 255, 0.22)',
                            border: '1px solid rgba(255, 255, 255, 0.35)',
                            color: '#FFFFFF',
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: 20,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                          title="Contains attached document / handbook"
                        >
                          <span>📎</span>
                          <span>File</span>
                        </span>
                      )}

                      {/* Category Chip */}
                      <span
                        style={{
                          background: 'rgba(255, 255, 255, 0.16)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          color: '#FFFFFF',
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: 20,
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                        }}
                      >
                        {policy.category}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      margin: '0 0 10px',
                      fontSize: 16.5,
                      fontWeight: 700,
                      lineHeight: 1.35,
                      color: '#FFFFFF',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {policy.title}
                  </h3>

                  {/* Excerpt Snippet */}
                  {plainText && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        lineHeight: 1.5,
                        color: 'rgba(255, 255, 255, 0.82)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {plainText}
                    </p>
                  )}
                </div>

                {/* Card Footer: Subtle Read Prompt */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 18,
                    paddingTop: 12,
                    borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.9)',
                  }}
                >
                  <span>Read policy</span>
                  <span className="arrow-icon" style={{ fontSize: 14, transition: 'transform 0.15s ease' }}>
                    →
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detailed View Popup Modal */}
      {viewingPolicy && (
        <PolicyViewModal
          policy={viewingPolicy}
          onClose={() => setViewingPolicy(null)}
        />
      )}

      <style>{`
        .policy-tile-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 24px -4px rgba(37, 51, 134, 0.32), 0 0 1px rgba(255, 255, 255, 0.3) inset !important;
        }
        .policy-tile-card:hover .arrow-icon {
          transform: translateX(4px);
        }
      `}</style>
    </div>
  )
}
