<script setup lang="ts">
interface Highlight {
  id: string
  text: string
  selected: boolean
}

interface WorkExperience {
  id: string | number
  employer: string
  jobTitle: string
  employmentType: string
  locationType: string
  startDate: string | null | undefined
  endDate: string | null | undefined
  currentPosition?: boolean
  highlights: Highlight[]
  selected: boolean
  isNew?: boolean
}

interface Education {
  id: string | number
  institution: string
  degree: string
  areaOfStudy: string
  startDate: string | null | undefined
  endDate: string | null | undefined
  selected: boolean
  isNew?: boolean
}

interface Skill {
  id: string | number
  name: string
  group?: string
  selected: boolean
  isNew?: boolean
}

interface Certification {
  id: string | number
  name: string
  issuer: string
  issueDate: string
  selected: boolean
  isNew?: boolean
}

interface Summary {
  id: string
  text: string
  enabled: boolean
  isNew?: boolean
}

interface EditableData {
  summaries: Summary[]
  workExperience: WorkExperience[]
  education: Education[]
  skills: Skill[]
  certifications: Certification[]
  sectionOrder?: string[]
  sectionLabels?: Record<string, string>
}

const props = defineProps<{
  editableData: EditableData
  profileSnapshotAt?: string
  syncAddedCount?: number | null
}>()

const emit = defineEmits<{
  'update:editableData': [data: EditableData]
  'update:editingItem': [item: { type: string; id: string | number | null }]
  'sync': []
}>()

const isSyncing = ref(false)

watch(() => props.syncAddedCount, () => {
  isSyncing.value = false
}, { flush: 'post' })

function triggerSync() {
  isSyncing.value = true
  emit('sync')
}

function formatSnapshotDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ---- Section order ----

const DEFAULT_SECTION_ORDER = ['summary', 'workExperience', 'education', 'skills', 'certifications']
const sectionOrder = computed(() => props.editableData.sectionOrder ?? DEFAULT_SECTION_ORDER)

function moveSectionUp(key: string) {
  const order = [...sectionOrder.value]
  const idx = order.indexOf(key)
  if (idx <= 0) return
  ;[order[idx - 1], order[idx]] = [order[idx], order[idx - 1]]
  emit('update:editableData', { ...props.editableData, sectionOrder: order })
}

function moveSectionDown(key: string) {
  const order = [...sectionOrder.value]
  const idx = order.indexOf(key)
  if (idx === -1 || idx >= order.length - 1) return
  ;[order[idx], order[idx + 1]] = [order[idx + 1], order[idx]]
  emit('update:editableData', { ...props.editableData, sectionOrder: order })
}

// ---- Section expand/collapse ----

const openSections = ref<Set<string>>(new Set())
// Draft label values while the user is typing (committed on blur/enter)
const sectionLabelDrafts = ref<Record<string, string>>({})

function toggleSection(key: string) {
  if (openSections.value.has(key)) {
    openSections.value.delete(key)
    delete sectionLabelDrafts.value[key]
  } else {
    openSections.value.add(key)
    sectionLabelDrafts.value[key] = props.editableData.sectionLabels?.[key] ?? SECTION_LABELS[key]?.label ?? key
  }
}

function getSectionLabel(key: string): string {
  return props.editableData.sectionLabels?.[key] ?? SECTION_LABELS[key]?.label ?? key
}

function commitSectionLabel(key: string) {
  const draft = (sectionLabelDrafts.value[key] ?? '').trim()
  const defaultLabel = SECTION_LABELS[key]?.label ?? key
  const current = props.editableData.sectionLabels?.[key]
  if (draft === (current ?? defaultLabel)) return
  const labels = { ...(props.editableData.sectionLabels ?? {}) }
  if (draft && draft !== defaultLabel) {
    labels[key] = draft
  } else {
    delete labels[key]
  }
  emit('update:editableData', { ...props.editableData, sectionLabels: labels })
}

// ---- Selection toggles ----

function toggleSummaryEnabled(id: string, enabled: boolean) {
  emit('update:editableData', {
    ...props.editableData,
    summaries: props.editableData.summaries.map(s => s.id === id ? { ...s, enabled } : s)
  })
}

