const BASE_URL = '/api/v1'
const REFRESH_PATH = '/auth/refresh'

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

export const getAccessToken = (): string | null => accessToken

/**
 * One shared refresh, however many requests are waiting on it.
 *
 * The access token lasts fifteen minutes; the refresh cookie lasts a week. When
 * the short one lapses mid-session, every in-flight request fails at once — a
 * page that opens with six parallel calls gets six 401s. Refreshing once per
 * failure would fire six refreshes that race and invalidate each other, so they
 * all await the same promise and then retry.
 *
 * Null again as soon as it settles, so a later 401 starts a fresh one.
 */
let refreshInFlight: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const response = await fetch(`${BASE_URL}${REFRESH_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // the httpOnly refresh cookie
      })
      if (!response.ok) return false

      const body = (await response.json().catch(() => null)) as
        | ApiEnvelope<{ accessToken?: string }>
        | null
      const token = body?.success ? body.data?.accessToken : null
      if (!token) return false

      accessToken = token
      return true
    } catch {
      return false
    } finally {
      refreshInFlight = null
    }
  })()

  return refreshInFlight
}

/**
 * Headers are built per attempt rather than once, so a retry carries the token
 * the refresh just produced instead of the expired one that caused the 401.
 */
function headersFor(extra?: HeadersInit, json = true): Record<string, string> {
  const headers: Record<string, string> = {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(extra as Record<string, string> | undefined),
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }
  return headers
}

/**
 * Sends the request, and on a 401 refreshes once and sends it again.
 *
 * Only once: a second 401 means the refresh cookie is gone too, and retrying
 * past that is a loop, not a recovery. The refresh call itself is excluded for
 * the same reason.
 *
 * `options.body` is re-sent as given. Every caller passes a JSON string, which
 * is safe to send twice — a stream would not be, and would need rebuilding.
 */
async function sendWithRetry(
  path: string,
  options: RequestInit,
  json: boolean,
): Promise<Response> {
  const attempt = (): Promise<Response> =>
    fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: headersFor(options.headers, json),
      credentials: 'include',
    })

  let response: Response
  try {
    response = await attempt()
  } catch {
    throw new ApiRequestError(0, 'Cannot reach the HRMS API. Is the backend running?')
  }

  if (response.status !== 401 || path === REFRESH_PATH) {
    return response
  }

  if (!(await refreshAccessToken())) {
    // The session is genuinely over. Drop the stale token so the next reload
    // starts from signed-out rather than retrying with something expired.
    accessToken = null
    return response
  }

  try {
    return await attempt()
  } catch {
    throw new ApiRequestError(0, 'Cannot reach the HRMS API. Is the backend running?')
  }
}

export async function fetchBlob(path: string): Promise<Blob> {
  const response = await sendWithRetry(path, {}, false)

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiEnvelope<unknown> | null
    throw new ApiRequestError(
      response.status,
      body?.message ?? `Request failed with status ${response.status}`,
    )
  }

  return response.blob()
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await sendWithRetry(path, options, true)

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
