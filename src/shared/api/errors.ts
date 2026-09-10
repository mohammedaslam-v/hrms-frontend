/**
 * The API client throws an `Error` carrying the server's own message, which is
 * written for the person reading it. Anything else that reaches a catch block —
 * a network failure, a thrown string — has no message worth showing, so the
 * caller supplies one that fits the action being attempted.
 */
export const messageOf = (err: unknown, fallback: string): string =>
  err instanceof Error ? err.message : fallback
