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

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
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
