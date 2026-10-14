import { request } from '../../shared/api/client'
import type {
  CompanyPolicy,
  CreatePolicyPayload,
  PolicyFilterParams,
  UpdatePolicyPayload,
} from './policies.types'

export const policiesApi = {
  list: (params?: PolicyFilterParams): Promise<CompanyPolicy[]> => {
    const q = new URLSearchParams()
    if (params?.search?.trim()) q.set('search', params.search.trim())
    if (params?.status && params.status !== 'all') q.set('status', params.status)
    if (params?.category && params.category !== 'all') q.set('category', params.category)
    const queryString = q.toString()
    return request<CompanyPolicy[]>(`/company-policies${queryString ? `?${queryString}` : ''}`)
  },

  getById: (id: number): Promise<CompanyPolicy> =>
    request<CompanyPolicy>(`/company-policies/${id}`),

  create: (payload: CreatePolicyPayload): Promise<CompanyPolicy> =>
    request<CompanyPolicy>('/company-policies', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: UpdatePolicyPayload): Promise<CompanyPolicy> =>
    request<CompanyPolicy>(`/company-policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  delete: (id: number): Promise<{ success: boolean }> =>
    request<{ success: boolean }>(`/company-policies/${id}`, {
      method: 'DELETE',
    }),

  uploadAttachment: (
    file: File,
  ): Promise<{ url: string; key: string; fileName: string; fileSize: number; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const fileBase64 = reader.result as string
          const res = await request<{
            url: string
            key: string
            fileName: string
            fileSize: number
            mimeType: string
          }>('/company-policies/upload', {
            method: 'POST',
            body: JSON.stringify({
              fileName: file.name,
              fileBase64,
            }),
          })
          resolve(res)
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file.'))
      reader.readAsDataURL(file)
    })
  },
}
