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
}

interface Education {
  id: string | number
  institution: string
  degree: string
  areaOfStudy: string
  startDate: string | null | undefined
  endDate: string | null | undefined
  selected: boolean
}

interface Skill {
  id: string | number
  name: string
  group?: string
  selected: boolean
}

interface Certification {
  id: string | number
  name: string
  issuer: string
  issueDate: string
  selected: boolean
}

interface EditableData {
  summaries: Array<{ id: string; text: string; enabled: boolean; isNew?: boolean }>
  workExperience: WorkExperience[]
  education: Education[]
  skills: Skill[]
  certifications: Certification[]
  sectionOrder?: string[]
}

const props = defineProps<{
  editableData: EditableData
}>()

const emit = defineEmits<{
  'update:editableData': [data: EditableData]
  'update:editingItem': [item: { type: string; id: string | number | null }]
}>()

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
function toggleSection(key: string) {
  if (openSections.value.has(key)) openSections.value.delete(key)
  else openSections.value.add(key)
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

// ---- Item ordering (within selected items) ----

function moveItem(
  section: 'workExperience' | 'education' | 'certifications',
  id: string | number,
  direction: 'up' | 'down'
) {
  const items = [...(props.editableData[section] as any[])]
  const selectedIndices = items.reduce((acc: number[], item, i) => item.selected ? [...acc, i] : acc, [])
  const posInSelected = selectedIndices.findIndex(i => items[i].id === id)
  if (posInSelected === -1) return
  const swapPos = direction === 'up' ? posInSelected - 1 : posInSelected + 1
  if (swapPos < 0 || swapPos >= selectedIndices.length) return
  ;[items[selectedIndices[posInSelected]], items[selectedIndices[swapPos]]] =
    [items[selectedIndices[swapPos]], items[selectedIndices[posInSelected]]]
  emit('update:editableData', { ...props.editableData, [section]: items })
}

// ---- Text editing ----

const editingSummary = ref<string | null>(null)
const editingExperienceId = ref<string | number | null>(null)
const editingEducationId = ref<string | number | null>(null)
const editingCertificationId = ref<string | number | null>(null)
const editingSkills = ref(false)

function stopAll() {
  editingSummary.value = null
  editingExperienceId.value = null
  editingEducationId.value = null
  editingCertificationId.value = null
  editingSkills.value = false
  emit('update:editingItem', { type: '', id: null })
}

function updateSummary(id: string, value: string) {
  emit('update:editableData', {
    ...props.editableData,
    summaries: props.editableData.summaries.map(s => s.id === id ? { ...s, text: value } : s)
  })
}

function updateField<T extends 'workExperience' | 'education' | 'certifications'>(
  section: T, id: string | number, field: string, value: string
) {
  const newData = { ...props.editableData }
  const items = [...(newData[section] as any[])]
  const idx = items.findIndex(i => i.id === id)
  if (idx === -1) return
  items[idx] = { ...items[idx], [field]: value }
  newData[section] = items as any
  emit('update:editableData', newData)
}

function updateHighlight(expId: string | number, hlId: string, value: string) {
  const newData = { ...props.editableData }
  newData.workExperience = newData.workExperience.map(exp => {
    if (exp.id !== expId) return exp
    return { ...exp, highlights: exp.highlights.map(h => h.id === hlId ? { ...h, text: value } : h) }
  })
  emit('update:editableData', newData)
}

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

const selectedExperiences = computed(() => props.editableData.workExperience.filter(e => e.selected))
const selectedEducation = computed(() => props.editableData.education.filter(e => e.selected))
const selectedCertifications = computed(() => props.editableData.certifications.filter(c => c.selected))

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
</script>

<template>
  <div class="space-y-4">
    <div>
      <h2 class="text-lg font-semibold mb-1">Edit</h2>
      <p class="text-sm text-muted">Select items to include, reorder sections, and refine your content. Edits won't affect your profile.</p>
    </div>

    <!-- Empty state -->
    <div v-if="!hasAnyContent" class="text-center py-12 text-muted">
      <UIcon name="i-lucide-file-x" class="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p class="text-lg font-medium">Nothing here yet</p>
      <p class="text-sm">Go to the <strong>Content</strong> tab to sync from your profile.</p>
    </div>

    <!-- Ordered sections -->
    <div v-else class="space-y-2">
      <div v-for="(sectionKey, sectionIdx) in sectionOrder" :key="sectionKey">
        <div
          v-if="sectionHasAnyItems(sectionKey)"
          class="border border-default rounded-lg overflow-hidden"
        >
          <!-- Section header -->
          <div
            class="flex items-center gap-2 px-3 py-2.5 bg-elevated/30 cursor-pointer"
            @click="toggleSection(sectionKey)"
          >
            <UIcon :name="SECTION_LABELS[sectionKey]?.icon || 'i-lucide-file'" class="w-4 h-4 text-muted shrink-0" />
            <span class="text-sm font-medium flex-1">{{ SECTION_LABELS[sectionKey]?.label }}</span>
            <span class="text-xs text-muted tabular-nums">
              {{ sectionSelectedCount(sectionKey).selected }}/{{ sectionSelectedCount(sectionKey).total }}
            </span>
            <!-- Section reorder -->
            <div class="flex items-center gap-0.5 shrink-0" @click.stop>
              <UButton
                icon="i-lucide-chevron-up" size="xs" color="neutral" variant="ghost"
                :disabled="sectionIdx === 0 || sectionOrder.slice(0, sectionIdx).every(k => !sectionHasAnyItems(k))"
                @click="moveSectionUp(sectionKey)"
              />
              <UButton
                icon="i-lucide-chevron-down" size="xs" color="neutral" variant="ghost"
                :disabled="sectionIdx === sectionOrder.length - 1 || sectionOrder.slice(sectionIdx + 1).every(k => !sectionHasAnyItems(k))"
                @click="moveSectionDown(sectionKey)"
              />
            </div>
            <UIcon
              :name="openSections.has(sectionKey) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              class="w-4 h-4 text-muted shrink-0"
            />
          </div>

          <!-- Section body -->
          <div v-if="openSections.has(sectionKey)" class="p-3 space-y-2">

            <!-- Summary -->
            <template v-if="sectionKey === 'summary'">
              <div
                v-for="summary in editableData.summaries"
                :key="summary.id"
                class="border border-default rounded-lg p-3 transition-opacity"
                :class="{ 'opacity-50': !summary.enabled }"
              >
                <div class="flex items-start gap-3">
                  <UCheckbox
                    :model-value="summary.enabled"
                    class="mt-0.5 shrink-0"
                    @update:model-value="toggleSummaryEnabled(summary.id, $event as boolean)"
                  />
                  <div class="flex-1 min-w-0">
                    <div v-if="editingSummary !== summary.id">
                      <p class="text-sm whitespace-pre-wrap leading-relaxed">{{ summary.text || 'Empty summary' }}</p>
                    </div>
                    <div v-else class="space-y-2">
                      <UTextarea
                        :model-value="summary.text"
                        @update:model-value="updateSummary(summary.id, $event)"
                        :rows="4"
                        autoresize
                        class="w-full"
                      />
                      <div class="flex justify-end">
                        <UButton label="Done" color="primary" size="sm" @click="editingSummary = null; emit('update:editingItem', { type: '', id: null })" />
                      </div>
                    </div>
                  </div>
                  <UButton
                    v-if="summary.enabled && editingSummary !== summary.id"
                    icon="i-lucide-pencil"
                    color="neutral" variant="ghost" size="xs"
                    class="shrink-0 cursor-pointer"
                    @click="editingSummary = summary.id; emit('update:editingItem', { type: 'summary', id: summary.id })"
                  />
                </div>
              </div>
            </template>

            <!-- Work Experience -->
            <template v-else-if="sectionKey === 'workExperience'">
              <div
                v-for="(exp, expIdx) in editableData.workExperience"
                :key="exp.id"
                class="border border-default rounded-lg p-3 transition-opacity"
                :class="{ 'opacity-40': !exp.selected }"
              >
                <div v-if="editingExperienceId !== exp.id" class="flex items-start gap-3">
                  <UCheckbox
                    :model-value="exp.selected"
                    class="mt-0.5 shrink-0"
                    @update:model-value="toggleItem('workExperience', exp.id, $event as boolean)"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-sm">{{ exp.jobTitle }}</p>
                    <p class="text-xs text-muted">{{ exp.employer }}</p>
                    <p class="text-xs text-muted">{{ formatDate(exp.startDate) }} – {{ exp.currentPosition ? 'Present' : formatDate(exp.endDate) }}</p>
                  </div>
                  <div v-if="exp.selected" class="flex items-center gap-0.5 shrink-0">
                    <UButton icon="i-lucide-chevron-up" size="xs" color="neutral" variant="ghost"
                      :disabled="selectedExperiences.findIndex(e => e.id === exp.id) === 0"
                      @click="moveItem('workExperience', exp.id, 'up')"
                    />
                    <UButton icon="i-lucide-chevron-down" size="xs" color="neutral" variant="ghost"
                      :disabled="selectedExperiences.findIndex(e => e.id === exp.id) === selectedExperiences.length - 1"
                      @click="moveItem('workExperience', exp.id, 'down')"
                    />
                    <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="xs" class="cursor-pointer"
                      @click="editingExperienceId = exp.id; emit('update:editingItem', { type: 'experience', id: exp.id })"
                    />
                  </div>
                </div>
                <!-- Edit mode -->
                <div v-else class="space-y-3">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-medium mb-1">Job Title</label>
                      <UInput :model-value="exp.jobTitle" @update:model-value="updateField('workExperience', exp.id, 'jobTitle', $event)" />
                    </div>
                    <div>
                      <label class="block text-xs font-medium mb-1">Company</label>
                      <UInput :model-value="exp.employer" @update:model-value="updateField('workExperience', exp.id, 'employer', $event)" />
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-medium mb-1">Start Date</label>
                      <UInput :model-value="formatDateForInput(exp.startDate)" @update:model-value="updateField('workExperience', exp.id, 'startDate', parseDateFromInput($event))" placeholder="MM/YYYY" />
                    </div>
                    <div>
                      <label class="block text-xs font-medium mb-1">{{ exp.currentPosition ? 'End Date (Current)' : 'End Date' }}</label>
                      <UInput :model-value="exp.currentPosition ? 'Present' : formatDateForInput(exp.endDate)" @update:model-value="updateField('workExperience', exp.id, 'endDate', parseDateFromInput($event))" :placeholder="exp.currentPosition ? 'Present' : 'MM/YYYY'" :disabled="exp.currentPosition" />
                    </div>
                  </div>
                  <div v-if="exp.highlights.filter(h => h.selected).length">
                    <label class="block text-xs font-medium mb-2">Achievements</label>
                    <div class="space-y-2">
                      <div v-for="hl in exp.highlights.filter(h => h.selected)" :key="hl.id" class="flex gap-2 items-start">
                        <span class="text-muted mt-2.5 shrink-0">&bull;</span>
                        <UTextarea :model-value="hl.text" @update:model-value="updateHighlight(exp.id, hl.id, $event)" :rows="2" autoresize class="flex-1" />
                      </div>
                    </div>
                  </div>
                  <div class="flex justify-end pt-1">
                    <UButton label="Done" color="primary" size="sm" @click="editingExperienceId = null; emit('update:editingItem', { type: '', id: null })" />
                  </div>
                </div>
              </div>
            </template>

            <!-- Education -->
            <template v-else-if="sectionKey === 'education'">
              <div
                v-for="(edu, eduIdx) in editableData.education"
                :key="edu.id"
                class="border border-default rounded-lg p-3 transition-opacity"
                :class="{ 'opacity-40': !edu.selected }"
              >
                <div v-if="editingEducationId !== edu.id" class="flex items-start gap-3">
                  <UCheckbox
                    :model-value="edu.selected"
                    class="mt-0.5 shrink-0"
                    @update:model-value="toggleItem('education', edu.id, $event as boolean)"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-sm">{{ edu.degree }}<span v-if="edu.areaOfStudy"> in {{ edu.areaOfStudy }}</span></p>
                    <p class="text-xs text-muted">{{ edu.institution }}</p>
                    <p class="text-xs text-muted">{{ formatDate(edu.endDate) }}</p>
                  </div>
                  <div v-if="edu.selected" class="flex items-center gap-0.5 shrink-0">
                    <UButton icon="i-lucide-chevron-up" size="xs" color="neutral" variant="ghost"
                      :disabled="selectedEducation.findIndex(e => e.id === edu.id) === 0"
                      @click="moveItem('education', edu.id, 'up')"
                    />
                    <UButton icon="i-lucide-chevron-down" size="xs" color="neutral" variant="ghost"
                      :disabled="selectedEducation.findIndex(e => e.id === edu.id) === selectedEducation.length - 1"
                      @click="moveItem('education', edu.id, 'down')"
                    />
                    <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="xs"
                      @click="editingEducationId = edu.id; emit('update:editingItem', { type: 'education', id: edu.id })"
                    />
                  </div>
                </div>
                <div v-else class="space-y-3">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-medium mb-1">Institution</label>
                      <UInput :model-value="edu.institution" @update:model-value="updateField('education', edu.id, 'institution', $event)" />
                    </div>
                    <div>
                      <label class="block text-xs font-medium mb-1">Degree</label>
                      <UInput :model-value="edu.degree" @update:model-value="updateField('education', edu.id, 'degree', $event)" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-medium mb-1">Field of Study</label>
                    <UInput :model-value="edu.areaOfStudy" @update:model-value="updateField('education', edu.id, 'areaOfStudy', $event)" />
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-medium mb-1">Start Date</label>
                      <UInput :model-value="formatDateForInput(edu.startDate)" @update:model-value="updateField('education', edu.id, 'startDate', parseDateFromInput($event))" placeholder="MM/YYYY" />
                    </div>
                    <div>
                      <label class="block text-xs font-medium mb-1">End Date</label>
                      <UInput :model-value="formatDateForInput(edu.endDate)" @update:model-value="updateField('education', edu.id, 'endDate', parseDateFromInput($event))" placeholder="MM/YYYY" />
                    </div>
                  </div>
                  <div class="flex justify-end pt-1">
                    <UButton label="Done" color="primary" size="sm" @click="editingEducationId = null; emit('update:editingItem', { type: '', id: null })" />
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
                v-for="(cert, certIdx) in editableData.certifications"
                :key="cert.id"
                class="border border-default rounded-lg p-3 transition-opacity"
                :class="{ 'opacity-40': !cert.selected }"
              >
                <div v-if="editingCertificationId !== cert.id" class="flex items-start gap-3">
                  <UCheckbox
                    :model-value="cert.selected"
                    class="mt-0.5 shrink-0"
                    @update:model-value="toggleItem('certifications', cert.id, $event as boolean)"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-sm">{{ cert.name }}</p>
                    <p v-if="cert.issuer" class="text-xs text-muted">{{ cert.issuer }}</p>
                    <p v-if="cert.issueDate" class="text-xs text-muted">Issued {{ formatDate(cert.issueDate) }}</p>
                  </div>
                  <div v-if="cert.selected" class="flex items-center gap-0.5 shrink-0">
                    <UButton icon="i-lucide-chevron-up" size="xs" color="neutral" variant="ghost"
                      :disabled="selectedCertifications.findIndex(c => c.id === cert.id) === 0"
                      @click="moveItem('certifications', cert.id, 'up')"
                    />
                    <UButton icon="i-lucide-chevron-down" size="xs" color="neutral" variant="ghost"
                      :disabled="selectedCertifications.findIndex(c => c.id === cert.id) === selectedCertifications.length - 1"
                      @click="moveItem('certifications', cert.id, 'down')"
                    />
                    <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="xs"
                      @click="editingCertificationId = cert.id; emit('update:editingItem', { type: 'certification', id: cert.id })"
                    />
                  </div>
                </div>
                <div v-else class="space-y-3">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-medium mb-1">Certification Name</label>
                      <UInput :model-value="cert.name" @update:model-value="updateField('certifications', cert.id, 'name', $event)" />
                    </div>
                    <div>
                      <label class="block text-xs font-medium mb-1">Issuer</label>
                      <UInput :model-value="cert.issuer" @update:model-value="updateField('certifications', cert.id, 'issuer', $event)" />
                    </div>
                  </div>
                  <div class="md:w-1/2">
                    <label class="block text-xs font-medium mb-1">Issue Date</label>
                    <UInput :model-value="formatDateForInput(cert.issueDate)" @update:model-value="updateField('certifications', cert.id, 'issueDate', parseDateFromInput($event))" placeholder="MM/YYYY" />
                  </div>
                  <div class="flex justify-end pt-1">
                    <UButton label="Done" color="primary" size="sm" @click="editingCertificationId = null; emit('update:editingItem', { type: '', id: null })" />
                  </div>
                </div>
              </div>
            </template>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>
