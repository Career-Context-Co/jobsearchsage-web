/**
 * Ordering used by resume preview and exports (PDF/DOCX) so downloads match the UI.
 */

import { monthYearSortKey } from '#shared/utils/monthYearDate'

export function sortWorkExperienceForResumePreview<
  T extends {
    currentPosition?: boolean
    endDate?: string | null | undefined
    startDate?: string | null | undefined
  }
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const dateA = a.currentPosition || !a.endDate ? Infinity : monthYearSortKey(a.endDate)
    const dateB = b.currentPosition || !b.endDate ? Infinity : monthYearSortKey(b.endDate)
    const diff = dateB - dateA
    if (diff !== 0) return diff
    return monthYearSortKey(b.startDate) - monthYearSortKey(a.startDate)
  })
}

export function sortEducationForResumePreview<
  T extends { endDate?: string | null | undefined }
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    return monthYearSortKey(b.endDate) - monthYearSortKey(a.endDate)
  })
}

export function sortCertificationsForResumePreview<
  T extends { issueDate?: string | null | undefined }
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    return monthYearSortKey(b.issueDate) - monthYearSortKey(a.issueDate)
  })
}
