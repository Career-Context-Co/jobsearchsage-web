<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const careerIDStore = useCareerIDStore()
const { generatePdf, isGenerating: isPdfExporting } = usePdfLibResume()
const { generateDocx, isGenerating: isDocxExporting } = useDocxResume()

// TODO(backend): When persistence is ready, load the docs_resumes record by this ID
// For now, 'new' and any numeric ID both load fresh from careerIDStore
const resumeId = route.params.id

// TODO(backend): Replace with resume.title loaded from docs_resumes
const resumeTitle = ref('Resume')
const isSaving = ref(false)

type DownloadFormat = 'pdf' | 'docx'
const downloadFormat = ref<DownloadFormat>('pdf')
const formatOptions = [
  { label: 'PDF', value: 'pdf' },
  { label: 'Word (DOCX)', value: 'docx' }
]

const isExporting = computed(() => isPdfExporting.value || isDocxExporting.value)

const activeTab = ref('content')
const mobilePanel = ref('edit')

const tabs = [
  { label: 'Content', value: 'content', icon: 'i-lucide-file-text' },
  { label: 'Design', value: 'design', icon: 'i-lucide-palette' }
]

const accentColor = ref('#0d9488')
const editingItem = ref<{ type: string, id: string | number | null }>({ type: '', id: null })

const previewZoom = ref(85)
const ZOOM_STEP = 10
const ZOOM_MIN = 40
const ZOOM_MAX = 100
function zoomIn() { previewZoom.value = Math.min(ZOOM_MAX, previewZoom.value + ZOOM_STEP) }
function zoomOut() { previewZoom.value = Math.max(ZOOM_MIN, previewZoom.value - ZOOM_STEP) }

const showEmptyState = ref(false)

const contactInfoForPreview = computed(() => ({
  firstName: careerIDStore.contactInfo?.firstName,
  lastName: careerIDStore.contactInfo?.lastName,
  email: careerIDStore.contactInfo?.email,
  phone: careerIDStore.contactInfo?.phone || undefined
}))

const linkedInUsername = computed(() => {
  const link = careerIDStore.profileSocialLinks.find(l => l.platformId === 1)
  if (!link?.url) return null
  const match = link.url.match(/linkedin\.com\/in\/([^/?]+)/i)
  return match ? match[1] : link.url
})

/**
 * Format date from YYYY-MM-DD to display format (e.g., "01/2023")
 */