function toggleItem(
  section: 'workExperience' | 'education' | 'certifications',
  id: string | number,
  selected: boolean
) {
  const items = [...(props.editableData[section] as any[])]
  const idx = items.findIndex((i: any) => i.id === id)
  if (idx === -1) return
  if (section === 'workExperience') {
    items[idx] = { ...items[idx], selected, highlights: items[idx].highlights.map((h: any) => ({ ...h, selected })) }
  } else {
    items[idx] = { ...items[idx], selected }
  }
  emit('update:editableData', { ...props.editableData, [section]: items })
}

function toggleSkill(id: string | number, selected: boolean) {
  emit('update:editableData', {
    ...props.editableData,
    skills: props.editableData.skills.map(s => s.id === id ? { ...s, selected } : s)
  })
}

// ---- Edit draft state ----
// Only one item edits at a time. editDraft holds a deep copy of the item.
// Most changes mutate the draft and only Save emits; achievement reorder also emits
// immediately so the preview stays in sync. Cancel restores work experience from baseline when set.

function cloneWorkExperience(exp: WorkExperience): WorkExperience {
  return {
    ...exp,
    highlights: exp.highlights.map(h => ({ ...h }))
  }
}

const editDraft = ref<any>(null)
/** Snapshot when opening work-experience edit — used to revert parent on Cancel after live highlight reorder. */
const experienceEditBaseline = ref<WorkExperience | null>(null)

const editingSummary = ref<string | null>(null)
const editingExperienceId = ref<string | number | null>(null)
const editingEducationId = ref<string | number | null>(null)
const editingCertificationId = ref<string | number | null>(null)
const editingSkills = ref(false)

function startEditSummary(summary: Summary) {
  experienceEditBaseline.value = null
  editDraft.value = { ...summary }
  editingSummary.value = summary.id
  emit('update:editingItem', { type: 'summary', id: summary.id })
}

function startEditExperience(exp: WorkExperience) {
  experienceEditBaseline.value = cloneWorkExperience(exp)
  editDraft.value = { ...exp, highlights: exp.highlights.map(h => ({ ...h })) }
  editingExperienceId.value = exp.id
  emit('update:editingItem', { type: 'experience', id: exp.id })
}

function startEditEducation(edu: Education) {
  experienceEditBaseline.value = null
  editDraft.value = { ...edu }
  editingEducationId.value = edu.id
  emit('update:editingItem', { type: 'education', id: edu.id })
}

function startEditCertification(cert: Certification) {
  experienceEditBaseline.value = null
  editDraft.value = { ...cert }
  editingCertificationId.value = cert.id
  emit('update:editingItem', { type: 'certification', id: cert.id })
}

function saveEdit() {
  if (!editDraft.value) return
  const newData = { ...props.editableData }

  if (editingExperienceId.value !== null) {
    const items = [...newData.workExperience]
    const idx = items.findIndex(i => i.id === editingExperienceId.value)
    if (idx !== -1) items[idx] = editDraft.value
    newData.workExperience = items
    editingExperienceId.value = null
    experienceEditBaseline.value = null
  } else if (editingEducationId.value !== null) {
    const items = [...newData.education]
    const idx = items.findIndex(i => i.id === editingEducationId.value)
    if (idx !== -1) items[idx] = editDraft.value
    newData.education = items
    editingEducationId.value = null
  } else if (editingCertificationId.value !== null) {
    const items = [...newData.certifications]
    const idx = items.findIndex(i => i.id === editingCertificationId.value)
    if (idx !== -1) items[idx] = editDraft.value
    newData.certifications = items
    editingCertificationId.value = null
  } else if (editingSummary.value !== null) {
    const items = [...newData.summaries]
    const idx = items.findIndex(i => i.id === editingSummary.value)
    if (idx !== -1) items[idx] = editDraft.value
    newData.summaries = items
    editingSummary.value = null
  }

  editDraft.value = null
  emit('update:editableData', newData)
  emit('update:editingItem', { type: '', id: null })
}

