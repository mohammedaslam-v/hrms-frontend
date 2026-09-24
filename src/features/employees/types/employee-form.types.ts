export type WorkMode = 'WFH' | 'WFO' | 'Hybrid'
export type HrmsRole = 'employee' | 'admin'

export interface ManagerOption {
  id: number
  name: string
  employeeCode: string
  department: string | null
  designation: string | null
}

export interface EmployeeMetaDto {
  departments: string[]
  managers: ManagerOption[]
  workStates: string[]
  workModes: string[]
  esopVestingOptions: string[]
}

export interface CreateEmployeeRequestDto {
  fullName: string
  title?: string
  department?: string
  managerId?: number | null
  dateOfJoining: string
  dateOfLeaving?: string | null
  dateOfBirth?: string | null
  workEmail: string
  phone?: string | null
  pan?: string | null
  uan?: string | null
  workState?: string
  openingLeave?: number
  employmentType?: string
  hrmsRole?: HrmsRole

  ctc: number
  variablePay?: number
  bonus?: number
  esopUnits?: number
  esopVesting?: string

  workMode?: WorkMode
  shiftStart?: string
  shiftEnd?: string
  weeklyOff?: string[]
}

export interface CreateEmployeeResponseDto {
  employeeId: number
  adminId: number
  employeeCode: string
  fullName: string
  workEmail: string
  temporaryPassword: string
}

export interface EmployeeFormState {
  fullName: string
  title: string
  department: string
  managerId: string
  dateOfJoining: string
  dateOfLeaving: string
  dateOfBirth: string
  workEmail: string
  phone: string
  pan: string
  uan: string
  workState: string
  openingLeave: number

  ctc: number
  variablePay: number
  bonus: number
  esopUnits: number
  esopVesting: string
  payCycle: string

  workMode: WorkMode
  shiftStart: string
  shiftEnd: string
  workingDays: string[]
}
