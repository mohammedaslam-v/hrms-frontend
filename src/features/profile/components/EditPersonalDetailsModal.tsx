import { useEffect, useRef, useState } from 'react'
import type { ProfileView } from '../profile.types'
import { profileApi } from '../profile.api'
import { employeeFormApi } from '../../employees/api/employee-form.api'
import type { ManagerOption } from '../../employees/types/employee-form.types'

interface SearchableManagerSelectProps {
  value: string
  onChange: (id: string) => void
  managers: ManagerOption[]
  fallbackName?: string | null
  loading?: boolean
}

function SearchableManagerSelect({
  value,
  onChange,
  managers,
  fallbackName,
  loading,
}: SearchableManagerSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Find currently selected manager
  const selectedManager = managers.find((m) => String(m.id) === value)
  const displayLabel = selectedManager
    ? `${selectedManager.name} (${selectedManager.employeeCode})${
        selectedManager.department ? ` · ${selectedManager.department}` : ''
      }`
    : value
      ? fallbackName || `Manager #${value}`
      : 'None / Self'

  // Filter managers by search term (name, code, department)
  const q = searchTerm.toLowerCase().trim()
  const filteredManagers = managers.filter((m) => {
    if (!q) return true
    const matchName = m.name.toLowerCase().includes(q)
    const matchCode = m.employeeCode.toLowerCase().includes(q)
    const matchDept = m.department?.toLowerCase().includes(q)
    return matchName || matchCode || matchDept
  })

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 40)
    } else {
      setSearchTerm('')
    }
  }, [isOpen])

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger Button */}
      <button
        type="button"
        id="empManager"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: 6,
          border: isOpen ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
          boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : 'none',
          fontSize: 14,
          backgroundColor: '#ffffff',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          textAlign: 'left',
          color: value ? '#1e293b' : '#64748b',
          transition: 'all 0.15s ease',
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginRight: 8,
            fontWeight: value ? 500 : 400,
          }}
        >
          {loading ? 'Loading managers…' : displayLabel}
        </span>
        <span
          style={{
            fontSize: 11,
            color: '#64748b',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.18s ease',
          }}
        >
          ▼
        </span>
      </button>

      {/* Dropdown Popup Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 10000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search Field Header */}
          <div
            style={{
              padding: '8px 10px',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 9,
                  fontSize: 12,
                  color: '#94a3b8',
                  pointerEvents: 'none',
                }}
              >
                🔍
              </span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by name, BAM code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault()
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  padding: '6px 28px 6px 28px',
                  fontSize: 13,
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSearchTerm('')
                    searchInputRef.current?.focus()
                  }}
                  style={{
                    position: 'absolute',
                    right: 8,
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: 13,
                    padding: 2,
                    lineHeight: 1,
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Items List */}
          <div
            style={{
              maxHeight: 220,
              overflowY: 'auto',
              padding: '4px 0',
              scrollbarWidth: 'thin',
            }}
          >
            {/* None / Self Option */}
            {(!q || 'none'.includes(q) || 'self'.includes(q)) && (
              <div
                onClick={() => {
                  onChange('')
                  setIsOpen(false)
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: 13,
                  cursor: 'pointer',
                  backgroundColor: !value ? '#eff6ff' : 'transparent',
                  color: !value ? '#1d4ed8' : '#334155',
                  fontWeight: !value ? 600 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #f1f5f9',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = !value ? '#dbeafe' : '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = !value ? '#eff6ff' : 'transparent')}
              >
                <span>None / Self</span>
                {!value && <span style={{ color: '#2563eb', fontWeight: 600 }}>✓</span>}
              </div>
            )}

            {filteredManagers.length > 0 ? (
              filteredManagers.map((m) => {
                const isSelected = String(m.id) === value
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      onChange(String(m.id))
                      setIsOpen(false)
                    }}
                    style={{
                      padding: '8px 12px',
                      fontSize: 13,
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                      color: isSelected ? '#1d4ed8' : '#334155',
                      fontWeight: isSelected ? 600 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #f8fafc',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isSelected ? '#dbeafe' : '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isSelected ? '#eff6ff' : 'transparent')}
                  >
                    <div>
                      <div>
                        {m.name}{' '}
                        <span style={{ color: '#64748b', fontSize: 12, fontWeight: 400 }}>
                          ({m.employeeCode})
                        </span>
                      </div>
                      {m.department && (
                        <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 1 }}>
                          {m.department}
                        </div>
                      )}
                    </div>
                    {isSelected && <span style={{ color: '#2563eb', fontWeight: 600 }}>✓</span>}
                  </div>
                )
              })
            ) : (
              <div
                style={{
                  padding: '16px 12px',
                  textAlign: 'center',
                  fontSize: 12.5,
                  color: '#94a3b8',
                }}
              >
                No managers found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const STANDARD_LOCATIONS = [
  'Karnataka',
  'Maharashtra',
  'Telangana',
  'Delhi',
  'Tamil Nadu',
  'Uttar Pradesh',
  'Haryana',
  'West Bengal',
  'Gujarat',
  'Kerala',
  'Remote',
]

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface EditPersonalDetailsModalProps {
  employee: ProfileView
  onClose: () => void
  onSuccess: () => void
}

export function EditPersonalDetailsModal({
  employee,
  onClose,
  onSuccess,
}: EditPersonalDetailsModalProps) {
  const isAdmin = employee.access === 'admin'

  const existingPan =
    employee.panNumber ||
    employee.documents.find((d) => d.key === 'pan')?.docNumber ||
    ''

  const existingAadhar =
    employee.aadharNumber ||
    employee.documents.find((d) => d.key === 'aadhaar')?.docNumber ||
    ''

  // Basic Personal & Contact Fields (Both Employee and Admin)
  const [email, setEmail] = useState<string>(employee.workEmail || '')
  const [mobile, setMobile] = useState<string>(employee.mobile || '')
  const [dateOfBirth, setDateOfBirth] = useState<string>(() => {
    if (!employee.dateOfBirth) return ''
    if (/^\d{4}-\d{2}-\d{2}/.test(employee.dateOfBirth)) {
      return employee.dateOfBirth.slice(0, 10)
    }
    const d = new Date(employee.dateOfBirth)
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
    return ''
  })
  const [pan, setPan] = useState<string>(existingPan)
  const [aadhar, setAadhar] = useState<string>(existingAadhar)

  // Work location
  const initialWorkLocation = employee.workState || 'Karnataka'
  const isStandardLoc = STANDARD_LOCATIONS.includes(initialWorkLocation)
  const [selectedLocation, setSelectedLocation] = useState<string>(
    isStandardLoc ? initialWorkLocation : 'custom',
  )
  const [customLocation, setCustomLocation] = useState<string>(
    isStandardLoc ? '' : initialWorkLocation,
  )

  // Admin-Only Fields
  const [role, setRole] = useState<'employee' | 'manager' | 'admin'>(() => {
    if (employee.role) return employee.role
    if (employee.hrmsRole === 'admin') return 'admin'
    return 'employee'
  })
  const [managerId, setManagerId] = useState<string>(
    employee.managerId ? String(employee.managerId) : '',
  )
  const [shiftStart, setShiftStart] = useState<string>(
    employee.shiftStart ? employee.shiftStart.slice(0, 5) : '10:00',
  )
  const [shiftEnd, setShiftEnd] = useState<string>(
    employee.shiftEnd ? employee.shiftEnd.slice(0, 5) : '19:00',
  )
  const [weeklyOff, setWeeklyOff] = useState<string[]>(
    employee.weeklyOff && employee.weeklyOff.length ? employee.weeklyOff : ['Sun'],
  )
  const [dateOfJoining, setDateOfJoining] = useState<string>(() => {
    if (!employee.dateOfJoining) return ''
    return employee.dateOfJoining.slice(0, 10)
  })
  const [leaveBalance, setLeaveBalance] = useState<string>(
    employee.leaveBalance !== undefined ? String(employee.leaveBalance) : '0',
  )

  // Managers list for dropdown
  const [managers, setManagers] = useState<ManagerOption[]>([])
  const [loadingMeta, setLoadingMeta] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load managers when admin
  useEffect(() => {
    if (!isAdmin) return
    let active = true
    setLoadingMeta(true)
    employeeFormApi
      .fetchMeta()
      .then((meta) => {
        if (active && meta?.managers) {
          // Filter out the current employee from the manager list
          setManagers(meta.managers.filter((m) => m.id !== employee.employeeId))
        }
      })
      .catch(() => {
        // Non-blocking fallback
      })
      .finally(() => {
        if (active) setLoadingMeta(false)
      })
    return () => {
      active = false
    }
  }, [isAdmin, employee.employeeId])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [submitting, onClose])

  const maxDob = new Date().toISOString().slice(0, 10)

  // Format Aadhaar with spaces (xxxx xxxx xxxx)
  const handleAadharChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 12)
    const parts = digitsOnly.match(/[\s\S]{1,4}/g) || []
    setAadhar(parts.join(' '))
  }

  const toggleWeeklyOffDay = (day: string) => {
    if (weeklyOff.includes(day)) {
      if (weeklyOff.length === 1) return // Keep at least one day
      setWeeklyOff(weeklyOff.filter((d) => d !== day))
    } else {
      setWeeklyOff([...weeklyOff, day])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanEmail = email.trim()
    const cleanMobile = mobile.trim()
    const cleanDob = dateOfBirth.trim()
    const cleanPan = pan.trim().toUpperCase()
    const cleanAadhar = aadhar.replace(/\s+/g, '').trim()
    const finalLocation = (
      selectedLocation === 'custom' ? customLocation : selectedLocation
    ).trim()

    // Email validation
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid work email address.')
      return
    }

    // PAN validation
    if (cleanPan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
      setError('PAN must be in valid 10-character alphanumeric format (e.g. ABCDE1234F).')
      return
    }

    // Aadhaar validation
    if (cleanAadhar && !/^\d{12}$/.test(cleanAadhar)) {
      setError('Aadhaar number must be exactly 12 numeric digits.')
      return
    }

    // Mobile validation
    if (cleanMobile && cleanMobile.replace(/\D/g, '').length < 10) {
      setError('Mobile number must be at least 10 digits.')
      return
    }

    // DOB validation
    if (cleanDob && cleanDob > maxDob) {
      setError('Date of birth cannot be in the future.')
      return
    }

    // Admin fields validation
    if (isAdmin) {
      if (!dateOfJoining) {
        setError('Date of joining is required.')
        return
      }
      if (weeklyOff.length === 0) {
        setError('Please select at least one weekly off day.')
        return
      }
      const numLeave = Number(leaveBalance)
      if (isNaN(numLeave) || numLeave < 0) {
        setError('Leave balance must be a non-negative number.')
        return
      }
    }

    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        email: cleanEmail,
        mobile: cleanMobile || null,
        dateOfBirth: cleanDob || null,
        pan: cleanPan || null,
        aadhar: cleanAadhar || null,
        workLocation: finalLocation || null,
      }

      if (isAdmin) {
        payload.role = role
        payload.managerId = managerId ? Number(managerId) : null
        payload.shiftStart = shiftStart
        payload.shiftEnd = shiftEnd
        payload.weeklyOff = weeklyOff
        payload.dateOfJoining = dateOfJoining
        payload.leaveBalance = Number(leaveBalance)
      }

      await profileApi.updatePersonalDetails(
        payload,
        employee.isSelf ? undefined : employee.employeeId,
      )

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update personal details.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose()
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 14,
          maxWidth: isAdmin ? 660 : 560,
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          padding: '24px 28px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 18,
            paddingBottom: 14,
            borderBottom: '1px solid #edf2f7',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>👤</span>
              <h2 style={{ fontSize: 19, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                {isAdmin ? 'Edit Employee Details' : 'Edit Personal Details'}
              </h2>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 0 }}>
              {isAdmin
                ? `Full administrative edit for ${employee.fullName} (${employee.employeeCode})`
                : 'Update your personal and statutory identification details'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              color: '#94a3b8',
              cursor: submitting ? 'not-allowed' : 'pointer',
              lineHeight: 1,
              padding: 4,
            }}
            title="Close"
          >
            ×
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* SECTION 1: Personal & Contact */}
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Basic Details &amp; Contact
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Work Email */}
            <div className="f">
              <label
                htmlFor="empEmail"
                style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}
              >
                Work email *
              </label>
              <input
                id="empEmail"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Phone / Mobile */}
            <div className="f">
              <label
                htmlFor="empMobile"
                style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}
              >
                Phone / Mobile number
              </label>
              <input
                id="empMobile"
                type="tel"
                placeholder="e.g. 9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Date of Birth */}
            <div className="f">
              <label
                htmlFor="empDob"
                style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}
              >
                Date of birth
              </label>
              <input
                id="empDob"
                type="date"
                max={maxDob}
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Work Location */}
            <div className="f">
              <label
                htmlFor="empLocation"
                style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}
              >
                Work location
              </label>
              <select
                id="empLocation"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  backgroundColor: '#ffffff',
                }}
              >
                {STANDARD_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
                <option value="custom">Other / Custom location…</option>
              </select>
            </div>
          </div>

          {selectedLocation === 'custom' && (
            <div className="f">
              <input
                type="text"
                placeholder="Enter custom work location or state"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* PAN Card */}
            <div className="f">
              <label
                htmlFor="empPan"
                style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}
              >
                PAN number
              </label>
              <input
                id="empPan"
                type="text"
                placeholder="ABCDE1234F"
                maxLength={10}
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  textTransform: 'uppercase',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace',
                  letterSpacing: '0.05em',
                }}
              />
            </div>

            {/* Aadhaar Number */}
            <div className="f">
              <label
                htmlFor="empAadhar"
                style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}
              >
                Aadhaar number
              </label>
              <input
                id="empAadhar"
                type="text"
                placeholder="1234 5678 9012"
                maxLength={14}
                value={aadhar}
                onChange={(e) => handleAadharChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  fontFamily: 'monospace',
                  letterSpacing: '0.05em',
                }}
              />
            </div>
          </div>

          {/* SECTION 2: ADMIN ONLY (Role, Manager, Shift, Weekly Off, DOJ, Leave Balance) */}
          {isAdmin && (
            <div
              style={{
                marginTop: 10,
                paddingTop: 16,
                borderTop: '1.5px dashed #cbd5e1',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#1d4ed8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                <span>⚙️ Role, Shift &amp; Organization</span>
              </div>

              {/* Role & Manager */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {/* HRMS Role */}
                <div className="f">
                  <label
                    htmlFor="empRole"
                    style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}
                  >
                    HRMS Role *
                  </label>
                  <select
                    id="empRole"
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'employee' | 'manager' | 'admin')}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: 14,
                      backgroundColor: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Reporting Manager */}
                <div className="f">
                  <label
                    htmlFor="empManager"
                    style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}
                  >
                    Reporting manager {loadingMeta && '…'}
                  </label>
                  <SearchableManagerSelect
                    value={managerId}
                    onChange={setManagerId}
                    managers={managers}
                    fallbackName={employee.managerName}
                    loading={loadingMeta}
                  />
                </div>
              </div>

              {/* Shift timings */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="f">
                  <label
                    htmlFor="empShiftStart"
                    style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}
                  >
                    Shift start time
                  </label>
                  <input
                    id="empShiftStart"
                    type="time"
                    value={shiftStart}
                    onChange={(e) => setShiftStart(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div className="f">
                  <label
                    htmlFor="empShiftEnd"
                    style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}
                  >
                    Shift end time
                  </label>
                  <input
                    id="empShiftEnd"
                    type="time"
                    value={shiftEnd}
                    onChange={(e) => setShiftEnd(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Weekly Off Days */}
              <div className="f">
                <label
                  style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}
                >
                  Weekly off days
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = weeklyOff.includes(day)
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWeeklyOffDay(day)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 20,
                          fontSize: 12.5,
                          fontWeight: 500,
                          cursor: 'pointer',
                          border: isSelected ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                          backgroundColor: isSelected ? '#eff6ff' : '#f8fafc',
                          color: isSelected ? '#1d4ed8' : '#64748b',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {day} {isSelected && '✓'}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Date of Joining & Leave Balance */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="f">
                  <label
                    htmlFor="empDoj"
                    style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}
                  >
                    Date of joining *
                  </label>
                  <input
                    id="empDoj"
                    type="date"
                    value={dateOfJoining}
                    onChange={(e) => setDateOfJoining(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div className="f">
                  <label
                    htmlFor="empLeaveBal"
                    style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 6 }}
                  >
                    Leave balance (days)
                  </label>
                  <input
                    id="empLeaveBal"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="e.g. 19.5"
                    value={leaveBalance}
                    onChange={(e) => setLeaveBalance(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 10,
              paddingTop: 16,
              borderTop: '1px solid #f1f5f9',
            }}
          >
            <button
              type="button"
              className="btn ghost"
              onClick={onClose}
              disabled={submitting}
              style={{ padding: '8px 16px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn"
              disabled={submitting}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '8px 20px',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {submitting ? 'Saving…' : 'Save Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