function cancelEdit() {
  if (editingExperienceId.value !== null && experienceEditBaseline.value !== null) {
    const baseline = experienceEditBaseline.value
    const restored = props.editableData.workExperience.map(e =>
      e.id === baseline.id ? cloneWorkExperience(baseline) : e
    )
    emit('update:editableData', { ...props.editableData, workExperience: restored })
  }
  experienceEditBaseline.value = null
  editDraft.value = null
  editingSummary.value = null
  editingExperienceId.value = null
  editingEducationId.value = null
  editingCertificationId.value = null
  emit('update:editingItem', { type: '', id: null })
}

function stopAll() {
  cancelEdit()
  editingSkills.value = false
}

// ---- Delete items ----

function deleteItem(section: 'summaries' | 'workExperience' | 'education' | 'certifications', id: string | number) {
  const newData = { ...props.editableData }
  if (section === 'summaries') {
    newData.summaries = newData.summaries.filter(s => s.id !== id)
  } else if (section === 'workExperience') {
    newData.workExperience = newData.workExperience.filter(e => e.id !== id)
  } else if (section === 'education') {
    newData.education = newData.education.filter(e => e.id !== id)
  } else if (section === 'certifications') {
    newData.certifications = newData.certifications.filter(c => c.id !== id)
  }
  emit('update:editableData', newData)
}

// ---- Highlight reordering (operates on editDraft) ----

function moveHighlight(selectedIdx: number, dir: 'up' | 'down') {
  if (!editDraft.value) return
  const highlights = editDraft.value.highlights as Highlight[]
  const selectedWithFullIdx = highlights
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => h.selected)

  const targetSelectedIdx = dir === 'up' ? selectedIdx - 1 : selectedIdx + 1
  if (targetSelectedIdx < 0 || targetSelectedIdx >= selectedWithFullIdx.length) return

  const idxA = selectedWithFullIdx[selectedIdx]!.i
  const idxB = selectedWithFullIdx[targetSelectedIdx]!.i

  const newHighlights = [...highlights]
  const tmp = newHighlights[idxA]!
  newHighlights[idxA] = newHighlights[idxB]!
  newHighlights[idxB] = tmp
  editDraft.value = { ...editDraft.value, highlights: newHighlights }

  const expId = editingExperienceId.value
  if (expId === null) return
  const workExperience = props.editableData.workExperience.map(e =>
    e.id === expId ? { ...e, highlights: newHighlights } : e
  )
  emit('update:editableData', { ...props.editableData, workExperience })
}

// ---- Skills tag editing (live — no draft, different interaction pattern) ----

function updateSkillTags(groupName: string, newTags: string[]) {
  const updatedData = { ...props.editableData }
  const existingInGroup = updatedData.skills.filter(s => s.selected && (s.group || 'Skills') === groupName)
  const existingNames = existingInGroup.map(s => s.name)
  const removedNames = existingNames.filter(n => !newTags.includes(n))
  const addedNames = newTags.filter(n => !existingNames.includes(n))
  updatedData.skills = updatedData.skills.map(skill => {
    if (skill.selected && (skill.group || 'Skills') === groupName && removedNames.includes(skill.name)) {
      return { ...skill, selected: false }
    }
    return skill
  })
  addedNames.forEach(name => {
    updatedData.skills.push({
      id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      group: groupName === 'Skills' ? undefined : groupName,
      selected: true
    })
  })
  emit('update:editableData', updatedData)
}

// ---- Date helpers ----

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Present'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function formatDateForInput(dateString: string | null | undefined): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

function parseDateFromInput(value: string): string {
  if (!value) return ''
  const match = value.match(/^(\d{1,2})\/(\d{4})$/)
  if (match) return `${match[2]}-${match[1].padStart(2, '0')}-01`
  return value
}

// ---- Derived views ----

const groupedAllSkills = computed(() => {
  const groups: Record<string, Skill[]> = {}
  props.editableData.skills.forEach(skill => {
    const g = skill.group || 'Skills'
    if (!groups[g]) groups[g] = []
    groups[g].push(skill)
  })
  return Object.entries(groups).map(([group, skills]) => ({ group, skills }))
})

const groupedSelectedSkills = computed(() => {
  const groups: Record<string, Skill[]> = {}
  props.editableData.skills.filter(s => s.selected).forEach(skill => {
    const g = skill.group || 'Skills'
    if (!groups[g]) groups[g] = []
    groups[g].push(skill)
  })
  return Object.entries(groups).map(([group, skills]) => ({ group, skills }))
})

