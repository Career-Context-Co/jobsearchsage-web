<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const careerIDStore = useCareerIDStore()
const { generatePdf, isGenerating: isPdfExporting } = usePdfLibResume()
const { generateDocx, isGenerating: isDocxExporting } = useDocxResume()

const resumeId = route.params.id as string

const resumeTitle = ref('')
const isEditingTitle = ref(false)
const editingTitleValue = ref('')
const isLoading = ref(true)
const showEmptyState = ref(false)
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
const editingItem = ref<{ type: string; id: string | number | null }>({ type: '', id: null })

const previewZoom = ref(100)
const ZOOM_STEP = 25
const ZOOM_MIN = 75
const ZOOM_MAX = 200
function zoomIn() { previewZoom.value = Math.min(ZOOM_MAX, previewZoom.value + ZOOM_STEP) }
function zoomOut() { previewZoom.value = Math.max(ZOOM_MIN, previewZoom.value - ZOOM_STEP) }

// Contact info for the preview is always read from the live profile store
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

// Safe defaults prevent null/undefined from reaching child components
const emptyEditableData = (): EditableData => ({
  summary: { text: '', enabled: false },
  workExperience: [],
  education: [],
  skills: [],
  certifications: []
})

const editableData = ref<EditableData>(emptyEditableData())

onMounted(async () => {
  // Redirect bare /docs/resumes/new to the list — new resumes are created from there
  if (resumeId === 'new') {
    await router.replace('/docs/resumes')
    return
  }

  // Ensure profile is loaded for the preview contact info
  const profileId = careerIDStore.profileId
  if (profileId && !careerIDStore.isProfileLoaded) {
    try { await careerIDStore.fetchProfile(profileId) } catch {}
  }

  try {
    const result = await $fetch<{
      success: boolean
      data: {
        id: string
        title: string
        content: EditableData
        designSettings: { accentColor?: string }
      }
    }>(`/api/docs/resumes/${resumeId}`)

    if (result.success && result.data) {
      resumeTitle.value = result.data.title
      // Merge with defaults to guard against missing fields from older snapshots
      const c = result.data.content || {}
      editableData.value = {
        summary: c.summary ?? { text: '', enabled: false },
        workExperience: c.workExperience ?? [],
        education: c.education ?? [],
        skills: c.skills ?? [],
        certifications: c.certifications ?? []
      }
      accentColor.value = result.data.designSettings?.accentColor ?? '#0d9488'
    } else {
      showEmptyState.value = true
    }
  } catch {
    showEmptyState.value = true
  } finally {
    isLoading.value = false
  }
})

const hasSelectedContent = computed(() =>
  editableData.value.summary.enabled ||
  editableData.value.workExperience.some(e => e.selected) ||
  editableData.value.education.some(e => e.selected) ||
  editableData.value.skills.some(s => s.selected) ||
  editableData.value.certifications.some(c => c.selected)
)

function startEditingTitle() {
  editingTitleValue.value = resumeTitle.value
  isEditingTitle.value = true
}

async function commitTitleRename() {
  const newTitle = editingTitleValue.value.trim()
  isEditingTitle.value = false
  if (!newTitle || newTitle === resumeTitle.value) return
  resumeTitle.value = newTitle
  try {
    await $fetch(`/api/docs/resumes/${resumeId}`, {
      method: 'PUT',
      body: { title: newTitle }
    })
  } catch {
    // non-critical — title shown locally even if server save fails
  }
}

function cancelTitleRename() {
  isEditingTitle.value = false
  editingTitleValue.value = ''
}

async function saveResume() {
  if (isSaving.value) return
  isSaving.value = true
  try {
    await $fetch(`/api/docs/resumes/${resumeId}`, {
      method: 'PUT',
      body: {
        content: editableData.value,
        designSettings: { accentColor: accentColor.value }
      }
    })
  } finally {
    isSaving.value = false
  }
}

async function downloadResume() {
  const options = {
    accentColor: accentColor.value,
    contactInfo: contactInfoForPreview.value,
    jobTitle: careerIDStore.contactInfo?.jobTitle || '',
    selectedContent: editableData.value,
    socialLinks: careerIDStore.profileSocialLinks
  }
  try {
    if (downloadFormat.value === 'docx') {
      await generateDocx(options)
    } else {
      await generatePdf(options)
    }
    // Log download — non-blocking, never fails the export
    $fetch(`/api/docs/resumes/${resumeId}/downloads`, {
      method: 'POST',
      body: { downloadFormat: downloadFormat.value }
    }).catch(() => {})
  } catch (error) {
    console.error('Download failed:', error)
  }
}
</script>

<template>
  <UDashboardPanel id="resume" :ui="{ body: 'p-0 sm:p-0 lg:p-0' }">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #title>
          <!-- Editing mode -->
          <div v-if="isEditingTitle" class="flex items-center gap-1">
            <UInput
              v-model="editingTitleValue"
              size="sm"
              class="w-64 max-w-full font-mono text-sm"
              autofocus
              @keyup.enter="commitTitleRename"
              @keyup.escape="cancelTitleRename"
              @blur="commitTitleRename"
            />
          </div>
          <!-- Display mode -->
          <div v-else class="flex items-center gap-1 min-w-0 group/title">
            <span class="font-semibold truncate">{{ resumeTitle || 'Resume' }}</span>
            <UButton
              v-if="!isLoading && !showEmptyState"
              icon="i-lucide-pencil"
              color="neutral"
              variant="ghost"
              size="xs"
              class="opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0"
              @click="startEditingTitle"
            />
          </div>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar v-if="!isLoading && !showEmptyState">
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
      <!-- Loading state -->
      <div v-if="isLoading" class="flex items-center justify-center p-8 min-h-[calc(100vh-8rem)]">
        <UIcon name="i-lucide-loader-circle" class="w-8 h-8 text-muted animate-spin" />
      </div>

      <!-- Empty / not found state -->
      <div v-else-if="showEmptyState" class="flex items-center justify-center p-8 min-h-[calc(100vh-8rem)]">
        <UPageCard variant="subtle" class="max-w-md w-full">
          <div class="flex flex-col items-center justify-center py-12 gap-4 text-center">
            <UIcon name="i-lucide-file-x" class="w-12 h-12 text-muted" />
            <div class="space-y-2">
              <h3 class="text-xl font-semibold">Resume Not Found</h3>
              <p class="text-muted text-base">
                This resume couldn't be loaded. It may have been deleted or you may not have access.
              </p>
            </div>
            <UButton
              label="Back to Resumes"
              icon="i-lucide-arrow-left"
              size="lg"
              color="primary"
              @click="router.push('/docs/resumes')"
            />
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

          <DocsResumeContentEditorForm
            v-if="activeTab === 'content'"
            :editable-data="editableData"
            @update:editable-data="editableData = $event"
            @update:editing-item="editingItem = $event"
          />

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
          <div class="flex items-center justify-end gap-1 px-4 py-2 border-b border-default shrink-0">
            <UButton
              icon="i-lucide-zoom-out"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="previewZoom <= ZOOM_MIN"
              @click="zoomOut"
            />
            <span class="text-xs text-muted tabular-nums min-w-10 text-center inline-block">{{ previewZoom }}%</span>
            <UButton
              icon="i-lucide-zoom-in"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="previewZoom >= ZOOM_MAX"
              @click="zoomIn"
            />
          </div>
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
                :selected-content="editableData"
                :editing-item="editingItem"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
