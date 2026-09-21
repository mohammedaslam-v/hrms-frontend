import type {
  DismissEmployeePayload,
  DocumentKey,
  ProfileDocument,
  ProfileView,
  ToggleSalaryPayload,
  UploadDocumentPayload,
} from './profile.types'
import { fetchBlob, getAccessToken, request } from '../../shared/api/client'

export const profileApi = {
  /** Your own page. The server scopes this to the session. */
  getMine: () => request<ProfileView>('/profile/me'),

  /** Someone else's — allowed only for your reporting line, or as an admin. */
  getOne: (employeeId: number) => request<ProfileView>(`/profile/${employeeId}`),

  /** Upload or update a document and/or its document number. */
  uploadDocument: (payload: UploadDocumentPayload, employeeId?: number) => {
    const path = employeeId ? `/profile/${employeeId}/documents` : '/profile/me/documents'
    return request<ProfileDocument>(path, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  /** URL for viewing/opening the document file directly in a new tab. */
  getDocumentDownloadUrl: (key: DocumentKey | string, employeeId?: number): string => {
    const token = getAccessToken()
    const base = employeeId
      ? `/api/v1/profile/${employeeId}/documents/${key}/file`
      : `/api/v1/profile/me/documents/${key}/file`
    return token ? `${base}?token=${encodeURIComponent(token)}` : base
  },

  /** Fetch document file as a raw Blob for in-app preview rendering. */
  fetchDocumentBlob: (key: DocumentKey | string, employeeId?: number): Promise<Blob> => {
    const path = employeeId
      ? `/profile/${employeeId}/documents/${key}/file`
      : `/profile/me/documents/${key}/file`
    return fetchBlob(path)
  },

  /** Download document directly as a file. */
  downloadDocumentFile: async (
    key: DocumentKey | string,
    employeeId?: number,
    fileName?: string,
  ): Promise<void> => {
    const path = employeeId
      ? `/profile/${employeeId}/documents/${key}/file`
      : `/profile/me/documents/${key}/file`
    const blob = await fetchBlob(path)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    if (fileName) link.download = fileName
    else link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  },

  /** Delete/remove document and its associated record. */
  deleteDocument: (key: DocumentKey | string, employeeId?: number) => {
    const path = employeeId
      ? `/profile/${employeeId}/documents/${key}`
      : `/profile/me/documents/${key}`
    return request<{ success: boolean }>(path, {
      method: 'DELETE',
    })
  },

  /** Admin: Toggle employee login (Disable / Enable). */
  toggleLogin: (employeeId: number, disabled: boolean) =>
    request<{ isLoginDisabled: boolean }>(
      `/profile/${employeeId}/toggle-login`,
      {
        method: 'POST',
        body: JSON.stringify({ disabled }),
      },
    ),

  /** Admin: Dismiss employee with exit/resignation form details. */
  dismissEmployee: (employeeId: number, payload: DismissEmployeePayload) =>
    request<unknown>(`/profile/${employeeId}/dismiss`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** Admin: Toggle salary disbursement hold (Stop / Resume). */
  toggleSalary: (employeeId: number, payload: ToggleSalaryPayload) =>
    request<{ isSalaryStopped: boolean }>(
      `/profile/${employeeId}/toggle-salary`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    ),

  /** Admin: Update employee employment type (Full-time vs Contract). */
  updateEmploymentType: (employeeId: number, employmentType: string) =>
    request<{ employmentType: string; isContractor: boolean }>(
      `/profile/${employeeId}/employment-type`,
      {
        method: 'POST',
        body: JSON.stringify({ employmentType }),
      },
    ),

  /** Admin: Soft-delete employee from the directory and regular views. */
  deleteEmployee: (employeeId: number) =>
    request<unknown>(`/profile/${employeeId}`, {
      method: 'DELETE',
    }),
}

