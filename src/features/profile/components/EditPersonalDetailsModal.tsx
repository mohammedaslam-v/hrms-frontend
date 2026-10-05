import { useEffect, useRef, useState, type CSSProperties } from 'react'
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

  const selectedManager = managers.find((m) => String(m.id) === value)
  const displayLabel = selectedManager
    ? `${selectedManager.name} (${selectedManager.employeeCode})${
        selectedManager.department ? ` · ${selectedManager.department}` : ''
      }`
    : value
      ? fallbackName || `Manager #${value}`
      : 'None / Self'

  const q = searchTerm.toLowerCase().trim()
  const filteredManagers = managers.filter((m) => {
    if (!q) return true
    const matchName = m.name.toLowerCase().includes(q)
    const matchCode = m.employeeCode.toLowerCase().includes(q)
    const matchDept = m.department?.toLowerCase().includes(q)
    return matchName || matchCode || matchDept
  })

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

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 40)
    } else {
      setSearchTerm('')
    }
  }, [isOpen])

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        id="empManager"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          height: 34,
          padding: '5px 10px',
          borderRadius: 8,
          border: isOpen ? '1px solid var(--blue)' : '1px solid var(--line)',
          boxShadow: isOpen ? '0 0 0 2.5px rgba(37, 99, 235, 0.12)' : 'none',
          fontSize: 12.5,
          fontFamily: 'Inter, sans-serif',
          backgroundColor: '#ffffff',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          textAlign: 'left',
          color: value ? 'var(--ink)' : 'var(--muted2)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginRight: 6,
            fontWeight: value ? 500 : 400,
          }}
        >
          {loading ? 'Loading managers…' : displayLabel}
        </span>
        <span
          style={{
            fontSize: 10,
            color: 'var(--muted2)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
            flexShrink: 0,
          }}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            border: '1px solid var(--line)',
            borderRadius: 8,
            boxShadow: '0 10px 25px -4px rgba(24, 19, 13, 0.18)',
            zIndex: 10000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '6px 8px',
              borderBottom: '1px solid var(--line2)',
              backgroundColor: 'var(--panel)',
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 8,
                  fontSize: 11,
                  color: 'var(--muted2)',
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
                  if (e.key === 'Escape') {
                    e.stopPropagation()
                    setIsOpen(false)
                  }
                }}
                style={{
                  width: '100%',
                  height: 28,
                  padding: '4px 8px 4px 26px',
                  borderRadius: 6,
                  border: '1px solid var(--line)',
                  fontSize: 11.5,
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box',
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: 6,
                    background: 'none',
                    border: 'none',
                    fontSize: 12,
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div
            style={{
              maxHeight: 180,
              overflowY: 'auto',
              padding: '3px 0',
              scrollbarWidth: 'thin',
            }}
          >
            <div
              onClick={() => {
                onChange('')
                setIsOpen(false)
              }}
              style={{
                padding: '6px 10px',
                fontSize: 12,
                cursor: 'pointer',
                backgroundColor: !value ? 'var(--blue-soft)' : 'transparent',
                color: !value ? 'var(--blue)' : 'var(--ink2)',
                fontWeight: !value ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                if (value) e.currentTarget.style.backgroundColor = 'var(--panel)'
              }}
              onMouseLeave={(e) => {
                if (value) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <span>None / Self (No manager)</span>
              {!value && <span style={{ fontSize: 11 }}>✓</span>}
            </div>

            {filteredManagers.map((m) => {
              const isSelected = String(m.id) === value
              return (
                <div
                  key={m.id}
                  onClick={() => {
                    onChange(String(m.id))
                    setIsOpen(false)
                  }}
                  style={{
                    padding: '6px 10px',
                    fontSize: 12,
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--blue-soft)' : 'transparent',
                    color: isSelected ? 'var(--blue)' : 'var(--ink)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 6,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--panel)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: isSelected ? 600 : 500 }}>{m.name}</span>
                    <span style={{ color: 'var(--muted2)', fontSize: 11, marginLeft: 5 }}>
                      ({m.employeeCode})
                    </span>
                    {m.department && (
                      <span style={{ color: 'var(--muted)', fontSize: 10.5, marginLeft: 4 }}>
                        · {m.department}
                      </span>
                    )}
                  </div>
                  {isSelected && <span style={{ fontSize: 11, color: 'var(--blue)' }}>✓</span>}
                </div>
              )
            })}

            {filteredManagers.length === 0 && (
              <div
                style={{
                  padding: '12px 10px',
                  textAlign: 'center',
                  fontSize: 11.5,
                  color: 'var(--muted)',
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

interface SearchableStateSelectProps {
  value: string
  onChange: (val: string) => void
  options: string[]
}

function SearchableStateSelect({
  value,
  onChange,
  options,
}: SearchableStateSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const q = searchTerm.toLowerCase().trim()
  const filteredOptions = options.filter((opt) => !q || opt.toLowerCase().includes(q))

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

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 40)
    } else {
      setSearchTerm('')
    }
  }, [isOpen])

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        id="empLocation"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          height: 34,
          padding: '5px 10px',
          borderRadius: 8,
          border: isOpen ? '1px solid var(--blue)' : '1px solid var(--line)',
          boxShadow: isOpen ? '0 0 0 2.5px rgba(37, 99, 235, 0.12)' : 'none',
          fontSize: 12.5,
          fontFamily: 'Inter, sans-serif',
          backgroundColor: '#ffffff',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          textAlign: 'left',
          color: value ? 'var(--ink)' : 'var(--muted2)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginRight: 6,
            fontWeight: value ? 500 : 400,
          }}
        >
          {value || 'Select location'}
        </span>
        <span
          style={{
            fontSize: 10,
            color: 'var(--muted2)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
            flexShrink: 0,
          }}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            border: '1px solid var(--line)',
            borderRadius: 8,
            boxShadow: '0 10px 25px -4px rgba(24, 19, 13, 0.18)',
            zIndex: 10000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '6px 8px',
              borderBottom: '1px solid var(--line2)',
              backgroundColor: 'var(--panel)',
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 8,
                  fontSize: 11,
                  color: 'var(--muted2)',
                  pointerEvents: 'none',
                }}
              >
                🔍
              </span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search state or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.stopPropagation()
                    setIsOpen(false)
                  }
                }}
                style={{
                  width: '100%',
                  height: 28,
                  padding: '4px 8px 4px 26px',
                  borderRadius: 6,
                  border: '1px solid var(--line)',
                  fontSize: 11.5,
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box',
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: 6,
                    background: 'none',
                    border: 'none',
                    fontSize: 12,
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div
            style={{
              maxHeight: 180,
              overflowY: 'auto',
              padding: '3px 0',
              scrollbarWidth: 'thin',
            }}
          >
            {filteredOptions.map((opt) => {
              const isSelected = opt === value
              return (
                <div
                  key={opt}
                  onClick={() => {
                    onChange(opt)
                    setIsOpen(false)
                  }}
                  style={{
                    padding: '6px 10px',
                    fontSize: 12,
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--blue-soft)' : 'transparent',
                    color: isSelected ? 'var(--blue)' : 'var(--ink2)',
                    fontWeight: isSelected ? 600 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'var(--panel)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <span>{opt}</span>
                  {isSelected && <span style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 700 }}>✓</span>}
                </div>
              )
            })}

            {filteredOptions.length === 0 && (
              <div
                style={{
                  padding: '12px 10px',
                  fontSize: 11.5,
                  textAlign: 'center',
                  color: 'var(--muted)',
                }}
              >
                No locations found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Remote / Other',
]

const DAYS_OF_WEEK = [
  { key: 'Mon', label: 'Mon' },
  { key: 'Tue', label: 'Tue' },
  { key: 'Wed', label: 'Wed' },
  { key: 'Thu', label: 'Thu' },
  { key: 'Fri', label: 'Fri' },
  { key: 'Sat', label: 'Sat' },
  { key: 'Sun', label: 'Sun' },
]

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

  // Basic Personal & Contact Details
  const [email, setEmail] = useState<string>(employee.workEmail || '')
  const [mobile, setMobile] = useState<string>(employee.mobile || '')

  const initialDob = employee.dateOfBirth
    ? employee.dateOfBirth.length === 10
      ? employee.dateOfBirth
      : new Date(employee.dateOfBirth).toISOString().slice(0, 10)
    : ''
  const [dateOfBirth, setDateOfBirth] = useState<string>(initialDob)

  const initialPan =
    employee.panNumber ||
    employee.documents.find((d) => d.key === 'pan')?.docNumber ||
    ''
  const [pan, setPan] = useState<string>(initialPan)

  const initialAadhar =
    employee.aadharNumber ||
    employee.documents.find((d) => d.key === 'aadhaar')?.docNumber ||
    ''
  const [aadhar, setAadhar] = useState<string>(initialAadhar)

  const [selectedLocation, setSelectedLocation] = useState<string>(() => {
    const loc = employee.workState || 'Karnataka'
    if (loc === 'Other' || loc === 'Remote / Other') return 'Remote / Other'
    return INDIAN_STATES.includes(loc) ? loc : 'Remote / Other'
  })
  const [customLocation, setCustomLocation] = useState<string>(() => {
    const loc = employee.workState || ''
    if (loc === 'Other' || loc === 'Remote / Other') return ''
    return INDIAN_STATES.includes(loc) ? '' : loc
  })

  // Admin: Role, Shift & Organization
  const [role, setRole] = useState<'employee' | 'manager' | 'admin'>(() => {
    if (employee.hrmsRole === 'admin') return 'admin'
    if (employee.role === 'manager') return 'manager'
    return 'employee'
  })
  const [shiftStart, setShiftStart] = useState<string>(employee.shiftStart?.slice(0, 5) || '10:00')
  const [shiftEnd, setShiftEnd] = useState<string>(employee.shiftEnd?.slice(0, 5) || '19:00')
  const [weeklyOff, setWeeklyOff] = useState<string[]>(employee.weeklyOff || ['Sun'])

  const initialDoj = employee.dateOfJoining
    ? employee.dateOfJoining.length === 10
      ? employee.dateOfJoining
      : new Date(employee.dateOfJoining).toISOString().slice(0, 10)
    : ''
  const [dateOfJoining, setDateOfJoining] = useState<string>(initialDoj)

  const [leaveBalance, setLeaveBalance] = useState<string>(
    employee.leaveBalance !== undefined ? String(employee.leaveBalance) : '0',
  )
  const [managerId, setManagerId] = useState<string>(
    employee.managerId ? String(employee.managerId) : '',
  )

  // Admin: Bank & Statutory Details
  const initialConfDate = employee.confirmationDate
    ? employee.confirmationDate.length === 10
      ? employee.confirmationDate
      : new Date(employee.confirmationDate).toISOString().slice(0, 10)
    : ''
  const [confirmationDate, setConfirmationDate] = useState<string>(initialConfDate)

  const initialExitDate = employee.dateOfLeaving
    ? employee.dateOfLeaving.length === 10
      ? employee.dateOfLeaving
      : new Date(employee.dateOfLeaving).toISOString().slice(0, 10)
    : ''
  const [dateOfLeaving, setDateOfLeaving] = useState<string>(initialExitDate)

  const [bankName, setBankName] = useState<string>(employee.bankName || '')
  const [accountNo, setAccountNo] = useState<string>(employee.accountNo || '')
  const [ifscCode, setIfscCode] = useState<string>(employee.ifscCode || '')
  const [uan, setUan] = useState<string>(employee.uan || '')
  const [pfNumber, setPfNumber] = useState<string>(employee.pfNumber || '')

  // Emergency contact. Personal details, so editable by the employee themselves
  // and not gated behind isAdmin like the employment fields below.
  const [emergencyContactName, setEmergencyContactName] =
    useState<string>(employee.emergencyContactName || '')
  const [emergencyContactNumber, setEmergencyContactNumber] =
    useState<string>(employee.emergencyMobile || '')
  const [emergencyContactRelation, setEmergencyContactRelation] =
    useState<string>(employee.emergencyContactRelation || '')

  // Manager List for searchable dropdown
  const [managers, setManagers] = useState<ManagerOption[]>([])
  const [loadingManagers, setLoadingManagers] = useState<boolean>(false)

  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin) return
    let active = true
    setLoadingManagers(true)
    employeeFormApi
      .fetchMeta()
      .then((meta) => {
        if (active && meta?.managers) {
          const filtered = meta.managers.filter((m) => m.id !== employee.employeeId)
          setManagers(filtered)
        }
      })
      .catch((err: unknown) => {
        console.warn('Could not load manager options for selector:', err)
      })
      .finally(() => {
        if (active) setLoadingManagers(false)
      })
    return () => {
      active = false
    }
  }, [isAdmin, employee.employeeId])

  const toggleDay = (day: string) => {
    setWeeklyOff((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    )
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanEmail = email.trim()
    if (!cleanEmail) {
      setError('Work email is required.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid work email address.')
      return
    }

    const cleanMobile = mobile.trim().replace(/\D/g, '')
    if (mobile.trim() && cleanMobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number.')
      return
    }

    const cleanPan = pan.trim().toUpperCase()
    if (cleanPan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
      setError('PAN must be 10 characters in standard format (e.g. ABCDE1234F).')
      return
    }

    const cleanAadhar = aadhar.trim().replace(/\s+/g, '')
    if (cleanAadhar && !/^\d{12}$/.test(cleanAadhar)) {
      setError('Aadhaar number must be exactly 12 numeric digits.')
      return
    }

    const isOtherLocation = selectedLocation === 'Other' || selectedLocation === 'Remote / Other'
    const finalLocation = isOtherLocation ? customLocation.trim() : selectedLocation
    if (!finalLocation) {
      setError('Work location is required.')
      return
    }

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
      if (ifscCode.trim() && ifscCode.trim().length < 4) {
        setError('Please enter a valid IFSC code.')
        return
      }
    }

    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        email: cleanEmail,
        mobile: cleanMobile || null,
        dateOfBirth: dateOfBirth || null,
        pan: cleanPan || null,
        aadhar: cleanAadhar || null,
        workLocation: finalLocation || null,
        emergencyContactName: emergencyContactName.trim() || null,
        emergencyContactNumber: emergencyContactNumber.trim() || null,
        emergencyContactRelation: emergencyContactRelation.trim() || null,
      }

      if (isAdmin) {
        payload.role = role
        payload.managerId = managerId ? Number(managerId) : null
        payload.shiftStart = shiftStart
        payload.shiftEnd = shiftEnd
        payload.weeklyOff = weeklyOff
        payload.dateOfJoining = dateOfJoining
        payload.leaveBalance = Number(leaveBalance)
        payload.confirmationDate = confirmationDate ? confirmationDate.slice(0, 10) : null
        payload.dateOfLeaving = dateOfLeaving ? dateOfLeaving.slice(0, 10) : null
        payload.bankName = bankName.trim() || null
        payload.accountNo = accountNo.trim() || null
        payload.ifscCode = ifscCode.trim() ? ifscCode.trim().toUpperCase() : null
        payload.uan = uan.trim() || null
        payload.pfNumber = pfNumber.trim() || null
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

  // Consistent input styling adhering strictly to the portal's design system
  const inputStyle: CSSProperties = {
    width: '100%',
    height: 34,
    padding: '5px 10px',
    borderRadius: 8,
    border: '1px solid var(--line)',
    fontSize: 12.5,
    fontFamily: 'Inter, sans-serif',
    color: 'var(--ink)',
    backgroundColor: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }

  const labelStyle: CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--ink2)',
    marginBottom: 4,
    letterSpacing: '0.01em',
  }

  const sectionHeaderStyle: CSSProperties = {
    gridColumn: '1 / -1',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: 'var(--blue)',
    borderBottom: '1px solid var(--line2)',
    paddingBottom: 5,
    marginTop: 6,
  }

  return (
    <div
      className="modal on"
      style={{
        zIndex: 90,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose()
      }}
    >
      <div
        className="box"
        style={{
          maxWidth: isAdmin ? 600 : 520,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '88vh',
          borderRadius: 16,
          boxShadow: '0 24px 60px rgba(24, 19, 13, 0.22)',
          border: '1px solid var(--line)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--line2)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            backgroundColor: '#ffffff',
            flexShrink: 0,
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--ink)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>{isAdmin ? '👤 Edit Employee Details' : '👤 Edit Personal Details'}</span>
            </h3>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 11.5,
                color: 'var(--muted2)',
              }}
            >
              {isAdmin
                ? `Admin edit for ${employee.fullName} (${employee.employeeCode})`
                : 'Update your contact and identification details'}
            </p>
          </div>
          <button
            type="button"
            className="x"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: '1px solid var(--line)',
              background: '#fff',
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--muted2)',
              fontSize: 12,
              flexShrink: 0,
            }}
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
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '14px 18px',
              scrollbarWidth: 'thin',
            }}
          >
            {error && (
              <div
                className="notice bad"
                style={{
                  marginBottom: 12,
                  fontSize: 12,
                  padding: '8px 12px',
                  borderRadius: 8,
                }}
                role="alert"
              >
                ⚠️ {error}
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px 12px',
              }}
            >
              {/* SECTION 1: Personal & Contact Details */}
              <div style={sectionHeaderStyle}>
                <span>Basic Details &amp; Contact</span>
              </div>

              {/* Work Email */}
              <div className="f">
                <label htmlFor="empEmail" style={labelStyle}>
                  Work email *
                </label>
                <input
                  id="empEmail"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>

              {/* Phone / Mobile */}
              <div className="f">
                <label htmlFor="empMobile" style={labelStyle}>
                  Mobile number
                </label>
                <input
                  id="empMobile"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Date of Birth */}
              <div className="f">
                <label htmlFor="empDob" style={labelStyle}>
                  Date of birth
                </label>
                <input
                  id="empDob"
                  type="date"
                  max={todayStr}
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Work Location */}
              <div className="f">
                <label htmlFor="empLocation" style={labelStyle}>
                  Work location
                </label>
                <SearchableStateSelect
                  value={selectedLocation}
                  onChange={(val) => setSelectedLocation(val)}
                  options={INDIAN_STATES}
                />
              </div>

              {(selectedLocation === 'Other' || selectedLocation === 'Remote / Other') && (
                <div className="f" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="customLocation" style={labelStyle}>
                    Specify location *
                  </label>
                  <input
                    id="customLocation"
                    type="text"
                    placeholder="Enter state or city"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>
              )}

              {/* PAN Number */}
              <div className="f">
                <label htmlFor="empPan" style={labelStyle}>
                  PAN number
                </label>
                <input
                  id="empPan"
                  type="text"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  style={{ ...inputStyle, textTransform: 'uppercase' }}
                />
              </div>

              {/* Aadhaar Number */}
              <div className="f">
                <label htmlFor="empAadhaar" style={labelStyle}>
                  Aadhaar number
                </label>
                <input
                  id="empAadhaar"
                  type="text"
                  placeholder="1234 5678 9012"
                  maxLength={14}
                  value={aadhar}
                  onChange={(e) => setAadhar(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Emergency contact. Not behind isAdmin — this is the employee's
                  own information, like their mobile number above. */}
              <div style={sectionHeaderStyle}>
                <span>Emergency Contact</span>
              </div>

              <div className="f">
                <label htmlFor="empEmgName" style={labelStyle}>
                  Contact name
                </label>
                <input
                  id="empEmgName"
                  type="text"
                  placeholder="e.g. Sunita Sharma"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div className="f">
                <label htmlFor="empEmgNumber" style={labelStyle}>
                  Contact number
                </label>
                <input
                  id="empEmgNumber"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={emergencyContactNumber}
                  onChange={(e) => setEmergencyContactNumber(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div className="f">
                <label htmlFor="empEmgRelation" style={labelStyle}>
                  Relationship
                </label>
                {/* Free text, with suggestions. A fixed list would be wrong for
                    somebody whose emergency contact is a guardian or a friend. */}
                <input
                  id="empEmgRelation"
                  type="text"
                  list="emgRelationOptions"
                  placeholder="e.g. Mother, Husband, Brother"
                  value={emergencyContactRelation}
                  onChange={(e) => setEmergencyContactRelation(e.target.value)}
                  style={inputStyle}
                />
                <datalist id="emgRelationOptions">
                  <option value="Mother" />
                  <option value="Father" />
                  <option value="Husband" />
                  <option value="Wife" />
                  <option value="Brother" />
                  <option value="Sister" />
                  <option value="Son" />
                  <option value="Daughter" />
                  <option value="Guardian" />
                  <option value="Friend" />
                </datalist>
              </div>

              {/* SECTION 2: Role, Shift & Organization (Admin only) */}
              {isAdmin && (
                <>
                  <div style={sectionHeaderStyle}>
                    <span>⚙️ Role, Shift &amp; Organization</span>
                  </div>

                  {/* HRMS Role */}
                  <div className="f">
                    <label htmlFor="empRole" style={labelStyle}>
                      HRMS role *
                    </label>
                    <select
                      id="empRole"
                      value={role}
                      onChange={(e) =>
                        setRole(e.target.value as 'employee' | 'manager' | 'admin')
                      }
                      style={inputStyle}
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {/* Reporting Manager */}
                  <div className="f">
                    <label htmlFor="empManager" style={labelStyle}>
                      Reporting manager
                    </label>
                    <SearchableManagerSelect
                      value={managerId}
                      onChange={setManagerId}
                      managers={managers}
                      fallbackName={employee.managerName}
                      loading={loadingManagers}
                    />
                  </div>

                  {/* Shift Start Time */}
                  <div className="f">
                    <label htmlFor="shiftStart" style={labelStyle}>
                      Shift start
                    </label>
                    <input
                      id="shiftStart"
                      type="time"
                      value={shiftStart}
                      onChange={(e) => setShiftStart(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  {/* Shift End Time */}
                  <div className="f">
                    <label htmlFor="shiftEnd" style={labelStyle}>
                      Shift end
                    </label>
                    <input
                      id="shiftEnd"
                      type="time"
                      value={shiftEnd}
                      onChange={(e) => setShiftEnd(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  {/* Weekly Off Days */}
                  <div className="f" style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Weekly off days *</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {DAYS_OF_WEEK.map((day) => {
                        const active = weeklyOff.includes(day.key)
                        return (
                          <button
                            key={day.key}
                            type="button"
                            onClick={() => toggleDay(day.key)}
                            style={{
                              padding: '4px 9px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: active ? 600 : 500,
                              cursor: 'pointer',
                              border: active ? '1px solid var(--blue)' : '1px solid var(--line)',
                              backgroundColor: active ? 'var(--blue)' : 'var(--panel)',
                              color: active ? '#ffffff' : 'var(--ink2)',
                              transition: 'all 0.12s ease',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                          >
                            <span>{day.label}</span>
                            {active && <span style={{ fontSize: 10 }}>✓</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Date of Joining */}
                  <div className="f">
                    <label htmlFor="empDoj" style={labelStyle}>
                      Date of joining *
                    </label>
                    <input
                      id="empDoj"
                      type="date"
                      value={dateOfJoining}
                      onChange={(e) => setDateOfJoining(e.target.value)}
                      required
                      style={inputStyle}
                    />
                  </div>

                  {/* Leave Balance */}
                  <div className="f">
                    <label htmlFor="leaveBalance" style={labelStyle}>
                      Leave balance (days)
                    </label>
                    <input
                      id="leaveBalance"
                      type="number"
                      step="0.5"
                      min="0"
                      value={leaveBalance}
                      onChange={(e) => setLeaveBalance(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  {/* SECTION 3: Bank & Statutory Details (Admin only) */}
                  <div style={sectionHeaderStyle}>
                    <span>🏦 Statutory &amp; Bank Details</span>
                  </div>

                  {/* Bank Name */}
                  <div className="f">
                    <label htmlFor="bankName" style={labelStyle}>
                      Bank name
                    </label>
                    <input
                      id="bankName"
                      type="text"
                      placeholder="e.g. HDFC Bank, ICICI Bank"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      maxLength={128}
                      style={inputStyle}
                    />
                  </div>

                  {/* Account Number */}
                  <div className="f">
                    <label htmlFor="accountNo" style={labelStyle}>
                      Account number
                    </label>
                    <input
                      id="accountNo"
                      type="text"
                      placeholder="e.g. 50100234567890"
                      value={accountNo}
                      onChange={(e) => setAccountNo(e.target.value)}
                      maxLength={40}
                      style={inputStyle}
                    />
                  </div>

                  {/* IFSC Code */}
                  <div className="f">
                    <label htmlFor="ifscCode" style={labelStyle}>
                      IFSC code
                    </label>
                    <input
                      id="ifscCode"
                      type="text"
                      placeholder="e.g. HDFC0001234"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      maxLength={20}
                      style={{ ...inputStyle, textTransform: 'uppercase' }}
                    />
                  </div>

                  {/* Confirmation Date */}
                  <div className="f">
                    <label htmlFor="confirmationDate" style={labelStyle}>
                      Confirmation date
                    </label>
                    <input
                      id="confirmationDate"
                      type="date"
                      value={confirmationDate}
                      onChange={(e) => setConfirmationDate(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  {/* Date of Leaving */}
                  <div className="f">
                    <label htmlFor="dateOfLeaving" style={labelStyle}>
                      Date of leaving
                    </label>
                    <input
                      id="dateOfLeaving"
                      type="date"
                      value={dateOfLeaving}
                      onChange={(e) => setDateOfLeaving(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  {/* UAN Number */}
                  <div className="f">
                    <label htmlFor="uan" style={labelStyle}>
                      UAN number
                    </label>
                    <input
                      id="uan"
                      type="text"
                      placeholder="e.g. 100987654321"
                      value={uan}
                      onChange={(e) => setUan(e.target.value)}
                      maxLength={20}
                      style={inputStyle}
                    />
                  </div>

                  {/* PF Number */}
                  <div className="f" style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="pfNumber" style={labelStyle}>
                      PF number
                    </label>
                    <input
                      id="pfNumber"
                      type="text"
                      placeholder="e.g. MH/BAN/0012345/000/0001234"
                      value={pfNumber}
                      onChange={(e) => setPfNumber(e.target.value)}
                      maxLength={50}
                      style={inputStyle}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Fixed Footer with Actions */}
          <div
            className="mfoot"
            style={{
              padding: '12px 18px',
              borderTop: '1px solid var(--line2)',
              marginTop: 0,
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 8,
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              className="btn ghost sm"
              onClick={onClose}
              disabled={submitting}
              style={{
                height: 32,
                padding: '0 14px',
                fontSize: 12,
                borderRadius: 8,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn primary sm"
              disabled={submitting}
              style={{
                height: 32,
                padding: '0 16px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 8,
                backgroundColor: 'var(--blue)',
                color: '#ffffff',
              }}
            >
              {submitting ? 'Saving changes…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
