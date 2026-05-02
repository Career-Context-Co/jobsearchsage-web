<script setup lang="ts">
import type { ResumeContent } from '#shared/types/docs'

const route = useRoute()
const router = useRouter()
const careerIDStore = useCareerIDStore()
const docsStore = useDocsStore()
const { generatePdf, isGenerating: isPdfExporting } = usePdfLibResume()
const { generateDocx, isGenerating: isDocxExporting } = useDocxResume()

const resumeId = route.params.id as string

const resumeTitle = ref('')
const isEditingTitle = ref(false)
const editingTitleValue = ref('')
const showEmptyState = ref(false)

type DownloadFormat = 'pdf' | 'docx'
const downloadFormat = ref<DownloadFormat>('pdf')
const formatOptions = [
  { label: 'PDF', value: 'pdf' },
  { label: 'Word (DOCX)', value: 'docx' }
]

const isLoading = computed(() => docsStore.isLoading)
const isSaving = computed(() => docsStore.isSaving)
const isExporting = computed(() => isPdfExporting.value || isDocxExporting.value)

const activeTab = ref('content')
const mobilePanel = ref('edit')

const tabs = [
  { label: 'Content', value: 'content', icon: 'i-lucide-file-text' },
  { label: 'Design', value: 'design', icon: 'i-lucide-palette' }
]

const accentColor = ref('#0d9488')
const headerStyle = ref<'classic' | 'bold' | 'minimal'>('classic')
const profileSnapshotAt = ref<string | undefined>(undefined)
const editingItem = ref<{ type: string; id: string | number | null }>({ type: '', id: null })

const previewZoom = ref(100)
const ZOOM_STEP = 25
const ZOOM_MIN = 50
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

const DEFAULT_SECTION_ORDER = ['summary', 'workExperience', 'education', 'skills', 'certifications']

// Strip UI-only flags before persisting to the database
function cleanForSave(data: ResumeContent): ResumeContent {
  return {
    ...data,
    summaries: data.summaries.map(({ isNew: _, ...s }) => s),
    workExperience: data.workExperience.map(e => {
      const { ...rest } = e as any
      delete rest.isNew
      return rest
    }),
    education: data.education.map(e => {
      const { ...rest } = e as any
      delete rest.isNew
      return rest
    }),
    skills: data.skills.map(s => {
      const { ...rest } = s as any
      delete rest.isNew
      return rest
    }),
    certifications: data.certifications.map(c => {
      const { ...rest } = c as any
      delete rest.isNew
      return rest
    })
  }
}

const emptyEditableData = (): ResumeContent => ({
  summaries: [],
  workExperience: [],
  education: [],
  skills: [],
  certifications: [],
  sectionOrder: [...DEFAULT_SECTION_ORDER]
})

const editableData = ref<ResumeContent>(emptyEditableData())

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
    const resume = await docsStore.getResume(resumeId)
    if (resume) {
      resumeTitle.value = resume.title
      // Merge with defaults to guard against missing fields from older snapshots
      const c = resume.content as any
      editableData.value = {
        // Backward compat: old resumes have `summary` (single object), new ones have `summaries[]`
        summaries: c?.summaries ?? (c?.summary
          ? [{ id: 'summary-0', text: c.summary.text ?? '', enabled: c.summary.enabled ?? false }]
          : []),
        workExperience: c?.workExperience ?? [],
        education: c?.education ?? [],
        skills: c?.skills ?? [],
        certifications: c?.certifications ?? [],
        sectionOrder: c?.sectionOrder ?? [...DEFAULT_SECTION_ORDER],
        sectionLabels: c?.sectionLabels ?? undefined
      }
      accentColor.value = resume.designSettings?.accentColor ?? '#0d9488'
      headerStyle.value = resume.designSettings?.headerStyle ?? 'classic'
      profileSnapshotAt.value = resume.designSettings?.profileSnapshotAt
    } else {
      showEmptyState.value = true
    }
  } catch {
    showEmptyState.value = true
  }
})

const hasSelectedContent = computed(() =>
  editableData.value.summaries.some(s => s.enabled) ||
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
    await docsStore.updateResume(resumeId, { title: newTitle })
  } catch {
    // non-critical — title shown locally even if server save fails
  }
}

function cancelTitleRename() {
  isEditingTitle.value = false
  editingTitleValue.value = ''
}

const { buildSnapshot } = useResumeSnapshot()

// ---- Sync from Profile ----

const toast = useToast()
const syncAddedCount = ref<number | null>(null)

