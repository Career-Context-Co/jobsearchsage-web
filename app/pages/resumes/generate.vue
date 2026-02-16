<script setup lang="ts">
const careerIDStore = useCareerIDStore()
const { generatePdf, isGenerating: isPdfExporting } = usePdfLibResume()
const { generateDocx, isGenerating: isDocxExporting } = useDocxResume()

// Download format selection
type DownloadFormat = 'pdf' | 'docx'
const downloadFormat = ref<DownloadFormat>('pdf')
const formatOptions = [
  { label: 'PDF', value: 'pdf' },
  { label: 'Word (DOCX)', value: 'docx' }
]

// Combined loading state
const isExporting = computed(() => isPdfExporting.value || isDocxExporting.value)

const activeTab = ref('content')

const tabs = [
  { label: 'Content Editor', value: 'content', icon: 'i-lucide-file-text' },
  { label: 'Designer', value: 'designer', icon: 'i-lucide-palette' }
]

// Accent color state (shared between Designer tab and Preview)
const accentColor = ref('#0d9488')

// Load profile data on mount
onMounted(async () => {
  if (!careerIDStore.isProfileLoaded) {
    await careerIDStore.fetchProfile(careerIDStore.profileId)
  }
  initializeSelections()
})

/**
 * Format date from YYYY-MM-DD to display format (e.g., "Jan 2023")
 */
