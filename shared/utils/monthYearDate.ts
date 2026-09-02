/**
 * Month-precision date helpers.
 *
 * Profile/resume dates are stored as YYYY-MM-DD (day always 01) but only carry
 * month+year meaning. Never route them through `new Date("YYYY-MM-DD")` — that
 * parses as UTC midnight, and local getters shift the month in non-UTC timezones.
 */

export interface MonthYear {
  year: number
  /** 1-12 */
  month: number
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
] as const

/**
 * Parse a month-precision date string into year + month (1-12).
 * Accepts YYYY-MM-DD, YYYY-MM, MM/YYYY, and M/YYYY.
 */
export function parseMonthYear(value: string | null | undefined): MonthYear | null {
  if (!value || !value.trim()) return null

  const trimmed = value.trim()

  // YYYY-MM-DD
  let match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) {
    const year = parseInt(match[1]!, 10)
    const month = parseInt(match[2]!, 10)
    if (month < 1 || month > 12) return null
    if (year < 1900 || year > 2100) return null
    return { year, month }
  }

  // YYYY-MM (AI extraction format)
  match = trimmed.match(/^(\d{4})-(\d{2})$/)
  if (match) {
    const year = parseInt(match[1]!, 10)
    const month = parseInt(match[2]!, 10)
    if (month < 1 || month > 12) return null
    if (year < 1900 || year > 2100) return null
    return { year, month }
  }

  // M/YYYY or MM/YYYY
  match = trimmed.match(/^(\d{1,2})\/(\d{4})$/)
  if (match) {
    const month = parseInt(match[1]!, 10)
    const year = parseInt(match[2]!, 10)
    if (month < 1 || month > 12) return null
    if (year < 1900 || year > 2100) return null
    return { year, month }
  }

  return null
}

/**
 * Format for masked MM/YYYY inputs (e.g. "02/2026").
 */
export function toMonthYearInput(value: string | null | undefined): string {
  const parsed = parseMonthYear(value)
  if (!parsed) return value?.trim() || ''
  return `${String(parsed.month).padStart(2, '0')}/${parsed.year}`
}

/**
 * Format for API/DB storage as YYYY-MM-01 (e.g. "2026-02-01").
 * Returns null when the value is empty or unparseable.
 */
export function toApiDate(value: string | null | undefined): string | null {
  if (!value || !value.trim()) return null
  const parsed = parseMonthYear(value)
  if (!parsed) return null
  return `${parsed.year}-${String(parsed.month).padStart(2, '0')}-01`
}

/**
 * Format for display labels (e.g. "Feb 2026").
 */
export function toMonthYearLabel(
  value: string | null | undefined,
  fallback: string = ''
): string {
  const parsed = parseMonthYear(value)
  if (!parsed) return value?.trim() || fallback
  return `${MONTH_LABELS[parsed.month - 1]} ${parsed.year}`
}

/**
 * Numeric sort key (year * 12 + month). Higher = more recent.
 * Returns 0 for unparseable/empty values.
 */
export function monthYearSortKey(value: string | null | undefined): number {
  const parsed = parseMonthYear(value)
  if (!parsed) return 0
  return parsed.year * 12 + parsed.month
}
