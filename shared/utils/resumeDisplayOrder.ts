/**
 * Ordering used by resume preview and exports (PDF/DOCX) so downloads match the UI.
 */

export function sortWorkExperienceForResumePreview<
  T extends {
    currentPosition?: boolean
    endDate?: string | null | undefined
    startDate?: string | null | undefined
  }
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const dateA = a.currentPosition || !a.endDate ? Infinity : new Date(a.endDate).getTime()
    const dateB = b.currentPosition || !b.endDate ? Infinity : new Date(b.endDate).getTime()
    const diff = dateB - dateA
    if (diff !== 0) return diff
    const startA = a.startDate ? new Date(a.startDate).getTime() : 0
    const startB = b.startDate ? new Date(b.startDate).getTime() : 0
    return startB - startA
  })
}

export function sortEducationForResumePreview<
  T extends { endDate?: string | null | undefined }
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const dateA = a.endDate ? new Date(a.endDate).getTime() : 0
    const dateB = b.endDate ? new Date(b.endDate).getTime() : 0
    return dateB - dateA
  })
}

export function sortCertificationsForResumePreview<
  T extends { issueDate?: string | null | undefined }
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const dateA = a.issueDate ? new Date(a.issueDate).getTime() : 0
    const dateB = b.issueDate ? new Date(b.issueDate).getTime() : 0
    return dateB - dateA
  })
}