function formatDateForDisplay(dateString: string | null | undefined): string {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

/**
 * Format employment type for display (e.g., "full_time" -> "Full-time")
 */
function formatEmploymentType(type: string): string {
  const types: Record<string, string> = {
    'full_time': 'Full-time',
    'part_time': 'Part-time',
    'contract': 'Contract',
    'freelance': 'Freelance',
    'internship': 'Internship'
  }
  return types[type] || type
}

/**
 * Format location type for display (e.g., "on_site" -> "On-site")
 */
function formatLocationType(type: string): string {
  const types: Record<string, string> = {
    'on_site': 'On-site',
    'remote': 'Remote',
    'hybrid': 'Hybrid'
  }
  return types[type] || type
}

// Contact info formatted for preview component
const contactInfoForPreview = computed(() => ({
  firstName: careerIDStore.contactInfo?.firstName,
  lastName: careerIDStore.contactInfo?.lastName,
  email: careerIDStore.contactInfo?.email,
  phone: careerIDStore.contactInfo?.phone || undefined
}))

// Extract LinkedIn username from social links
const linkedInUsername = computed(() => {
  const linkedInLink = careerIDStore.profileSocialLinks.find(link => link.platformId === 1)
  if (!linkedInLink?.url) return null
  const match = linkedInLink.url.match(/linkedin\.com\/in\/([^/?]+)/i)
  return match ? match[1] : linkedInLink.url
})

// Get profile data from store - using correct field names from types
const profileData = computed(() => ({
  // Professional summary is in contactInfo.summary
  professionalSummary: careerIDStore.contactInfo?.summary || '',
  workExperience: careerIDStore.experience.map(exp => ({
    id: exp.id,
    employer: exp.employer,
    jobTitle: exp.title, // Experience uses 'title' not 'jobTitle'
    employmentType: formatEmploymentType(exp.employmentType),
    locationType: formatLocationType(exp.locationType),
    startDate: exp.startDate,
    endDate: exp.endDate,
    currentPosition: exp.currentPosition,
    highlights: (exp.highlights || []).map((h, index) => ({
      id: `${exp.id}-h${index}`,
      text: h
    }))
  })),
  education: careerIDStore.education.map(edu => ({
    id: edu.id,
    institution: edu.institution,
    degree: edu.degreeType,
    areaOfStudy: edu.areaOfStudy || '',
    startDate: edu.startDate,
    endDate: edu.endDate
  })),
  skills: careerIDStore.profileSkills.map(skill => ({
    id: skill.id,
    name: skill.name,
    group: skill.group || 'Skills' // Default group name if none specified
  })),
  certifications: careerIDStore.certifications.map(cert => ({
    id: cert.id,
    name: cert.name, // Certification uses 'name' not 'certificationName'
    issuer: cert.issuer || '',
    issueDate: cert.issueDate || ''
  }))
}))

// Section checkboxes
const summaryEnabled = ref(false)
const workExperienceEnabled = ref(false)
const educationEnabled = ref(false)
const skillsEnabled = ref(false)
const certificationsEnabled = ref(false)

// Individual item selections (initialized in onMounted)
const selectedExperiences = ref<Set<string>>(new Set())
const selectedHighlights = ref<Set<string>>(new Set())
const selectedEducation = ref<Set<string>>(new Set())
const selectedSkills = ref<Set<string>>(new Set())
const selectedCertifications = ref<Set<string>>(new Set())

// Initialize all content as selected (called after data is loaded)
function initializeSelections() {
  // Enable sections that have data
  if (profileData.value.professionalSummary) {
    summaryEnabled.value = true
  }
  if (profileData.value.workExperience.length > 0) {
    workExperienceEnabled.value = true
    profileData.value.workExperience.forEach(exp => {
      selectedExperiences.value.add(String(exp.id))
      exp.highlights.forEach(h => selectedHighlights.value.add(h.id))
    })
  }
  if (profileData.value.education.length > 0) {
    educationEnabled.value = true
    profileData.value.education.forEach(edu => selectedEducation.value.add(String(edu.id)))
  }
  if (profileData.value.skills.length > 0) {
    skillsEnabled.value = true
    profileData.value.skills.forEach(skill => selectedSkills.value.add(String(skill.id)))
  }
  if (profileData.value.certifications.length > 0) {
    certificationsEnabled.value = true
    profileData.value.certifications.forEach(cert => selectedCertifications.value.add(String(cert.id)))
  }
}

// Section toggle handlers
function toggleSection(section: 'summary' | 'workExperience' | 'education' | 'skills' | 'certifications') {
  switch (section) {
    case 'summary':
      summaryEnabled.value = !summaryEnabled.value
      break
    case 'workExperience':
      workExperienceEnabled.value = !workExperienceEnabled.value
      if (workExperienceEnabled.value) {
        profileData.value.workExperience.forEach(exp => selectedExperiences.value.add(String(exp.id)))
        profileData.value.workExperience.forEach(exp => 
          exp.highlights.forEach(h => selectedHighlights.value.add(h.id))
        )
      } else {
        selectedExperiences.value.clear()
        selectedHighlights.value.clear()
      }
      break
    case 'education':
      educationEnabled.value = !educationEnabled.value
      if (educationEnabled.value) {
        profileData.value.education.forEach(edu => selectedEducation.value.add(String(edu.id)))
      } else {
        selectedEducation.value.clear()
      }
      break
    case 'skills':
      skillsEnabled.value = !skillsEnabled.value
      if (skillsEnabled.value) {
        profileData.value.skills.forEach(skill => selectedSkills.value.add(String(skill.id)))
      } else {
        selectedSkills.value.clear()
      }
      break
    case 'certifications':
      certificationsEnabled.value = !certificationsEnabled.value
      if (certificationsEnabled.value) {
        profileData.value.certifications.forEach(cert => selectedCertifications.value.add(String(cert.id)))
      } else {
        selectedCertifications.value.clear()
      }
      break
  }
}

// Format date range for display
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

const accordionItems = [
  {
    label: 'Professional Summary',
    icon: 'i-lucide-text-cursor-input',
    defaultOpen: false,
    slot: 'summary'
  },
  {
    label: 'Work Experience',
    icon: 'i-lucide-briefcase',
    defaultOpen: false,
    slot: 'workExperience'
  },
  {
    label: 'Education',
    icon: 'i-lucide-graduation-cap',
    defaultOpen: false,
    slot: 'education'
  },
  {
    label: 'Skills',
    icon: 'i-lucide-lightbulb',
    defaultOpen: false,
    slot: 'skills'
  },
  {
    label: 'Certifications',
    icon: 'i-lucide-award',
    defaultOpen: false,
    slot: 'certifications'
  }
]

// Prepare data for preview component
const previewData = computed(() => ({
  summary: {
    text: profileData.value.professionalSummary,
    enabled: summaryEnabled.value
  },
  workExperience: profileData.value.workExperience.map(exp => ({
    ...exp,
    selected: selectedExperiences.value.has(String(exp.id)),
    highlights: exp.highlights.map(h => ({
      ...h,
      selected: selectedHighlights.value.has(h.id)
    }))
  })),
  education: profileData.value.education.map(edu => ({
    ...edu,
    selected: selectedEducation.value.has(String(edu.id))
  })),
  skills: profileData.value.skills.map(skill => ({
    ...skill,
    selected: selectedSkills.value.has(String(skill.id))
  })),
  certifications: profileData.value.certifications.map(cert => ({
    ...cert,
    selected: selectedCertifications.value.has(String(cert.id))
  }))
}))

// Group skills by category for the editor
const groupedProfileSkills = computed(() => {
  const groups: Record<string, Array<{ id: string | number, name: string }>> = {}
  
  profileData.value.skills.forEach(skill => {
    const groupName = skill.group || 'Skills'
    if (!groups[groupName]) {
      groups[groupName] = []
    }
    groups[groupName].push({ id: skill.id, name: skill.name })
  })
  
  return Object.entries(groups).map(([group, skills]) => ({
    group,
    skills
  }))
})

// Check if all skills in a category are selected
function isCategoryFullySelected(groupName: string): boolean {
  const category = groupedProfileSkills.value.find(g => g.group === groupName)
  if (!category) return false
  return category.skills.every(skill => selectedSkills.value.has(String(skill.id)))
}

// Check if some (but not all) skills in a category are selected
function isCategoryPartiallySelected(groupName: string): boolean {
  const category = groupedProfileSkills.value.find(g => g.group === groupName)
  if (!category) return false
  const selectedCount = category.skills.filter(skill => selectedSkills.value.has(String(skill.id))).length
  return selectedCount > 0 && selectedCount < category.skills.length
}

// Toggle all skills in a category
function toggleSkillCategory(groupName: string) {
  const category = groupedProfileSkills.value.find(g => g.group === groupName)
  if (!category) return
  
  const allSelected = isCategoryFullySelected(groupName)
  
  if (allSelected) {
    // Deselect all skills in this category
    category.skills.forEach(skill => {
      selectedSkills.value.delete(String(skill.id))
    })
  } else {
    // Select all skills in this category
    category.skills.forEach(skill => {
      selectedSkills.value.add(String(skill.id))
    })
  }
}

// Track whether any content is selected (for Export PDF button)
const hasSelectedContent = computed(() => {
  return summaryEnabled.value ||
    selectedExperiences.value.size > 0 ||
    selectedEducation.value.size > 0 ||
    selectedSkills.value.size > 0 ||
    selectedCertifications.value.size > 0
})

async function downloadResume() {
  const options = {
    accentColor: accentColor.value,
    contactInfo: contactInfoForPreview.value,
    jobTitle: careerIDStore.contactInfo?.jobTitle || '',
    selectedContent: previewData.value,
    socialLinks: careerIDStore.profileSocialLinks
  }

  try {
    if (downloadFormat.value === 'docx') {
      await generateDocx(options)
    } else {
      await generatePdf(options)
    }
  } catch (error) {
    console.error('Download failed:', error)
  }
}
</script>

<template>
  <UDashboardPanel id="resume" :ui="{ body: 'p-0 sm:p-0 lg:p-0' }">
    <template #header>
      <UDashboardNavbar title="Resume">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #default>
          <div class="flex items-center justify-between w-full">
            <div class="flex gap-1 -mx-1">
              <UButton
                v-for="tab in tabs"
                :key="tab.value"
                :label="tab.label"
                :icon="tab.icon"
                :color="activeTab === tab.value ? 'primary' : 'neutral'"
                :variant="activeTab === tab.value ? 'subtle' : 'ghost'"
                size="sm"
                @click="activeTab = tab.value"
              />
            </div>
            <div class="flex items-center gap-2">
              <USelectMenu
                v-model="downloadFormat"
                :items="formatOptions"
                value-key="value"
                size="sm"
                class="w-32"
              />
              <UButton
                label="Download"
                icon="i-lucide-download"
                color="primary"
                size="sm"
                :disabled="!hasSelectedContent"
                :loading="isExporting"
                @click="downloadResume"
              />
            </div>
          </div>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="flex flex-col lg:flex-row h-full min-h-[calc(100vh-8rem)]">
        <!-- Left Panel: Editor Controls (scrollable) -->
        <div class="w-full lg:w-1/2 overflow-y-auto p-4 sm:p-6 lg:border-r lg:border-default">
          <!-- Content Editor Tab -->
          <div v-if="activeTab === 'content'" class="space-y-4">
            <div>
              <h2 class="text-lg font-semibold mb-1">Content Selection</h2>
              <p class="text-sm text-muted">Choose what to include in your resume</p>
            </div>

            <UAccordion :items="accordionItems" multiple>
              <!-- Professional Summary Section -->
              <template #summary>
                <div v-if="profileData.professionalSummary" class="flex items-start gap-3 py-2">
                  <UCheckbox
                    v-model="summaryEnabled"
                    @click.stop
                    @change="toggleSection('summary')"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-muted whitespace-pre-wrap">{{ profileData.professionalSummary }}</p>
                  </div>
                </div>
                <div v-else class="text-sm text-muted py-2">
                  No professional summary added yet.
                </div>
              </template>

              <!-- Work Experience Section -->
              <template #workExperience>
                <div v-if="profileData.workExperience.length > 0" class="space-y-4">
                  <div class="flex items-center gap-2 mb-3">
                    <UCheckbox
                      v-model="workExperienceEnabled"
                      @click.stop
                      @change="toggleSection('workExperience')"
                    />
                    <span class="text-sm font-medium">Include all work experience</span>
                  </div>

                  <div
                    v-for="exp in profileData.workExperience"
                    :key="exp.id"
                    class="pl-6 border-l-2 border-default space-y-2"
                  >
                    <div class="flex items-start gap-3">
                      <UCheckbox
                        :model-value="selectedExperiences.has(String(exp.id))"
                        @update:model-value="(val) => {
                          if (val) {
                            selectedExperiences.add(String(exp.id))
                            exp.highlights.forEach(h => selectedHighlights.add(h.id))
                          } else {
                            selectedExperiences.delete(String(exp.id))
                            exp.highlights.forEach(h => selectedHighlights.delete(h.id))
                          }
                        }"
                        @click.stop
                      />
                      <div class="flex-1 min-w-0">
                        <p class="font-medium">{{ exp.jobTitle }}</p>
                        <p class="text-sm text-muted">{{ exp.employer }}</p>
                        <p class="text-xs text-muted mt-1">
                          {{ exp.employmentType }} • {{ exp.locationType }} • {{ formatDateRange(exp.startDate, exp.endDate, exp.currentPosition) }}
                        </p>
                      </div>
                    </div>

                    <div v-if="exp.highlights.length > 0" class="pl-6 space-y-2">
                      <div
                        v-for="highlight in exp.highlights"
                        :key="highlight.id"
                        class="flex items-start gap-3"
                      >
                        <UCheckbox
                          :model-value="selectedHighlights.has(highlight.id)"
                          @update:model-value="(val) => {
                            if (val) selectedHighlights.add(highlight.id)
                            else selectedHighlights.delete(highlight.id)
                          }"
                          @click.stop
                        />
                        <p class="text-sm flex-1">{{ highlight.text }}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-sm text-muted py-2">
                  No work experience added yet.
                </div>
              </template>

              <!-- Education Section -->
              <template #education>
                <div v-if="profileData.education.length > 0" class="space-y-3">
                  <div class="flex items-center gap-2 mb-3">
                    <UCheckbox
                      v-model="educationEnabled"
                      @click.stop
                      @change="toggleSection('education')"
                    />
                    <span class="text-sm font-medium">Include all education</span>
                  </div>

                  <div
                    v-for="edu in profileData.education"
                    :key="edu.id"
                    class="pl-6 flex items-start gap-3"
                  >
                    <UCheckbox
                      :model-value="selectedEducation.has(String(edu.id))"
                      @update:model-value="(val) => {
                        if (val) selectedEducation.add(String(edu.id))
                        else selectedEducation.delete(String(edu.id))
                      }"
                      @click.stop
                    />
                    <div class="flex-1 min-w-0">
                      <p class="font-medium">{{ edu.institution }}</p>
                      <p class="text-sm text-muted">{{ edu.degree }}<span v-if="edu.areaOfStudy"> in {{ edu.areaOfStudy }}</span></p>
                      <p class="text-xs text-muted mt-1">{{ formatDateRange(edu.startDate, edu.endDate) }}</p>
                    </div>
                  </div>
                </div>
                <div v-else class="text-sm text-muted py-2">
                  No education added yet.
                </div>
              </template>

              <!-- Skills Section -->
              <template #skills>
                <div v-if="profileData.skills.length > 0" class="space-y-3">
                  <div class="flex items-center gap-2 mb-3">
                    <UCheckbox
                      v-model="skillsEnabled"
                      @click.stop
                      @change="toggleSection('skills')"
                    />
                    <span class="text-sm font-medium">Include all skills</span>
                  </div>

                  <!-- Skills grouped by category -->
                  <div v-for="skillGroup in groupedProfileSkills" :key="skillGroup.group" class="pl-3 space-y-2">
                    <!-- Category header with checkbox -->
                    <div class="flex items-center gap-2">
                      <UCheckbox
                        :model-value="isCategoryFullySelected(skillGroup.group)"
                        :indeterminate="isCategoryPartiallySelected(skillGroup.group)"
                        @click.stop
                        @change="toggleSkillCategory(skillGroup.group)"
                      />
                      <span class="text-sm font-medium text-muted">{{ skillGroup.group }}</span>
                    </div>
                    
                    <!-- Individual skills in this category -->
                    <div class="pl-6 grid grid-cols-2 gap-2">
                      <div
                        v-for="skill in skillGroup.skills"
                        :key="skill.id"
                        class="flex items-center gap-2"
                      >
                        <UCheckbox
                          :model-value="selectedSkills.has(String(skill.id))"
                          @update:model-value="(val) => {
                            if (val) selectedSkills.add(String(skill.id))
                            else selectedSkills.delete(String(skill.id))
                          }"
                          @click.stop
                        />
                        <span class="text-sm">{{ skill.name }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-sm text-muted py-2">
                  No skills added yet.
                </div>
              </template>

              <!-- Certifications Section -->
              <template #certifications>
                <div v-if="profileData.certifications.length > 0" class="space-y-3">
                  <div class="flex items-center gap-2 mb-3">
                    <UCheckbox
                      v-model="certificationsEnabled"
                      @click.stop
                      @change="toggleSection('certifications')"
                    />
                    <span class="text-sm font-medium">Include all certifications</span>
                  </div>

                  <div
                    v-for="cert in profileData.certifications"
                    :key="cert.id"
                    class="pl-6 flex items-start gap-3"
                  >
                    <UCheckbox
                      :model-value="selectedCertifications.has(String(cert.id))"
                      @update:model-value="(val) => {
                        if (val) selectedCertifications.add(String(cert.id))
                        else selectedCertifications.delete(String(cert.id))
                      }"
                      @click.stop
                    />
                    <div class="flex-1 min-w-0">
                      <p class="font-medium">{{ cert.name }}</p>
                      <p v-if="cert.issuer" class="text-sm text-muted">{{ cert.issuer }}</p>
                      <p v-if="cert.issueDate" class="text-xs text-muted mt-1">Issued {{ formatMonthYear(cert.issueDate) }}</p>
                    </div>
                  </div>
                </div>
                <div v-else class="text-sm text-muted py-2">
                  No certifications added yet.
                </div>
              </template>
            </UAccordion>
          </div>

          <!-- Designer Tab -->
          <ResumeDesigner 
            v-if="activeTab === 'designer'"
            v-model="accentColor"
          />
        </div>

        <!-- Right Panel: Live Preview (sticky) -->
        <div class="w-full lg:w-1/2 lg:sticky lg:top-0 lg:h-[calc(100vh-8rem)] overflow-y-auto bg-elevated/50 p-4 sm:p-6">
          <ResumePreview 
            :accent-color="accentColor"
            :contact-info="contactInfoForPreview"
            :linked-in-username="linkedInUsername"
            :job-title="careerIDStore.contactInfo?.jobTitle || ''"
            :selected-content="previewData"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