function formatDateForDisplay(dateString: string | null | undefined): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${month}/${year}`
}

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

function formatLocationType(type: string): string {
  const types: Record<string, string> = {
    'on_site': 'On-site',
    'remote': 'Remote',
    'hybrid': 'Hybrid'
  }
  return types[type] || type
}

const profileData = computed(() => ({
  professionalSummary: careerIDStore.contactInfo?.summary || '',
  workExperience: careerIDStore.experience.map(exp => {
    let locationDisplay = ''
    if (exp.locationType === 'remote') {
      locationDisplay = 'Remote'
    } else {
      locationDisplay = exp.location || formatLocationType(exp.locationType)
    }
    return {
      id: exp.id,
      employer: exp.employer,
      jobTitle: exp.title,
      employmentType: formatEmploymentType(exp.employmentType),
      locationType: locationDisplay,
      startDate: exp.startDate,
      endDate: exp.endDate,
      currentPosition: exp.currentPosition,
      highlights: (exp.highlights || []).map((h, index) => ({
        id: `${exp.id}-h${index}`,
        text: h
      }))
    }
  }),
  education: careerIDStore.education.map(edu => ({
    id: edu.id,
    institution: edu.institution,
    degree: edu.degreeType,
    areaOfStudy: edu.areaOfStudy || '',
    startDate: edu.startDate,
    endDate: edu.endDate
  })),
  skills: careerIDStore.profileSkills.map(skill => ({
    id: skill.name,
    name: skill.name,
    group: skill.group || 'Skills'
  })),
  certifications: careerIDStore.certifications.map(cert => ({
    id: cert.id,
    name: cert.name,
    issuer: cert.issuer || '',
    issueDate: cert.issueDate || ''
  }))
}))

const summaryEnabled = ref(false)
const workExperienceEnabled = ref(false)
const educationEnabled = ref(false)
const skillsEnabled = ref(false)
const certificationsEnabled = ref(false)

const selectedExperiences = ref<Set<string>>(new Set())
const selectedHighlights = ref<Set<string>>(new Set())
const selectedEducation = ref<Set<string>>(new Set())
const selectedSkills = ref<Set<string>>(new Set())
const selectedCertifications = ref<Set<string>>(new Set())

interface EditableHighlight {
  id: string
  text: string
  selected: boolean
}

interface EditableExperience {
  id: string | number
  employer: string
  jobTitle: string
  employmentType: string
  locationType: string
  startDate: string | null | undefined
  endDate: string | null | undefined
  currentPosition?: boolean
  highlights: EditableHighlight[]
  selected: boolean
}

interface EditableEducation {
  id: string | number
  institution: string
  degree: string
  areaOfStudy: string
  startDate: string | null | undefined
  endDate: string | null | undefined
  selected: boolean
}

interface EditableSkill {
  id: string | number
  name: string
  group?: string
  selected: boolean
}

interface EditableCertification {
  id: string | number
  name: string
  issuer: string
  issueDate: string
  selected: boolean
}

interface EditableData {
  summary: { text: string; enabled: boolean }
  workExperience: EditableExperience[]
  education: EditableEducation[]
  skills: EditableSkill[]
  certifications: EditableCertification[]
}

const editableData = ref<EditableData>({
  summary: { text: '', enabled: false },
  workExperience: [],
  education: [],
  skills: [],
  certifications: []
})

function initializeEditableData() {
  editableData.value = {
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
      selected: selectedSkills.value.has(skill.id)
    })),
    certifications: profileData.value.certifications.map(cert => ({
      ...cert,
      selected: selectedCertifications.value.has(String(cert.id))
    }))
  }
}

function syncSelectionsToEditableData() {
  editableData.value.summary.enabled = summaryEnabled.value

  const newWorkExperience: EditableExperience[] = []
  for (const exp of profileData.value.workExperience) {
    const isSelected = selectedExperiences.value.has(String(exp.id))
    if (!isSelected) continue
    const existing = editableData.value.workExperience.find(e => e.id === exp.id)
    if (existing) {
      const newHighlights: EditableHighlight[] = []
      for (const h of exp.highlights) {
        if (!selectedHighlights.value.has(h.id)) continue
        const existingH = existing.highlights.find(eh => eh.id === h.id)
        newHighlights.push(existingH ? { ...existingH, selected: true } : { ...h, selected: true })
      }
      newWorkExperience.push({ ...existing, selected: true, highlights: newHighlights })
    } else {
      newWorkExperience.push({
        ...exp,
        selected: true,
        highlights: exp.highlights
          .filter(h => selectedHighlights.value.has(h.id))
          .map(h => ({ ...h, selected: true }))
      })
    }
  }
  editableData.value.workExperience = newWorkExperience

  editableData.value.education = profileData.value.education
    .filter(edu => selectedEducation.value.has(String(edu.id)))
    .map(edu => {
      const existing = editableData.value.education.find(e => e.id === edu.id)
      return existing ? { ...existing, selected: true } : { ...edu, selected: true }
    })

  editableData.value.skills = profileData.value.skills
    .filter(skill => selectedSkills.value.has(skill.id))
    .map(skill => {
      const existing = editableData.value.skills.find(s => s.id === skill.id)
      return existing ? { ...existing, selected: true } : { ...skill, selected: true }
    })

  editableData.value.certifications = profileData.value.certifications
    .filter(cert => selectedCertifications.value.has(String(cert.id)))
    .map(cert => {
      const existing = editableData.value.certifications.find(c => c.id === cert.id)
      return existing ? { ...existing, selected: true } : { ...cert, selected: true }
    })
}

watch(
  [summaryEnabled, selectedExperiences, selectedHighlights, selectedEducation, selectedSkills, selectedCertifications],
  () => { syncSelectionsToEditableData() },
  { deep: true }
)

function initializeSelections() {
  if (profileData.value.professionalSummary) summaryEnabled.value = true
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
    profileData.value.skills.forEach(skill => selectedSkills.value.add(skill.id))
  }
  if (profileData.value.certifications.length > 0) {
    certificationsEnabled.value = true
    profileData.value.certifications.forEach(cert => selectedCertifications.value.add(String(cert.id)))
  }
  initializeEditableData()
}

// TODO(backend): Set resumeTitle from loaded docs_resumes.title
// TODO(backend): When resumeId is numeric, load content_snapshot and design_settings from API
// and call initializeFromSnapshot() instead of initializeSelections()
onMounted(async () => {
  const profileId = careerIDStore.profileId
  if (!profileId) {
    showEmptyState.value = true
    return
  }
  if (!careerIDStore.isProfileLoaded) {
    try {
      await careerIDStore.fetchProfile(profileId)
    } catch {
      showEmptyState.value = true
      return
    }
  }
  if (!careerIDStore.profile) {
    showEmptyState.value = true
    return
  }

  const contact = careerIDStore.contactInfo
  if (contact?.firstName || contact?.lastName) {
    const namePart = [contact.firstName, contact.lastName].filter(Boolean).join(' ')
    resumeTitle.value = resumeId === 'new'
      ? `${namePart} Resume`
      : `${namePart} Resume`
  }

  initializeSelections()
})

function toggleSection(section: 'summary' | 'workExperience' | 'education' | 'skills' | 'certifications') {
  switch (section) {
    case 'summary':
      summaryEnabled.value = !summaryEnabled.value
      break
    case 'workExperience':
      workExperienceEnabled.value = !workExperienceEnabled.value
      if (workExperienceEnabled.value) {
        profileData.value.workExperience.forEach(exp => {
          selectedExperiences.value.add(String(exp.id))
          exp.highlights.forEach(h => selectedHighlights.value.add(h.id))
        })
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
        profileData.value.skills.forEach(skill => selectedSkills.value.add(skill.id))
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

function formatDateRange(startDate: string | null | undefined, endDate: string | null | undefined, currentPosition?: boolean) {
  const startFormatted = formatDateForDisplay(startDate) || 'Unknown'
  if (currentPosition || !endDate) return `${startFormatted} - Present`
  return `${startFormatted} - ${formatDateForDisplay(endDate)}`
}

function formatMonthYear(dateStr: string | null | undefined) {
  return formatDateForDisplay(dateStr)
}

const groupedProfileSkills = computed(() => {
  const groups: Record<string, Array<{ id: string, name: string }>> = {}
  profileData.value.skills.forEach(skill => {
    const groupName = skill.group || 'Skills'
    if (!groups[groupName]) groups[groupName] = []
    groups[groupName].push({ id: skill.id, name: skill.name })
  })
  return Object.entries(groups).map(([group, skills]) => ({ group, skills }))
})

function isCategoryFullySelected(groupName: string): boolean {
  const category = groupedProfileSkills.value.find(g => g.group === groupName)
  if (!category) return false
  return category.skills.every(skill => selectedSkills.value.has(skill.id))
}

function isCategoryPartiallySelected(groupName: string): boolean {
  const category = groupedProfileSkills.value.find(g => g.group === groupName)
  if (!category) return false
  const count = category.skills.filter(skill => selectedSkills.value.has(skill.id)).length
  return count > 0 && count < category.skills.length
}

function toggleSkillCategory(groupName: string) {
  const category = groupedProfileSkills.value.find(g => g.group === groupName)
  if (!category) return
  if (isCategoryFullySelected(groupName)) {
    category.skills.forEach(skill => selectedSkills.value.delete(skill.id))
  } else {
    category.skills.forEach(skill => selectedSkills.value.add(skill.id))
  }
}

const hasSelectedContent = computed(() =>
  summaryEnabled.value ||
  selectedExperiences.value.size > 0 ||
  selectedEducation.value.size > 0 ||
  selectedSkills.value.size > 0 ||
  selectedCertifications.value.size > 0
)

const previewData = computed(() => editableData.value)

// TODO(backend): Persist to docs_resumes.content_snapshot and docs_resumes.design_settings
async function saveResume() {
  if (isSaving.value) return
  isSaving.value = true
  try {
    // stub — wire to PUT /api/docs/resumes/[id] when backend is ready
    await new Promise(resolve => setTimeout(resolve, 300))
  } finally {
    isSaving.value = false
  }
}

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
      // TODO(backend): log to docs_generated_resume_log after download
    } else {
      await generatePdf(options)
      // TODO(backend): log to docs_generated_resume_log after download
    }
  } catch (error) {
    console.error('Download failed:', error)
  }
}
</script>

<template>
  <UDashboardPanel id="resume" :ui="{ body: 'p-0 sm:p-0 lg:p-0' }">
    <template #header>
      <UDashboardNavbar :title="resumeTitle">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar v-if="!showEmptyState">
        <template #default>
          <div class="flex items-center justify-between w-full">
            <div class="flex gap-1 -mx-1">
              <!-- Mobile: Edit / Preview toggle -->
              <div class="flex lg:hidden gap-1">
                <UButton
                  label="Edit"
                  icon="i-lucide-pencil"
                  :color="mobilePanel === 'edit' ? 'primary' : 'neutral'"
                  :variant="mobilePanel === 'edit' ? 'subtle' : 'ghost'"
                  size="sm"
                  @click="mobilePanel = 'edit'"
                />
                <UButton
                  label="Preview"
                  icon="i-lucide-eye"
                  :color="mobilePanel === 'preview' ? 'primary' : 'neutral'"
                  :variant="mobilePanel === 'preview' ? 'subtle' : 'ghost'"
                  size="sm"
                  @click="mobilePanel = 'preview'"
                />
              </div>
              <!-- Desktop: Content / Design tabs -->
              <div class="hidden lg:flex gap-1">
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
            </div>
            <div class="flex items-center gap-2">
              <UButton
                label="Save"
                icon="i-lucide-save"
                color="neutral"
                variant="outline"
                size="sm"
                :loading="isSaving"
                :disabled="true"
                title="Saving coming soon"
                @click="saveResume"
              />
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
      <!-- Empty State -->
      <div v-if="showEmptyState" class="flex items-center justify-center p-8 min-h-[calc(100vh-8rem)]">
        <UPageCard variant="subtle" class="max-w-md w-full">
          <div class="flex flex-col items-center justify-center py-12 gap-4 text-center">
            <UIcon name="i-lucide-file-text" class="w-12 h-12 text-muted" />
            <div class="space-y-2">
              <h3 class="text-xl font-semibold">No Profile Yet</h3>
              <p class="text-muted text-base">
                You need to complete your profile before building a resume. Let's get started!
              </p>
            </div>
            <div class="space-y-3 w-full pt-2">
              <UButton
                label="Start Onboarding"
                icon="i-lucide-rocket"
                size="lg"
                color="primary"
                block
                @click="router.push('/profile/onboarding')"
              />
              <UButton
                label="Go to Profile"
                icon="i-lucide-user"
                size="lg"
                color="neutral"
                variant="outline"
                block
                @click="router.push('/profile')"
              />
            </div>
          </div>
        </UPageCard>
      </div>

      <!-- Resume Builder -->
      <div v-else class="flex flex-col lg:flex-row h-full min-h-[calc(100vh-8rem)]">
        <!-- Left Panel: Editor Controls -->
        <div
          class="w-full lg:w-2/5 xl:w-[35%] 2xl:w-[30%] overflow-y-auto p-4 sm:p-6 lg:border-r lg:border-default"
          :class="{ 'hidden lg:block': mobilePanel !== 'edit' }"
        >
          <!-- Mobile Content/Design sub-tabs -->
          <div class="flex lg:hidden gap-1 mb-4 -mx-1">
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

          <!-- Content Tab -->
          <DocsResumeContentEditorForm
            v-if="activeTab === 'content'"
            :editable-data="editableData"
            @update:editable-data="editableData = $event"
            @update:editing-item="editingItem = $event"
          />

          <!-- Design Tab -->
          <DocsResumeDesigner
            v-if="activeTab === 'design'"
            v-model="accentColor"
          />
        </div>

        <!-- Right Panel: Live Preview -->
        <div
          class="w-full lg:w-3/5 xl:w-[65%] 2xl:w-[70%] lg:sticky lg:top-0 lg:h-[calc(100vh-8rem)] flex flex-col bg-elevated/50"
          :class="{ 'hidden lg:flex': mobilePanel !== 'preview' }"
        >
          <!-- Zoom Controls -->
          <div class="flex items-center justify-end gap-1 px-4 py-2 border-b border-default shrink-0">
            <UButton
              icon="i-lucide-zoom-out"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="previewZoom <= ZOOM_MIN"
              @click="zoomOut"
            />
            <span class="text-xs text-muted tabular-nums w-8 text-center">{{ previewZoom }}%</span>
            <UButton
              icon="i-lucide-zoom-in"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="previewZoom >= ZOOM_MAX"
              @click="zoomIn"
            />
          </div>
          <!-- Preview Area -->
          <div class="flex-1 overflow-auto p-4 sm:p-6">
            <div
              :style="{
                transformOrigin: 'top center',
                transform: `scale(${previewZoom / 100})`,
                width: `${(100 / previewZoom) * 100}%`,
                marginLeft: `${-((100 / previewZoom) - 1) * 50}%`
              }"
            >
              <DocsResumePreview
                :accent-color="accentColor"
                :contact-info="contactInfoForPreview"
                :linked-in-username="linkedInUsername"
                :job-title="careerIDStore.contactInfo?.jobTitle || ''"
                :selected-content="previewData"
                :editing-item="editingItem"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