// ---- Section labels ----

const SECTION_LABELS: Record<string, { label: string; icon: string }> = {
  summary: { label: 'Professional Summary', icon: 'i-lucide-text-cursor-input' },
  workExperience: { label: 'Work Experience', icon: 'i-lucide-briefcase' },
  education: { label: 'Education', icon: 'i-lucide-graduation-cap' },
  skills: { label: 'Skills', icon: 'i-lucide-lightbulb' },
  certifications: { label: 'Certifications', icon: 'i-lucide-award' }
}

function sectionHasAnyItems(key: string): boolean {
  if (key === 'summary') return props.editableData.summaries.length > 0
  if (key === 'workExperience') return props.editableData.workExperience.length > 0
  if (key === 'education') return props.editableData.education.length > 0
  if (key === 'skills') return props.editableData.skills.length > 0
  if (key === 'certifications') return props.editableData.certifications.length > 0
  return false
}

function sectionSelectedCount(key: string): { selected: number; total: number } {
  if (key === 'summary') {
    const total = props.editableData.summaries.length
    const selected = props.editableData.summaries.filter(s => s.enabled).length
    return { selected, total }
  }
  if (key === 'workExperience') {
    const total = props.editableData.workExperience.length
    const selected = props.editableData.workExperience.filter(e => e.selected).length
    return { selected, total }
  }
  if (key === 'education') {
    const total = props.editableData.education.length
    const selected = props.editableData.education.filter(e => e.selected).length
    return { selected, total }
  }
  if (key === 'skills') {
    const total = props.editableData.skills.length
    const selected = props.editableData.skills.filter(s => s.selected).length
    return { selected, total }
  }
  if (key === 'certifications') {
    const total = props.editableData.certifications.length
    const selected = props.editableData.certifications.filter(c => c.selected).length
    return { selected, total }
  }
  return { selected: 0, total: 0 }
}

const hasAnyContent = computed(() =>
  props.editableData.summaries.length > 0 ||
  props.editableData.workExperience.length > 0 ||
  props.editableData.education.length > 0 ||
  props.editableData.skills.length > 0 ||
  props.editableData.certifications.length > 0
)

// ---- Sorted item lists (selected first, then unselected; both groups sorted recent-first) ----

function dateVal(d: string | null | undefined): number {
  return d ? new Date(d).getTime() : 0
}

const sortedWorkExperience = computed(() => {
  const sel = props.editableData.workExperience.filter(e => e.selected)
    .slice().sort((a, b) => dateVal(b.startDate) - dateVal(a.startDate))
  const unsel = props.editableData.workExperience.filter(e => !e.selected)
    .slice().sort((a, b) => dateVal(b.startDate) - dateVal(a.startDate))
  return [...sel, ...unsel]
})

const sortedEducation = computed(() => {
  const sel = props.editableData.education.filter(e => e.selected)
    .slice().sort((a, b) => dateVal(b.endDate) - dateVal(a.endDate))
  const unsel = props.editableData.education.filter(e => !e.selected)
    .slice().sort((a, b) => dateVal(b.endDate) - dateVal(a.endDate))
  return [...sel, ...unsel]
})

