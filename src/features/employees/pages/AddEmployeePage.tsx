import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHero } from '../../../shared/ui/PageHero'
import { Toast, type ToastMessage } from '../../../shared/ui/Toast'
import { employeeFormApi } from '../api/employee-form.api'
import { PersonalRoleCard } from '../components/PersonalRoleCard'
import { SalaryStructureCard } from '../components/SalaryStructureCard'
import { WorkScheduleCard } from '../components/WorkScheduleCard'
import type {
  CreateEmployeeRequestDto,
  EmployeeFormState,
  EmployeeMetaDto,
} from '../types/employee-form.types'

const DEFAULT_META: EmployeeMetaDto = {
  departments: ['Tech', 'Marketing', 'Sales', 'Curriculum', 'Operations', 'Leadership', 'People', 'HR'],
  managers: [],
  workStates: ['Karnataka', 'Maharashtra', 'Telangana', 'Delhi', 'Tamil Nadu'],
  workModes: ['WFH', 'WFO', 'Hybrid'],
  esopVestingOptions: ['4 yr · 1 yr cliff', '3 yr · no cliff', 'Custom'],
}

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function AddEmployeePage() {
  const navigate = useNavigate()
  const todayIso = new Date().toISOString().split('T')[0]

  const [meta, setMeta] = useState<EmployeeMetaDto>(DEFAULT_META)
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [emailAutoFilled, setEmailAutoFilled] = useState(true)

  const [form, setForm] = useState<EmployeeFormState>({
    fullName: '',
    title: '',
    department: 'Tech',
    managerId: '',
    dateOfJoining: todayIso,
    dateOfLeaving: '',
    dateOfBirth: '',
    workEmail: '',
    phone: '',
    pan: '',
    uan: '',
    workState: 'Karnataka',
    openingLeave: 0,

    ctc: 900000,
    variablePay: 0,
    bonus: 0,
    esopUnits: 0,
    esopVesting: '4 yr · 1 yr cliff',
    payCycle: 'Monthly',

    workMode: 'WFO',
    shiftStart: '10:00',
    shiftEnd: '19:00',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  })

  useEffect(() => {
    let active = true
    employeeFormApi
      .fetchMeta()
      .then((data) => {
        if (!active) return
        setMeta(data)
        if (data.departments.length > 0) {
          setForm((prev) => ({
            ...prev,
            department: data.departments.includes(prev.department) ? prev.department : data.departments[0],
          }))
        }
      })
      .catch((err) => {
        console.error('Failed to load employee meta:', err)
      })
      .finally(() => {
        if (active) setLoadingMeta(false)
      })

    return () => {
      active = false
    }
  }, [])

  const handleChange = <K extends keyof EmployeeFormState>(
    field: K,
    value: EmployeeFormState[K],
  ) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }

      // Auto-suggest email based on full name if user hasn't typed a custom email
      if (field === 'fullName') {
        const name = String(value).trim()
        if (emailAutoFilled) {
          const parts = name.split(/\s+/).filter(Boolean)
          if (parts.length > 0) {
            const handle = parts[0].toLowerCase()
            next.workEmail = `${handle}@bambinos.live`
          } else {
            next.workEmail = ''
          }
        }
      }

      if (field === 'workEmail') {
        setEmailAutoFilled(false)
      }

      return next
    })
  }

  const handleSubmit = async () => {
    const trimmedName = form.fullName.trim()
    const trimmedEmail = form.workEmail.trim()

    if (!trimmedName) {
      setToast({ text: 'A candidate name is required.', tone: 'bad' })
      return
    }

    if (!form.ctc || form.ctc <= 0) {
      setToast({ text: 'Annual CTC must be a positive number.', tone: 'bad' })
      return
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setToast({ text: 'Please provide a valid work email address.', tone: 'bad' })
      return
    }

    if (!form.dateOfJoining) {
      setToast({ text: 'Date of joining is required.', tone: 'bad' })
      return
    }

    if (form.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(form.pan.trim())) {
      setToast({ text: 'PAN must be 10 alphanumeric characters (e.g. ABCDE1234F).', tone: 'bad' })
      return
    }

    // Weekly off is all days that are NOT selected in workingDays
    const weeklyOff = ALL_DAYS.filter((d) => !form.workingDays.includes(d))

    const payload: CreateEmployeeRequestDto = {
      fullName: trimmedName,
      title: form.title.trim() || 'Associate',
      department: form.department,
      managerId: form.managerId ? Number(form.managerId) : null,
      dateOfJoining: form.dateOfJoining,
      dateOfLeaving: form.dateOfLeaving || null,
      dateOfBirth: form.dateOfBirth || null,
      workEmail: trimmedEmail.toLowerCase(),
      phone: form.phone.trim() || null,
      pan: form.pan ? form.pan.trim().toUpperCase() : null,
      uan: form.uan ? form.uan.trim() : null,
      workState: form.workState,
      openingLeave: form.openingLeave,
      employmentType: 'Full-time',
      hrmsRole: 'employee',

      ctc: form.ctc,
      variablePay: form.variablePay,
      bonus: form.bonus,
      esopUnits: form.esopUnits,
      esopVesting: form.esopVesting,

      workMode: form.workMode,
      shiftStart: form.shiftStart ? `${form.shiftStart}:00` : '10:00:00',
      shiftEnd: form.shiftEnd ? `${form.shiftEnd}:00` : '19:00:00',
      weeklyOff: weeklyOff.length > 0 ? weeklyOff : ['Sun'],
    }

    try {
      setSubmitting(true)
      const res = await employeeFormApi.createEmployee(payload)
      setToast({
        text: `${res.fullName} added — ${res.employeeCode}. Account created in admins. Leave starts accruing at 2 days/month.`,
        tone: 'good',
      })
      setTimeout(() => {
        navigate('/team')
      }, 1500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save employee.'
      setToast({ text: msg, tone: 'bad' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/team')
  }

  return (
    <>
      <PageHero
        navKey="add"
        title="Add employee"
        eyebrow="Onboard a new team member · identity, compensation & work schedule"
      />

      {loadingMeta ? (
        <div className="card" style={{ padding: '36px', textAlign: 'center', color: 'var(--muted2)' }}>
          Loading form configuration…
        </div>
      ) : (
        <section className="view" id="v-add" style={{ display: 'block' }}>
          <div className="grid g2">
            <div className="card">
              <PersonalRoleCard
                form={form}
                meta={meta}
                onChange={handleChange}
              />
              <SalaryStructureCard
                form={form}
                meta={meta}
                onChange={handleChange}
              />
            </div>

            <WorkScheduleCard
              form={form}
              meta={meta}
              submitting={submitting}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>
        </section>
      )}

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  )
}
