<script setup lang="ts">
import {
  sortCertificationsForResumePreview,
  sortEducationForResumePreview,
  sortWorkExperienceForResumePreview
} from '#shared/utils/resumeDisplayOrder'
import { toMonthYearInput } from '#shared/utils/monthYearDate'

interface Props {
  accentColor?: string
  headerStyle?: 'classic' | 'bold' | 'minimal'
  contactInfo?: {
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    phone?: string | null
  }
  linkedInUsername?: string | null
  jobTitle?: string
  selectedContent?: {
    summaries?: Array<{ id: string; text: string; enabled: boolean }>
    workExperience?: Array<{
      id: string | number
      employer: string
      jobTitle: string
      employmentType: string
      locationType: string
      startDate: string | null | undefined
      endDate: string | null | undefined
      currentPosition?: boolean
      highlights: Array<{ id: string, text: string, selected: boolean }>
      selected: boolean
    }>
    education?: Array<{
      id: string | number
      institution: string
      degree: string
      areaOfStudy: string
      startDate: string | null | undefined
      endDate: string | null | undefined
      selected: boolean
    }>
    skills?: Array<{ id: string | number, name: string, group?: string, selected: boolean }>
    certifications?: Array<{
      id: string | number
      name: string
      issuer: string
      issueDate: string
      selected: boolean
    }>
    sectionOrder?: string[]
    sectionLabels?: Record<string, string>
  }
  editingItem?: { type: string, id: string | number | null }
}

const props = withDefaults(defineProps<Props>(), {
  accentColor: '#0d9488',
  headerStyle: 'classic',
  contactInfo: () => ({}),
  linkedInUsername: null,
  jobTitle: '',
  selectedContent: () => ({}),
  editingItem: () => ({ type: '', id: null })
})

// Helper to check if an item is being edited
function isEditing(type: string, id?: string | number | null): boolean {
  if (props.editingItem?.type !== type) return false
  // For items with IDs, check exact match; for single items (summary, skills), just check type
  if (id !== undefined) {
    return props.editingItem?.id === id
  }
  return props.editingItem?.id !== null
}

// Highlight style for editing items
const editingHighlightStyle = {
  outline: '2px solid #4FCC9C',
  outlineOffset: '6px',
  borderRadius: '2px',
  transition: 'outline 0.2s ease-in-out'
}

// Use provided contact info or fallback to placeholders
const displayContact = computed(() => ({
  firstName: props.contactInfo?.firstName || 'First',
  lastName: props.contactInfo?.lastName || 'Last',
  email: props.contactInfo?.email || 'email@example.com',
  phone: props.contactInfo?.phone || '(555) 123-4567',
  linkedIn: props.linkedInUsername || null,
  jobTitle: props.jobTitle || 'Job Title'
}))

/**
 * Format date from YYYY-MM-DD to display format (e.g., "01/2023")
 */
function formatDateForDisplay(dateString: string | null | undefined): string {
  return toMonthYearInput(dateString)
}

function formatDateRange(startDate: string | null | undefined, endDate: string | null | undefined, currentPosition?: boolean) {
  const startFormatted = formatDateForDisplay(startDate) || 'Unknown'
  
  if (currentPosition || !endDate) {
    return `${startFormatted} - Present`
  }
  
  const endFormatted = formatDateForDisplay(endDate)
  return `${startFormatted} - ${endFormatted}`
}

function formatMonthYear(dateStr: string | null | undefined) {
  return formatDateForDisplay(dateStr)
}

// Filter selected items and sort (same order as PDF/DOCX — shared helpers)
const selectedExperiences = computed(() =>
  sortWorkExperienceForResumePreview(
    props.selectedContent.workExperience?.filter(exp => exp.selected) || []
  )
)

const selectedEducation = computed(() =>
  sortEducationForResumePreview(
    props.selectedContent.education?.filter(edu => edu.selected) || []
  )
)

const selectedSkills = computed(() => 
  props.selectedContent.skills?.filter(skill => skill.selected) || []
)

// Group selected skills by their category/group
const groupedSkills = computed(() => {
  const groups: Record<string, string[]> = {}
  
  selectedSkills.value.forEach(skill => {
    const groupName = skill.group || 'Skills'
    if (!groups[groupName]) {
      groups[groupName] = []
    }
    groups[groupName].push(skill.name)
  })
  
  // Convert to array of { group, skills } for template iteration
  return Object.entries(groups).map(([group, skills]) => ({
    group,
    skills
  }))
})

const selectedCertifications = computed(() =>
  sortCertificationsForResumePreview(
    props.selectedContent.certifications?.filter(cert => cert.selected) || []
  )
)

const hasSummary = computed(() => !!activeSummary.value)
const activeSummary = computed(() =>
  props.selectedContent?.summaries?.find(s => s.enabled) ?? null
)

// ---- Section ordering ----

const DEFAULT_SECTION_ORDER = ['summary', 'workExperience', 'education', 'skills', 'certifications']

