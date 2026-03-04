/**
 * Extract a user-friendly error message from an API error.
 *
 * $fetch (ofetch) wraps H3 errors so the structured payload may live at
 * `error.data.data.error.message` (double-nested) or `error.data.error.message`.
 * The raw `error.message` is typically the HTTP status text ("400 Bad Request")
 * which should never be shown to users.
 */

interface ApiErrorShape {
  data?: {
    data?: { error?: { message?: string } }
    error?: { message?: string }
  }
  message?: string
}

export function getApiErrorMessage(error: ApiErrorShape, fallback: string): string {
  return (
    error?.data?.data?.error?.message
    ?? error?.data?.error?.message
    ?? (isUserFacingMessage(error?.message) ? error.message : null)
    ?? fallback
  )
}

function isUserFacingMessage(msg: unknown): msg is string {
  if (typeof msg !== 'string') return false
  const trimmed = msg.trim()
  if (/^\d{3}\s|:\s*\d{3}\s*$/.test(trimmed)) return false
  if (/^(Bad Request|Internal Server Error|Not Found|Unauthorized|Forbidden|Service Unavailable)$/i.test(trimmed)) return false
  return true
}
