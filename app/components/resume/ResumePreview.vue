<script setup lang="ts">
interface Props {
  accentColor?: string
  contactInfo?: {
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    phone?: string | null
    city?: string | null
    state?: string | null
  }
  jobTitle?: string
  selectedContent?: {
    summary?: { text: string, enabled: boolean }
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
    skills?: Array<{ id: string | number, name: string, selected: boolean }>
    certifications?: Array<{
      id: string | number
      name: string
      issuer: string
      issueDate: string
      selected: boolean
    }>
  }
}

const props = withDefaults(defineProps<Props>(), {
  accentColor: '#0d9488',
  contactInfo: () => ({}),
  jobTitle: '',
  selectedContent: () => ({})
})

// Use provided contact info or fallback to placeholders
const displayContact = computed(() => ({
  firstName: props.contactInfo?.firstName || 'First',
  lastName: props.contactInfo?.lastName || 'Last',
  email: props.contactInfo?.email || 'email@example.com',
  phone: props.contactInfo?.phone || '(555) 123-4567',
  location: [props.contactInfo?.city, props.contactInfo?.state].filter(Boolean).join(', ') || 'City, State',
  jobTitle: props.jobTitle || 'Job Title'
}))

/**
 * Format date from YYYY-MM-DD to display format (e.g., "Jan 2023")
 */
function formatDateForDisplay(dateString: string | null | undefined): string {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
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

// Filter selected items
const selectedExperiences = computed(() => 
  props.selectedContent.workExperience?.filter(exp => exp.selected) || []
)

const selectedEducation = computed(() => 
  props.selectedContent.education?.filter(edu => edu.selected) || []
)

const selectedSkills = computed(() => 
  props.selectedContent.skills?.filter(skill => skill.selected) || []
)

const selectedCertifications = computed(() => 
  props.selectedContent.certifications?.filter(cert => cert.selected) || []
)

const hasSummary = computed(() => props.selectedContent.summary?.enabled)
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
    <header :style="{ textAlign: 'center', paddingBottom: '0.75rem' }">
      <h1 :style="{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.25rem', color: '#111827' }">
        {{ displayContact.firstName }} {{ displayContact.lastName }}
      </h1>
      <div :style="{ fontSize: '0.8125rem', color: '#4b5563' }">
        <span v-if="displayContact.phone">Phone: {{ displayContact.phone }}</span>
        <span v-if="displayContact.phone && displayContact.email"> | </span>
        <span v-if="displayContact.email">Email: {{ displayContact.email }}</span>
        <span v-if="(displayContact.phone || displayContact.email) && displayContact.location"> | </span>
        <span v-if="displayContact.location">{{ displayContact.location }}</span>
      </div>
    </header>

    <!-- Professional Summary -->
    <section v-if="hasSummary && selectedContent.summary" class="resume-section" :style="{ marginBottom: '1rem' }">
      <div :style="{ textAlign: 'center', marginBottom: '0.5rem' }">
        <h2 :style="{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: accentColor, marginBottom: '0.25rem' }">
          Summary
        </h2>
        <div :style="{ width: '100%', height: '1px', backgroundColor: accentColor }"></div>
      </div>
      <p :style="{ fontSize: '0.8125rem', lineHeight: '1.5', color: '#374151', textAlign: 'justify' }">
        {{ selectedContent.summary.text }}
      </p>
    </section>

    <!-- Work Experience -->
    <section v-if="selectedExperiences.length > 0" class="resume-section" :style="{ marginBottom: '1rem' }">
      <div :style="{ textAlign: 'center', marginBottom: '0.5rem' }">
        <h2 :style="{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: accentColor, marginBottom: '0.25rem' }">
          Professional Experience
        </h2>
        <div :style="{ width: '100%', height: '1px', backgroundColor: accentColor }"></div>
      </div>
      <div
        v-for="(exp, index) in selectedExperiences"
        :key="exp.id"
        class="resume-entry"
        :style="{ marginBottom: index < selectedExperiences.length - 1 ? '0.75rem' : '0' }"
      >
        <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }">
          <h3 :style="{ fontWeight: 'bold', fontSize: '0.875rem', color: '#111827' }">{{ exp.jobTitle }}</h3>
          <span :style="{ fontSize: '0.8125rem', color: '#374151' }">{{ formatDateRange(exp.startDate, exp.endDate, exp.currentPosition) }}</span>
        </div>
        <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }">
          <p :style="{ fontSize: '0.8125rem', color: '#374151' }">{{ exp.employer }}</p>
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
    <section v-if="selectedEducation.length > 0" class="resume-section" :style="{ marginBottom: '1rem' }">
      <div :style="{ textAlign: 'center', marginBottom: '0.5rem' }">
        <h2 :style="{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: accentColor, marginBottom: '0.25rem' }">
          Education
        </h2>
        <div :style="{ width: '100%', height: '1px', backgroundColor: accentColor }"></div>
      </div>
      <div
        v-for="(edu, index) in selectedEducation"
        :key="edu.id"
        class="resume-entry"
        :style="{ marginBottom: index < selectedEducation.length - 1 ? '0.5rem' : '0' }"
      >
        <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }">
          <h3 :style="{ fontWeight: 'bold', fontSize: '0.875rem', color: '#111827' }">{{ edu.institution }}</h3>
          <span :style="{ fontSize: '0.8125rem', color: '#374151' }">{{ formatDateRange(edu.startDate, edu.endDate) }}</span>
        </div>
        <p :style="{ fontSize: '0.8125rem', color: '#374151' }">{{ edu.degree }}<span v-if="edu.areaOfStudy"> in {{ edu.areaOfStudy }}</span></p>
      </div>
    </section>

    <!-- Skills -->
    <section v-if="selectedSkills.length > 0" class="resume-section" :style="{ marginBottom: '1rem' }">
      <div :style="{ textAlign: 'center', marginBottom: '0.5rem' }">
        <h2 :style="{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: accentColor, marginBottom: '0.25rem' }">
          Skills
        </h2>
        <div :style="{ width: '100%', height: '1px', backgroundColor: accentColor }"></div>
      </div>
      <p :style="{ fontSize: '0.8125rem', color: '#374151', textAlign: 'center' }">
        <span v-for="(skill, index) in selectedSkills" :key="skill.id">
          {{ skill.name }}<span v-if="index < selectedSkills.length - 1"> • </span>
        </span>
      </p>
    </section>

    <!-- Certifications -->
    <section v-if="selectedCertifications.length > 0" class="resume-section" :style="{ marginBottom: '1rem' }">
      <div :style="{ textAlign: 'center', marginBottom: '0.5rem' }">
        <h2 :style="{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: accentColor, marginBottom: '0.25rem' }">
          Certifications
        </h2>
        <div :style="{ width: '100%', height: '1px', backgroundColor: accentColor }"></div>
      </div>
      <div
        v-for="(cert, index) in selectedCertifications"
        :key="cert.id"
        class="resume-entry"
        :style="{ marginBottom: index < selectedCertifications.length - 1 ? '0.375rem' : '0' }"
      >
        <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }">
          <h3 :style="{ fontWeight: 'bold', fontSize: '0.875rem', color: '#111827' }">{{ cert.name }}</h3>
          <span v-if="cert.issueDate" :style="{ fontSize: '0.8125rem', color: '#374151' }">{{ formatMonthYear(cert.issueDate) }}</span>
        </div>
        <p v-if="cert.issuer" :style="{ fontSize: '0.8125rem', color: '#374151' }">{{ cert.issuer }}</p>
      </div>
    </section>

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
