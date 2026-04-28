import type { ResumeContent } from '#shared/types/docs'

/**
 * Shared composable for building a resume content snapshot from the user's
 * CareerID profile. All items are marked selected: true so the editor opens
 * pre-populated. Used both on creation (index.vue) and for Sync from Profile.
 */
export function useResumeSnapshot() {
  const careerIDStore = useCareerIDStore()

  function buildSnapshot(): ResumeContent {
    const contact = careerIDStore.contactInfo

    function formatEmploymentType(type: string) {
      const map: Record<string, string> = {
        full_time: 'Full-time', part_time: 'Part-time',
        contract: 'Contract', freelance: 'Freelance', internship: 'Internship'
      }
      return map[type] || type
    }

    function formatLocationType(type: string) {
      const map: Record<string, string> = {
        on_site: 'On-site', remote: 'Remote', hybrid: 'Hybrid'
      }
      return map[type] || type
    }

    return {
      summaries: contact?.summary
        ? [{ id: 'profile-summary', text: contact.summary, enabled: true }]
        : [],
      workExperience: careerIDStore.experience.map(exp => ({
        id: exp.id,
        employer: exp.employer,
        jobTitle: exp.title,
        employmentType: formatEmploymentType(exp.employmentType),
        locationType: exp.locationType === 'remote'
          ? 'Remote'
          : (exp.location || formatLocationType(exp.locationType)),
        startDate: exp.startDate,
        endDate: exp.endDate,
        currentPosition: exp.currentPosition,
        highlights: (exp.highlights || []).map((h, i) => ({
          id: `${exp.id}-h${i}`,
          text: h,
          selected: true
        })),
        selected: true
      })),
      education: careerIDStore.education.map(edu => ({
        id: edu.id,
        institution: edu.institution,
        degree: edu.degreeType,
        areaOfStudy: edu.areaOfStudy || '',
        startDate: edu.startDate,
        endDate: edu.endDate,
        selected: true
      })),
      skills: careerIDStore.profileSkills.map(skill => ({
        id: skill.name,
        name: skill.name,
        group: skill.group || 'Skills',
        selected: true
      })),
      certifications: careerIDStore.certifications.map(cert => ({
        id: cert.id,
        name: cert.name,
        issuer: cert.issuer || '',
        issueDate: cert.issueDate || '',
        selected: true
      }))
    }
  }

  return { buildSnapshot }
}