const SECTION_DEFAULT_LABELS: Record<string, string> = {
  summary: 'Professional Summary',
  workExperience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  certifications: 'Certifications'
}

function getSectionHeading(key: string): string {
  return props.selectedContent?.sectionLabels?.[key] ?? SECTION_DEFAULT_LABELS[key] ?? key
}

const orderedSections = computed(() =>
  props.selectedContent?.sectionOrder ?? DEFAULT_SECTION_ORDER
)

// ---- Header style ----

const h2Style = computed(() => {
  const color = props.accentColor ?? '#0d9488'
  const hs = props.headerStyle ?? 'classic'
  if (hs === 'bold') {
    return {
      fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase',
      letterSpacing: '0.05em', padding: '0.2rem 0.5rem',
      backgroundColor: color, color: '#ffffff',
      marginBottom: '0.5rem', display: 'block'
    }
  }
  if (hs === 'minimal') {
    return {
      fontSize: '0.75rem', fontWeight: '500', textTransform: 'uppercase',
      letterSpacing: '0.1em', color: '#374151',
      borderBottom: '1px solid #d1d5db', paddingBottom: '0.25rem',
      marginBottom: '0.5rem', textAlign: 'left' as const
    }
  }
  // classic (default)
  return {
    fontSize: '0.75rem', fontWeight: '500', textTransform: 'uppercase',
    letterSpacing: '0.1em', color, marginBottom: '0.25rem', textAlign: 'center' as const
  }
})

const hrStyle = computed(() => {
  const hs = props.headerStyle ?? 'classic'
  if (hs === 'bold' || hs === 'minimal') return { display: 'none' }
  return { border: 'none', borderTop: '1px solid #d1d5db', marginBottom: '0.5rem' }
})
</script>

