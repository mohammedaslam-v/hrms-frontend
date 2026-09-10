import type {
  CreateEmployeePayload,
  Employee,
  UpdateEmployeePayload,
} from './employee.types'
import { request } from '../../shared/api/client'

export const employeesApi = {
  list: () => request<Employee[]>('/employees'),

  getById: (id: number) => request<Employee>(`/employees/${id}`),

  create: (payload: CreateEmployeePayload) =>
    request<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: UpdateEmployeePayload) =>
    request<Employee>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  remove: (id: number) =>
    request<void>(`/employees/${id}`, { method: 'DELETE' }),
}