const sortedCertifications = computed(() => {
  const sel = props.editableData.certifications.filter(c => c.selected)
    .slice().sort((a, b) => dateVal(b.issueDate) - dateVal(a.issueDate))
  const unsel = props.editableData.certifications.filter(c => !c.selected)
    .slice().sort((a, b) => dateVal(b.issueDate) - dateVal(a.issueDate))
  return [...sel, ...unsel]
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold mb-0.5">Content</h2>
        <p class="text-sm text-muted">
          Select items, reorder sections, and refine your resume. Edits won't affect your profile.
          <span v-if="profileSnapshotAt">Last synced {{ formatSnapshotDate(profileSnapshotAt) }}.</span>
        </p>
      </div>
      <UButton
        label="Sync from Profile"
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="outline"
        size="sm"
        class="cursor-pointer shrink-0"
        :loading="isSyncing"
        @click="triggerSync"
      />
    </div>

    <!-- Empty state -->
    <div v-if="!hasAnyContent" class="text-center py-12 text-muted">
      <UIcon name="i-lucide-file-x" class="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p class="text-lg font-medium">Nothing here yet</p>
      <p class="text-sm">Use <strong>Sync from Profile</strong> to pull in your latest profile data.</p>
    </div>

    <!-- Sections list -->
    <div v-if="hasAnyContent" class="space-y-2">
      <div v-for="(sectionKey, sectionIdx) in sectionOrder" :key="sectionKey">
        <div
          v-if="sectionHasAnyItems(sectionKey)"
          class="border border-default rounded-lg overflow-hidden"
        >
          <!-- Section header — click to expand/collapse -->
          <div
            class="flex items-center gap-2 px-3 py-2.5 bg-elevated/30 cursor-pointer select-none"
            @click="toggleSection(sectionKey)"
          >
            <UIcon :name="SECTION_LABELS[sectionKey]?.icon || 'i-lucide-file'" class="w-4 h-4 text-muted shrink-0" />
            <span class="text-sm font-medium flex-1">{{ getSectionLabel(sectionKey) }}</span>
            <span class="text-xs text-muted tabular-nums">
              {{ sectionSelectedCount(sectionKey).selected }}/{{ sectionSelectedCount(sectionKey).total }}
            </span>
            <UIcon
              :name="openSections.has(sectionKey) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              class="w-4 h-4 text-muted shrink-0"
            />
          </div>

          <!-- Expanded body -->
          <div v-if="openSections.has(sectionKey)">

            <!-- Section config strip -->
            <div class="px-3 py-2.5 bg-elevated/20 border-b border-default flex items-center gap-3">
              <span class="text-xs text-muted shrink-0">Section title</span>
              <UInput
                v-model="sectionLabelDrafts[sectionKey]"
                size="xs"
                class="flex-1"
                placeholder="Section title…"
                @blur="commitSectionLabel(sectionKey)"
                @keyup.enter="commitSectionLabel(sectionKey)"
                @click.stop
              />
              <div class="flex items-center gap-0.5 shrink-0" @click.stop>
                <UButton
                  icon="i-lucide-arrow-up" size="xs" color="neutral" variant="ghost"
                  :disabled="sectionIdx === 0 || sectionOrder.slice(0, sectionIdx).every(k => !sectionHasAnyItems(k))"
                  @click="moveSectionUp(sectionKey)"
                />
                <UButton
                  icon="i-lucide-arrow-down" size="xs" color="neutral" variant="ghost"
                  :disabled="sectionIdx === sectionOrder.length - 1 || sectionOrder.slice(sectionIdx + 1).every(k => !sectionHasAnyItems(k))"
                  @click="moveSectionDown(sectionKey)"
                />
              </div>
            </div>

            <!-- Items -->
            <div class="p-3 space-y-2">

            <!-- Summary -->
            <template v-if="sectionKey === 'summary'">
              <div
                v-for="summary in editableData.summaries"
                :key="summary.id"
                class="flex items-start gap-2"
              >
                <UCheckbox
                  :model-value="summary.enabled"
                  class="mt-3 shrink-0"
                  @update:model-value="toggleSummaryEnabled(summary.id, $event as boolean)"
                />
                <div
                  class="flex-1 border border-default rounded-lg p-3 transition-opacity"
                  :class="[
                    summary.isNew ? 'ring-1 ring-cyan-500 dark:ring-cyan-400' : '',
                    { 'opacity-50': !summary.enabled }
                  ]"
                >
                  <div v-if="editingSummary !== summary.id" class="flex items-start gap-2">
                    <p class="text-sm whitespace-pre-wrap leading-relaxed flex-1">{{ summary.text || 'Empty summary' }}</p>
                    <div class="flex items-center gap-0.5 shrink-0">
                      <UButton
                        icon="i-lucide-pencil"
                        color="neutral" variant="ghost" size="xs"
                        class="cursor-pointer"
                        @click="startEditSummary(summary)"
                      />
                      <UButton
                        icon="i-lucide-trash-2"
                        color="neutral" variant="ghost" size="xs"
                        class="cursor-pointer opacity-50 hover:opacity-100"
                        @click="deleteItem('summaries', summary.id)"
                      />
                    </div>
                  </div>
                  <div v-else class="space-y-2">
                    <UTextarea
                      v-model="editDraft.text"
                      :rows="4"
                      autoresize
                      class="w-full"
                    />
                    <div class="flex justify-end gap-2">
                      <UButton label="Cancel" color="neutral" variant="ghost" size="sm" @click="cancelEdit()" />
                      <UButton label="Save" color="primary" size="sm" @click="saveEdit()" />
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- Work Experience -->
            <template v-else-if="sectionKey === 'workExperience'">
              <div
                v-for="exp in sortedWorkExperience"
                :key="exp.id"
                class="flex items-start gap-2"
              >
                <UCheckbox
                  :model-value="exp.selected"
                  class="mt-3 shrink-0"
                  @update:model-value="toggleItem('workExperience', exp.id, $event as boolean)"
                />
                <div
                  class="flex-1 border rounded-lg p-3 transition-opacity"
                  :class="[
                    exp.isNew ? 'border-default ring-1 ring-cyan-500 dark:ring-cyan-400' : 'border-default',
                    { 'opacity-40': !exp.selected }
                  ]"
                >
                <div v-if="editingExperienceId !== exp.id" class="flex items-start gap-2">
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-sm">{{ exp.jobTitle }}</p>
                    <p class="text-xs text-muted">{{ exp.employer }}</p>
                    <p class="text-xs text-muted">{{ formatDate(exp.startDate) }} – {{ exp.currentPosition ? 'Present' : formatDate(exp.endDate) }}</p>
                  </div>
                  <div class="flex items-center gap-0.5 shrink-0">
                    <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="xs" class="cursor-pointer"
                      @click="startEditExperience(exp)"
                    />
                    <UButton icon="i-lucide-trash-2" color="neutral" variant="ghost" size="xs"
                      class="cursor-pointer opacity-50 hover:opacity-100"
                      @click="deleteItem('workExperience', exp.id)"
                    />
                  </div>
                </div>
                <!-- Edit mode -->
                <div v-else class="space-y-3">
                  <div class="grid grid-cols-1 gap-3">
                    <div>
                      <label class="block text-xs font-medium mb-1">Job Title</label>
                      <UInput v-model="editDraft.jobTitle" class="w-full" />
                    </div>
                    <div>
                      <label class="block text-xs font-medium mb-1">Company</label>
                      <UInput v-model="editDraft.employer" class="w-full" />
                    </div>
                    <div>
                      <label class="block text-xs font-medium mb-1">Start Date</label>
                      <UInput
                        :model-value="formatDateForInput(editDraft.startDate)"
                        @update:model-value="editDraft.startDate = parseDateFromInput($event)"
                        placeholder="MM/YYYY"
                        class="w-full"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium mb-1">{{ editDraft.currentPosition ? 'End Date (Current)' : 'End Date' }}</label>
                      <UInput
                        :model-value="editDraft.currentPosition ? 'Present' : formatDateForInput(editDraft.endDate)"
                        @update:model-value="editDraft.endDate = parseDateFromInput($event)"
                        :placeholder="editDraft.currentPosition ? 'Present' : 'MM/YYYY'"
                        :disabled="editDraft.currentPosition"
                        class="w-full"
                      />
                    </div>
                  </div>
                  <div v-if="editDraft.highlights.filter((h: Highlight) => h.selected).length">
                    <label class="block text-xs font-medium mb-2">Achievements</label>
                    <div class="space-y-2">
                      <div
                        v-for="(hl, hlSelectedIdx) in editDraft.highlights.filter((h: Highlight) => h.selected)"
                        :key="hl.id"
                        class="flex gap-2 items-start"
                      >
                        <span class="text-muted mt-2.5 shrink-0">&bull;</span>
                        <UTextarea
                          v-model="editDraft.highlights[editDraft.highlights.findIndex((h: Highlight) => h.id === hl.id)].text"
                          :rows="2"
                          autoresize
                          class="flex-1"
                        />
                        <div class="flex flex-col gap-0.5 shrink-0 mt-1">
                          <UButton
                            icon="i-lucide-arrow-up"
                            size="xs" color="neutral" variant="ghost"
                            :disabled="(hlSelectedIdx as number) === 0"
                            @click="moveHighlight(hlSelectedIdx as number, 'up')"
                          />
                          <UButton
                            icon="i-lucide-arrow-down"
                            size="xs" color="neutral" variant="ghost"
                            :disabled="(hlSelectedIdx as number) === editDraft.highlights.filter((h: Highlight) => h.selected).length - 1"
                            @click="moveHighlight(hlSelectedIdx as number, 'down')"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="flex justify-end gap-2 pt-1">
                    <UButton label="Cancel" color="neutral" variant="ghost" size="sm" @click="cancelEdit()" />
                    <UButton label="Save" color="primary" size="sm" @click="saveEdit()" />
                  </div>
                </div>
                </div>
              </div>
            </template>

            <!-- Education -->
            <template v-else-if="sectionKey === 'education'">
              <div
                v-for="edu in sortedEducation"
                :key="edu.id"
                class="flex items-start gap-2"
              >
                <UCheckbox
                  :model-value="edu.selected"
                  class="mt-3 shrink-0"
                  @update:model-value="toggleItem('education', edu.id, $event as boolean)"
                />
                <div
                  class="flex-1 border border-default rounded-lg p-3 transition-opacity"
                  :class="[
                    edu.isNew ? 'ring-1 ring-cyan-500 dark:ring-cyan-400' : '',
                    { 'opacity-40': !edu.selected }
                  ]"
                >
                  <div v-if="editingEducationId !== edu.id" class="flex items-start gap-2">
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-sm">{{ edu.degree }}<span v-if="edu.areaOfStudy"> in {{ edu.areaOfStudy }}</span></p>
                      <p class="text-xs text-muted">{{ edu.institution }}</p>
                      <p class="text-xs text-muted">{{ formatDate(edu.endDate) }}</p>
                    </div>
                    <div class="flex items-center gap-0.5 shrink-0">
                      <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="xs"
                        @click="startEditEducation(edu)"
                      />
                      <UButton icon="i-lucide-trash-2" color="neutral" variant="ghost" size="xs"
                        class="cursor-pointer opacity-50 hover:opacity-100"
                        @click="deleteItem('education', edu.id)"
                      />
                    </div>
                  </div>
                  <div v-else class="space-y-3">
                    <div class="grid grid-cols-1 gap-3">
                      <div>
                        <label class="block text-xs font-medium mb-1">Institution</label>
                        <UInput v-model="editDraft.institution" class="w-full" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium mb-1">Degree</label>
                        <UInput v-model="editDraft.degree" class="w-full" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium mb-1">Field of Study</label>
                        <UInput v-model="editDraft.areaOfStudy" class="w-full" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium mb-1">Start Date</label>
                        <UInput
                          :model-value="formatDateForInput(editDraft.startDate)"
                          @update:model-value="editDraft.startDate = parseDateFromInput($event)"
                          placeholder="MM/YYYY"
                          class="w-full"
                        />
                      </div>
                      <div>
                        <label class="block text-xs font-medium mb-1">End Date</label>
                        <UInput
                          :model-value="formatDateForInput(editDraft.endDate)"
                          @update:model-value="editDraft.endDate = parseDateFromInput($event)"
                          placeholder="MM/YYYY"
                          class="w-full"
                        />
                      </div>
                    </div>
                    <div class="flex justify-end gap-2 pt-1">
                      <UButton label="Cancel" color="neutral" variant="ghost" size="sm" @click="cancelEdit()" />
                      <UButton label="Save" color="primary" size="sm" @click="saveEdit()" />
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- Skills -->
            <template v-else-if="sectionKey === 'skills'">
              <div class="space-y-3">
                <div v-if="!editingSkills">
                  <div v-for="sg in groupedAllSkills" :key="sg.group" class="mb-3 last:mb-0">
                    <div class="flex items-center justify-between mb-1.5">
                      <p class="text-xs font-medium text-muted">{{ sg.group }}</p>
                    </div>
                    <div class="flex flex-wrap gap-1.5">
                      <UBadge
                        v-for="skill in sg.skills"
                        :key="skill.id"
                        :color="skill.selected ? 'primary' : 'neutral'"
                        :variant="skill.selected ? 'subtle' : 'outline'"
                        size="md"
                        class="cursor-pointer select-none transition-opacity"
                        :class="{ 'opacity-40': !skill.selected }"
                        @click="toggleSkill(skill.id, !skill.selected)"
                      >
                        {{ skill.name }}
                      </UBadge>
                    </div>
                  </div>
                  <UButton
                    v-if="groupedSelectedSkills.length"
                    icon="i-lucide-pencil"
                    label="Edit selected skills"
                    color="neutral" variant="ghost" size="xs"
                    class="mt-1 cursor-pointer"
                    @click="editingSkills = true; emit('update:editingItem', { type: 'skills', id: 'skills' })"
                  />
                </div>
                <div v-else class="space-y-3">
                  <div v-for="sg in groupedSelectedSkills" :key="sg.group" class="space-y-1.5">
                    <p class="text-xs font-medium text-muted">{{ sg.group }}</p>
                    <UInputTags
                      :model-value="sg.skills.map(s => s.name)"
                      @update:model-value="updateSkillTags(sg.group, $event)"
                      placeholder="Type skill and press Enter..."
                      color="neutral" variant="outline"
                    />
                  </div>
                  <p class="text-xs text-muted">Press Enter to add · click × to remove a skill from your resume.</p>
                  <div class="flex justify-end pt-1">
                    <UButton label="Done" color="primary" size="sm" @click="editingSkills = false; emit('update:editingItem', { type: '', id: null })" />
                  </div>
                </div>
              </div>
            </template>

            <!-- Certifications -->
            <template v-else-if="sectionKey === 'certifications'">
              <div
                v-for="cert in sortedCertifications"
                :key="cert.id"
                class="flex items-start gap-2"
              >
                <UCheckbox
                  :model-value="cert.selected"
                  class="mt-3 shrink-0"
                  @update:model-value="toggleItem('certifications', cert.id, $event as boolean)"
                />
                <div
                  class="flex-1 border border-default rounded-lg p-3 transition-opacity"
                  :class="[
                    cert.isNew ? 'ring-1 ring-cyan-500 dark:ring-cyan-400' : '',
                    { 'opacity-40': !cert.selected }
                  ]"
                >
                  <div v-if="editingCertificationId !== cert.id" class="flex items-start gap-2">
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-sm">{{ cert.name }}</p>
                      <p v-if="cert.issuer" class="text-xs text-muted">{{ cert.issuer }}</p>
                      <p v-if="cert.issueDate" class="text-xs text-muted">Issued {{ formatDate(cert.issueDate) }}</p>
                    </div>
                    <div class="flex items-center gap-0.5 shrink-0">
                      <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="xs"
                        @click="startEditCertification(cert)"
                      />
                      <UButton icon="i-lucide-trash-2" color="neutral" variant="ghost" size="xs"
                        class="cursor-pointer opacity-50 hover:opacity-100"
                        @click="deleteItem('certifications', cert.id)"
                      />
                    </div>
                  </div>
                  <div v-else class="space-y-3">
                    <div class="grid grid-cols-1 gap-3">
                      <div>
                        <label class="block text-xs font-medium mb-1">Certification Name</label>
                        <UInput v-model="editDraft.name" class="w-full" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium mb-1">Issuer</label>
                        <UInput v-model="editDraft.issuer" class="w-full" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium mb-1">Issue Date</label>
                        <UInput
                          :model-value="formatDateForInput(editDraft.issueDate)"
                          @update:model-value="editDraft.issueDate = parseDateFromInput($event)"
                          placeholder="MM/YYYY"
                          class="w-full"
                        />
                      </div>
                    </div>
                    <div class="flex justify-end gap-2 pt-1">
                      <UButton label="Cancel" color="neutral" variant="ghost" size="sm" @click="cancelEdit()" />
                      <UButton label="Save" color="primary" size="sm" @click="saveEdit()" />
                    </div>
                  </div>
                </div>
              </div>
            </template>

            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
