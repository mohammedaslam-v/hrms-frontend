import { request } from '../../../shared/api/client'
import type {
  CreateEmployeeRequestDto,
  CreateEmployeeResponseDto,
  EmployeeMetaDto,
} from '../types/employee-form.types'

export const employeeFormApi = {
  fetchMeta: () => request<EmployeeMetaDto>('/employees/meta'),

  createEmployee: (dto: CreateEmployeeRequestDto) =>
    request<CreateEmployeeResponseDto>('/employees', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
}
