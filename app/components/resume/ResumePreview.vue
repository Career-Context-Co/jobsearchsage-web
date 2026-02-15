<script setup lang="ts">
interface Props {
  accentColor?: string
  contactInfo?: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    city?: string
    state?: string
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
      startDate: string
      endDate: string | null
      highlights: Array<{ id: string, text: string, selected: boolean }>
      selected: boolean
    }>
    education?: Array<{
      id: string | number
      institution: string
      degree: string
      areaOfStudy: string
      startDate: string
      endDate: string
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

function formatDateRange(startDate: string, endDate: string | null) {
  const start = new Date(startDate + '-01')
  const startFormatted = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  
  if (!endDate) return `${startFormatted} - Present`
  
  const end = new Date(endDate + '-01')
  const endFormatted = end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  return `${startFormatted} - ${endFormatted}`
}

function formatMonthYear(dateStr: string) {
  const date = new Date(dateStr + '-01')
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
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
  <div id="resume-preview" class="max-w-3xl mx-auto bg-white shadow-lg">
    <!-- Resume Document -->
    <div class="p-8 sm:p-12 text-gray-900 space-y-6">
      <!-- Header: Name and Contact -->
      <header class="border-b-2 pb-4" :style="{ borderColor: accentColor }">
        <h1 
          class="text-3xl sm:text-4xl font-bold mb-1" 
          :style="{ color: accentColor }"
        >
          {{ displayContact.firstName }} {{ displayContact.lastName }}
        </h1>
        <p v-if="displayContact.jobTitle" class="text-lg text-gray-600 mb-3">{{ displayContact.jobTitle }}</p>
        <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
          <span v-if="displayContact.email">{{ displayContact.email }}</span>
          <span v-if="displayContact.phone">{{ displayContact.phone }}</span>
          <span v-if="displayContact.location">{{ displayContact.location }}</span>
        </div>
      </header>

      <!-- Professional Summary -->
      <section v-if="hasSummary && selectedContent.summary">
        <h2 
          class="text-lg font-bold uppercase tracking-wide mb-2"
          :style="{ color: accentColor }"
        >
          Professional Summary
        </h2>
        <p class="text-sm leading-relaxed text-gray-700">
          {{ selectedContent.summary.text }}
        </p>
      </section>

      <!-- Work Experience -->
      <section v-if="selectedExperiences.length > 0">
        <h2 
          class="text-lg font-bold uppercase tracking-wide mb-3"
          :style="{ color: accentColor }"
        >
          Work Experience
        </h2>
        <div class="space-y-4">
          <div
            v-for="exp in selectedExperiences"
            :key="exp.id"
          >
            <div class="flex justify-between items-baseline mb-1">
              <h3 class="font-semibold text-base">{{ exp.jobTitle }}</h3>
              <span class="text-sm text-gray-600">{{ formatDateRange(exp.startDate, exp.endDate) }}</span>
            </div>
            <p class="text-sm text-gray-600 mb-2">
              {{ exp.employer }} • {{ exp.employmentType }} • {{ exp.locationType }}
            </p>
            <ul 
              v-if="exp.highlights.some(h => h.selected)" 
              class="list-disc list-outside ml-5 space-y-1 text-sm text-gray-700"
            >
              <li
                v-for="highlight in exp.highlights.filter(h => h.selected)"
                :key="highlight.id"
              >
                {{ highlight.text }}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Education -->
      <section v-if="selectedEducation.length > 0">
        <h2 
          class="text-lg font-bold uppercase tracking-wide mb-3"
          :style="{ color: accentColor }"
        >
          Education
        </h2>
        <div class="space-y-3">
          <div
            v-for="edu in selectedEducation"
            :key="edu.id"
          >
            <div class="flex justify-between items-baseline mb-1">
              <h3 class="font-semibold text-base">{{ edu.institution }}</h3>
              <span class="text-sm text-gray-600">{{ formatDateRange(edu.startDate, edu.endDate) }}</span>
            </div>
            <p class="text-sm text-gray-600">{{ edu.degree }} in {{ edu.areaOfStudy }}</p>
          </div>
        </div>
      </section>

      <!-- Skills -->
      <section v-if="selectedSkills.length > 0">
        <h2 
          class="text-lg font-bold uppercase tracking-wide mb-2"
          :style="{ color: accentColor }"
        >
          Skills
        </h2>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="skill in selectedSkills"
            :key="skill.id"
            class="text-sm text-gray-700"
          >
            {{ skill.name }}<span v-if="skill !== selectedSkills[selectedSkills.length - 1]" class="text-gray-400 ml-2">•</span>
          </span>
        </div>
      </section>

      <!-- Certifications -->
      <section v-if="selectedCertifications.length > 0">
        <h2 
          class="text-lg font-bold uppercase tracking-wide mb-3"
          :style="{ color: accentColor }"
        >
          Certifications
        </h2>
        <div class="space-y-2">
          <div
            v-for="cert in selectedCertifications"
            :key="cert.id"
          >
            <h3 class="font-semibold text-base">{{ cert.name }}</h3>
            <p class="text-sm text-gray-600">{{ cert.issuer }} • Issued {{ formatMonthYear(cert.issueDate) }}</p>
          </div>
        </div>
      </section>

      <!-- Empty State -->
      <div v-if="!hasSummary && selectedExperiences.length === 0 && selectedEducation.length === 0 && selectedSkills.length === 0 && selectedCertifications.length === 0" class="text-center py-12">
        <div class="text-gray-400 mb-2">
          <UIcon name="i-lucide-file-text" class="w-12 h-12 mx-auto" />
        </div>
        <p class="text-gray-500 text-sm">Select content from the editor to see your resume preview</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* PDF-ready styles - html2pdf.js will capture these */
#resume-preview {
  /* Ensure consistent rendering for PDF export */
  box-sizing: border-box;
}

section {
  /* Hint to avoid awkward page breaks */
  page-break-inside: avoid;
}
</style>
