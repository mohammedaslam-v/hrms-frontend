const BASE_URL = '/api/v1'

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  message?: string
}

export class ApiRequestError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
  }
}

/**
 * The access token is held in memory only — never localStorage, which any XSS
 * could read. The refresh token lives in an httpOnly cookie the page cannot see,
 * so a reload restores the session by calling /auth/refresh.
 */
let accessToken: string | null = null

export const setAccessToken = (token: string | null): void => {
  accessToken = token
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include', // carries the httpOnly refresh cookie
    })
  } catch {
    throw new ApiRequestError(0, 'Cannot reach the HRMS API. Is the backend running?')
  }

  if (response.status === 204) {
    return undefined as T
  }

  const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | null
  if (!response.ok || !body?.success) {
    throw new ApiRequestError(
      response.status,
      body?.message ?? `Request failed with status ${response.status}`,
    )
  }
  return body.data as T
}