async function handleSync() {
  // Always force a fresh fetch so any profile edits since page load are picked up
  await careerIDStore.fetchProfileByUser()

  const fresh: ResumeContent = buildSnapshot()
  const current = editableData.value
  let addedCount = 0

  function getId(item: { id: string | number }) { return String(item.id) }

  // Does the fresh profile version differ from the resume version on key fields?
  function contentDiffers(existingItem: any, freshItem: any, keys: string[]): boolean {
    return keys.some(k => existingItem[k] !== freshItem[k])
  }

  // Is there already a synced copy (id = `${baseId}-sync-*`) whose content matches the fresh item?
  // Prevents duplicate copies from being added on repeated syncs.
  function syncedCopyExists(section: any[], freshItem: any, keys: string[], baseId: string): boolean {
    const prefix = `${baseId}-sync-`
    return section.some(existing => String(existing.id).startsWith(prefix) && !contentDiffers(existing, freshItem, keys))
  }

  // Build a lookup of existing resume items by ID for content comparison
  const existingExpById = Object.fromEntries(current.workExperience.map(e => [getId(e), e]))
  const existingEduById = Object.fromEntries(current.education.map(e => [getId(e), e]))
  const existingCertById = Object.fromEntries(current.certifications.map(c => [getId(c), c]))

  // Summary: add if text not already present
  const existingSummaryTexts = new Set(current.summaries.map(s => s.text.trim()))
  const newSummaries = fresh.summaries
    .filter(s => !existingSummaryTexts.has(s.text.trim()))
    .map(s => ({ ...s, id: `summary-${Date.now()}`, isNew: true, enabled: false }))

  const EXP_KEYS = ['employer', 'jobTitle', 'startDate', 'endDate', 'currentPosition']
  const EDU_KEYS = ['institution', 'degree', 'areaOfStudy']
  const CERT_KEYS = ['name', 'issuer', 'issueDate']

  // Experiences: add new IDs + add synced copies of changed existing items (once only)
  const existingExpIds = new Set(current.workExperience.map(getId))
  const newExps = fresh.workExperience
    .filter(e => !existingExpIds.has(getId(e)))
    .map(e => ({ ...e, selected: false, isNew: true }))
  const updatedExps = fresh.workExperience
    .filter(e => existingExpIds.has(getId(e))
      && contentDiffers(existingExpById[getId(e)], e, EXP_KEYS)
      && !syncedCopyExists(current.workExperience, e, EXP_KEYS, getId(e)))
    .map(e => ({ ...e, id: `${e.id}-sync-${Date.now()}`, selected: false, isNew: true }))

  // Education: same pattern
  const existingEduIds = new Set(current.education.map(getId))
  const newEdus = fresh.education
    .filter(e => !existingEduIds.has(getId(e)))
    .map(e => ({ ...e, selected: false, isNew: true }))
  const updatedEdus = fresh.education
    .filter(e => existingEduIds.has(getId(e))
      && contentDiffers(existingEduById[getId(e)], e, EDU_KEYS)
      && !syncedCopyExists(current.education, e, EDU_KEYS, getId(e)))
    .map(e => ({ ...e, id: `${e.id}-sync-${Date.now()}`, selected: false, isNew: true }))

  // Skills: additive by name-as-ID only (no per-skill updatedAt)
  const existingSkillIds = new Set(current.skills.map(getId))
  const newSkills = fresh.skills
    .filter(s => !existingSkillIds.has(getId(s)))
    .map(s => ({ ...s, selected: false, isNew: true }))

  // Certifications: same pattern as experience
  const existingCertIds = new Set(current.certifications.map(getId))
  const newCerts = fresh.certifications
    .filter(c => !existingCertIds.has(getId(c)))
    .map(c => ({ ...c, selected: false, isNew: true }))
  const updatedCerts = fresh.certifications
    .filter(c => existingCertIds.has(getId(c))
      && contentDiffers(existingCertById[getId(c)], c, CERT_KEYS)
      && !syncedCopyExists(current.certifications, c, CERT_KEYS, getId(c)))
    .map(c => ({ ...c, id: `${c.id}-sync-${Date.now()}`, selected: false, isNew: true }))

  addedCount = newSummaries.length + newExps.length + updatedExps.length + newEdus.length + updatedEdus.length + newSkills.length + newCerts.length + updatedCerts.length

  editableData.value = {
    ...current,
    summaries: [...current.summaries, ...newSummaries],
    workExperience: [...current.workExperience, ...newExps, ...updatedExps],
    education: [...current.education, ...newEdus, ...updatedEdus],
    skills: [...current.skills, ...newSkills],
    certifications: [...current.certifications, ...newCerts, ...updatedCerts]
  }

  profileSnapshotAt.value = new Date().toISOString()
  syncAddedCount.value = addedCount

  if (addedCount > 0) {
    const updatedCount = updatedExps.length + updatedEdus.length + updatedCerts.length
    const newCount = addedCount - updatedCount
    const parts: string[] = []
    if (newCount > 0) parts.push(`${newCount} new item${newCount > 1 ? 's' : ''} added`)
    if (updatedCount > 0) parts.push(`${updatedCount} updated item${updatedCount > 1 ? 's' : ''} added as a copy`)
    toast.add({
      title: 'Profile synced',
      description: `${parts.join(' · ')} — highlighted in each section. Delete whichever version you don't want.`,
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } else {
    toast.add({
      title: 'Already up to date',
      description: 'No new or updated items found in your profile.',
      color: 'neutral',
      icon: 'i-lucide-check'
    })
  }

  await saveResume()
}

async function saveResume() {
  if (docsStore.isSaving) return
  try {
    await docsStore.updateResume(resumeId, {
      content: cleanForSave(editableData.value),
      designSettings: {
        accentColor: accentColor.value,
        headerStyle: headerStyle.value,
        profileSnapshotAt: profileSnapshotAt.value
      }
    })
  } catch (err) {
    console.error('[Resume] Save failed:', err)
  }
}

async function downloadResume() {
  const options = {
    accentColor: accentColor.value,
    headerStyle: headerStyle.value,
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
                  class="cursor-pointer"
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
                class="cursor-pointer"
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
                class="w-32 cursor-pointer"
              />
              <UButton
                class="cursor-pointer"
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
            :profile-snapshot-at="profileSnapshotAt"
            :sync-added-count="syncAddedCount"
            @update:editable-data="editableData = $event"
            @update:editing-item="editingItem = $event"
            @sync="handleSync"
          />

          <DocsResumeDesigner
            v-if="activeTab === 'design'"
            v-model:accent-color="accentColor"
            v-model:header-style="headerStyle"
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
                :header-style="headerStyle"
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