<template>
  <!-- Resume preview showing full page with margins -->
  <div 
    id="resume-preview" 
    :style="{
      width: '8.5in',
      minHeight: '11in',
      margin: '0 auto',
      padding: '0.5in',
      backgroundColor: '#ffffff',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      fontFamily: 'Calibri, Carlito, sans-serif',
      color: '#111827',
      boxSizing: 'border-box'
    }"
  >
    <!-- Header: Centered Name and Contact -->
    <header :style="{ textAlign: 'center', paddingBottom: '1rem' }">
      <h1 :style="{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.15rem', color: '#111827' }">
        {{ displayContact.firstName }} {{ displayContact.lastName }}
      </h1>
      <div :style="{ fontSize: '0.8125rem', color: '#4b5563' }">
        <span v-if="displayContact.phone">Phone: {{ displayContact.phone }}</span>
        <span v-if="displayContact.phone && displayContact.email"> | </span>
        <span v-if="displayContact.email">Email: {{ displayContact.email }}</span>
        <span v-if="(displayContact.phone || displayContact.email) && displayContact.linkedIn"> | </span>
        <span v-if="displayContact.linkedIn">LinkedIn: {{ displayContact.linkedIn }}</span>
      </div>
    </header>

    <!-- Sections rendered in user-defined order -->
    <template v-for="sectionKey in orderedSections" :key="sectionKey">

      <!-- Professional Summary -->
      <section
        v-if="sectionKey === 'summary' && hasSummary && activeSummary"
        class="resume-section"
        :style="[{ marginBottom: '1rem' }, isEditing('summary') ? editingHighlightStyle : {}]"
      >
        <h2 :style="h2Style">{{ getSectionHeading('summary') }}</h2>
        <hr :style="hrStyle" />
        <p :style="{ fontSize: '0.8125rem', lineHeight: '1.5', color: '#374151', textAlign: 'justify' }">
          {{ activeSummary.text }}
        </p>
      </section>

      <!-- Work Experience -->
      <section
        v-else-if="sectionKey === 'workExperience' && selectedExperiences.length > 0"
        class="resume-section"
        :style="{ marginBottom: '1rem' }"
      >
        <h2 :style="h2Style">{{ getSectionHeading('workExperience') }}</h2>
        <hr :style="hrStyle" />
        <div
          v-for="(exp, index) in selectedExperiences"
          :key="exp.id"
          class="resume-entry"
          :style="[{ marginBottom: index < selectedExperiences.length - 1 ? '0.75rem' : '0' }, isEditing('experience', exp.id) ? editingHighlightStyle : {}]"
        >
          <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }">
            <h3 :style="{ fontWeight: 'bold', fontSize: '0.875rem', color: '#111827' }">{{ exp.jobTitle }}</h3>
            <span :style="{ fontSize: '0.8125rem', color: '#374151' }">{{ formatDateRange(exp.startDate, exp.endDate, exp.currentPosition) }}</span>
          </div>
          <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }">
            <p :style="{ fontWeight: 'bold', fontSize: '0.8125rem', color: '#4D4D4D' }">{{ exp.employer }}</p>
            <span :style="{ fontSize: '0.8125rem', color: '#374151' }">{{ exp.locationType }}</span>
          </div>
          <ul
            v-if="exp.highlights.some(h => h.selected)"
            :style="{ listStyleType: 'disc', listStylePosition: 'outside', marginLeft: '1.25rem', fontSize: '0.8125rem', color: '#374151' }"
          >
            <li
              v-for="highlight in exp.highlights.filter(h => h.selected)"
              :key="highlight.id"
              :style="{ marginBottom: '0.125rem', lineHeight: '1.4' }"
            >
              {{ highlight.text }}
            </li>
          </ul>
        </div>
      </section>

      <!-- Education -->
      <section
        v-else-if="sectionKey === 'education' && selectedEducation.length > 0"
        class="resume-section"
        :style="{ marginBottom: '1rem' }"
      >
        <h2 :style="h2Style">{{ getSectionHeading('education') }}</h2>
        <hr :style="hrStyle" />
        <div
          v-for="(edu, index) in selectedEducation"
          :key="edu.id"
          class="resume-entry"
          :style="[{ marginBottom: index < selectedEducation.length - 1 ? '0.5rem' : '0' }, isEditing('education', edu.id) ? editingHighlightStyle : {}]"
        >
          <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }">
            <h3 :style="{ fontWeight: 'bold', fontSize: '0.875rem', color: '#111827' }">{{ edu.degree }}<span v-if="edu.areaOfStudy"> in {{ edu.areaOfStudy }}</span></h3>
            <span v-if="edu.endDate" :style="{ fontSize: '0.8125rem', color: '#374151' }">{{ formatDateForDisplay(edu.endDate) }}</span>
          </div>
          <p :style="{ fontSize: '0.8125rem', color: '#374151' }">{{ edu.institution }}</p>
        </div>
      </section>

      <!-- Skills -->
      <section
        v-else-if="sectionKey === 'skills' && selectedSkills.length > 0"
        class="resume-section"
        :style="[{ marginBottom: '1rem' }, isEditing('skills') ? editingHighlightStyle : {}]"
      >
        <h2 :style="h2Style">{{ getSectionHeading('skills') }}</h2>
        <hr :style="hrStyle" />
        <div v-for="(skillGroup, groupIndex) in groupedSkills" :key="skillGroup.group" :style="{ marginBottom: groupIndex < groupedSkills.length - 1 ? '0.5rem' : '0' }">
          <p :style="{ fontSize: '0.8125rem', color: '#374151', lineHeight: '1.5' }">
            <span v-if="groupedSkills.length > 1" :style="{ fontWeight: 'bold' }">{{ skillGroup.group }}: </span>{{ skillGroup.skills.join(', ') }}
          </p>
        </div>
      </section>

      <!-- Certifications -->
      <section
        v-else-if="sectionKey === 'certifications' && selectedCertifications.length > 0"
        class="resume-section"
        :style="{ marginBottom: '1rem' }"
      >
        <h2 :style="h2Style">{{ getSectionHeading('certifications') }}</h2>
        <hr :style="hrStyle" />
        <div
          v-for="(cert, index) in selectedCertifications"
          :key="cert.id"
          class="resume-entry"
          :style="[{ marginBottom: index < selectedCertifications.length - 1 ? '0.375rem' : '0' }, isEditing('certification', cert.id) ? editingHighlightStyle : {}]"
        >
          <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }">
            <h3 :style="{ fontWeight: 'bold', fontSize: '0.875rem', color: '#111827' }">{{ cert.name }}</h3>
            <span v-if="cert.issueDate" :style="{ fontSize: '0.8125rem', color: '#374151' }">{{ formatMonthYear(cert.issueDate) }}</span>
          </div>
          <p v-if="cert.issuer" :style="{ fontSize: '0.8125rem', color: '#374151' }">{{ cert.issuer }}</p>
        </div>
      </section>

    </template>

    <!-- Empty State -->
    <div 
      v-if="!hasSummary && selectedExperiences.length === 0 && selectedEducation.length === 0 && selectedSkills.length === 0 && selectedCertifications.length === 0" 
      :style="{ textAlign: 'center', padding: '3rem 0' }"
    >
      <div :style="{ color: '#9ca3af', marginBottom: '0.5rem', fontSize: '3rem', lineHeight: '1' }">
        📄
      </div>
      <p :style="{ color: '#6b7280', fontSize: '0.875rem' }">Select content from the editor to see your resume preview</p>
    </div>
  </div>
</template>

<style scoped>
/* PDF-ready styles - html2pdf.js will capture these */
#resume-preview {
  box-sizing: border-box;
}

/* Sections should avoid page breaks inside when possible */
.resume-section {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Individual entries (jobs, education items, etc.) should stay together */
.resume-entry {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Don't break right after headers */
header {
  page-break-after: avoid;
  break-after: avoid;
}

h2, h3 {
  page-break-after: avoid;
  break-after: avoid;
}
</style>
