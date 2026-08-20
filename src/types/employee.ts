export type EmployeeStatus = 'active' | 'inactive'

export interface Employee {
  id: number
  employeeCode: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  department: string | null
  designation: string | null
  dateOfJoining: string
  status: EmployeeStatus
  createdAt: string
  updatedAt: string
}

export interface CreateEmployeePayload {
  employeeCode: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  department: string | null
  designation: string | null
  dateOfJoining: string
  status: EmployeeStatus
}

export type UpdateEmployeePayload = Omit<CreateEmployeePayload, 'employeeCode'>
