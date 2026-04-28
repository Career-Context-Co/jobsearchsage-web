<script setup lang="ts">
interface Highlight {
  id: string
  text: string
  selected: boolean
  isNew?: boolean
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
  profileSnapshotAt?: string
  syncAddedCount?: number | null
}>()

const emit = defineEmits<{
  'update:editableData': [data: EditableData]
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

// ---- Section expand/collapse ----

const openSections = ref<Set<string>>(new Set(['summary', 'workExperience', 'education', 'skills', 'certifications']))

function toggleSection(key: string) {
  if (openSections.value.has(key)) {
    openSections.value.delete(key)
  } else {
    openSections.value.add(key)
  }
}

// ---- Selection helpers ----

function toggleSummary(id: string, enabled: boolean) {
  emit('update:editableData', {
    ...props.editableData,
    // Clear isNew when user explicitly enables — they've acknowledged it
    summaries: props.editableData.summaries.map(s =>
      s.id === id ? { ...s, enabled, ...(enabled ? { isNew: undefined } : {}) } : s
    )
  })
}

function deleteSummary(id: string) {
  emit('update:editableData', {
    ...props.editableData,
    summaries: props.editableData.summaries.filter(s => s.id !== id)
  })
}

function toggleItem(
  type: 'workExperience' | 'education' | 'skills' | 'certifications',
  id: string | number,
  selected: boolean
) {
  const newData = { ...props.editableData }
  // Clear isNew when user explicitly selects — acknowledgment clears the highlight
  const accept = (item: any) => ({ ...item, selected, ...(selected ? { isNew: undefined } : {}) })
  const acceptExp = (item: any) => ({
    ...item, selected,
    highlights: item.highlights.map((h: any) => ({ ...h, selected })),
    ...(selected ? { isNew: undefined } : {})
  })
  if (type === 'workExperience') {
    newData.workExperience = newData.workExperience.map(item =>
      item.id === id ? acceptExp(item) : item
    )
  } else if (type === 'education') {
    newData.education = newData.education.map(item => item.id === id ? accept(item) : item)
  } else if (type === 'skills') {
    newData.skills = newData.skills.map(item => item.id === id ? accept(item) : item)
  } else if (type === 'certifications') {
    newData.certifications = newData.certifications.map(item => item.id === id ? accept(item) : item)
  }
  emit('update:editableData', newData)
}

function toggleHighlight(expId: string | number, hlId: string, selected: boolean) {
  const newData = { ...props.editableData }
  newData.workExperience = newData.workExperience.map(exp => {
    if (exp.id !== expId) return exp
    const highlights = exp.highlights.map(h => h.id === hlId ? { ...h, selected } : h)
    return { ...exp, highlights }
  })
  emit('update:editableData', newData)
}

function selectAllInSection(
  type: 'workExperience' | 'education' | 'skills' | 'certifications',
  selected: boolean
) {
  const newData = { ...props.editableData }
  const accept = (item: any) => ({ ...item, selected, ...(selected ? { isNew: undefined } : {}) })
  if (type === 'workExperience') {
    newData.workExperience = newData.workExperience.map(e => ({
      ...e, selected,
      highlights: e.highlights.map(h => ({ ...h, selected })),
      ...(selected ? { isNew: undefined } : {})
    }))
  } else if (type === 'education') {
    newData.education = newData.education.map(e => accept(e))
  } else if (type === 'skills') {
    newData.skills = newData.skills.map(s => accept(s))
  } else if (type === 'certifications') {
    newData.certifications = newData.certifications.map(c => accept(c))
  }
  emit('update:editableData', newData)
}

// ---- Derived counts ----

const selectedExpCount = computed(() => props.editableData.workExperience.filter(e => e.selected).length)
const selectedEduCount = computed(() => props.editableData.education.filter(e => e.selected).length)
const selectedSkillCount = computed(() => props.editableData.skills.filter(s => s.selected).length)
const selectedCertCount = computed(() => props.editableData.certifications.filter(c => c.selected).length)

const newExpCount = computed(() => props.editableData.workExperience.filter(e => e.isNew).length)
const newEduCount = computed(() => props.editableData.education.filter(e => e.isNew).length)
const newSkillCount = computed(() => props.editableData.skills.filter(s => s.isNew).length)
const newCertCount = computed(() => props.editableData.certifications.filter(c => c.isNew).length)
const newSummaryCount = computed(() => props.editableData.summaries.filter(s => s.isNew).length)

const allExpsSelected = computed(() => props.editableData.workExperience.every(e => e.selected))
const allEduSelected = computed(() => props.editableData.education.every(e => e.selected))
const allSkillsSelected = computed(() => props.editableData.skills.every(s => s.selected))
const allCertsSelected = computed(() => props.editableData.certifications.every(c => c.selected))

// ---- Skills grouped ----

const groupedSkills = computed(() => {
  const groups: Record<string, Skill[]> = {}
  props.editableData.skills.forEach(skill => {
    const g = skill.group || 'Skills'
    if (!groups[g]) groups[g] = []
    groups[g].push(skill)
  })
  return Object.entries(groups).map(([group, skills]) => ({ group, skills }))
})

// ---- Date formatting ----

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Present'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function formatSnapshotDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const hasContent = computed(() =>
  props.editableData.summaries.length ||
  props.editableData.workExperience.length ||
  props.editableData.education.length ||
  props.editableData.skills.length ||
  props.editableData.certifications.length
)

const enabledSummaryCount = computed(() => props.editableData.summaries.filter(s => s.enabled).length)

const sections = computed(() => [
  {
    key: 'summary',
    icon: 'i-lucide-text-cursor-input',
    label: 'Summary',
    count: props.editableData.summaries.length
      ? `${enabledSummaryCount.value}/${props.editableData.summaries.length}`
      : null,
    updateCount: newSummaryCount.value,
    visible: props.editableData.summaries.length > 0
  },
  {
    key: 'workExperience',
    icon: 'i-lucide-briefcase',
    label: 'Work Experience',
    count: `${selectedExpCount.value}/${props.editableData.workExperience.length}`,
    updateCount: newExpCount.value,
    visible: props.editableData.workExperience.length > 0
  },
  {
    key: 'education',
    icon: 'i-lucide-graduation-cap',
    label: 'Education',
    count: `${selectedEduCount.value}/${props.editableData.education.length}`,
    updateCount: newEduCount.value,
    visible: props.editableData.education.length > 0
  },
  {
    key: 'skills',
    icon: 'i-lucide-lightbulb',
    label: 'Skills',
    count: `${selectedSkillCount.value}/${props.editableData.skills.length}`,
    updateCount: newSkillCount.value,
    visible: props.editableData.skills.length > 0
  },
  {
    key: 'certifications',
    icon: 'i-lucide-award',
    label: 'Certifications',
    count: `${selectedCertCount.value}/${props.editableData.certifications.length}`,
    updateCount: newCertCount.value,
    visible: props.editableData.certifications.length > 0
  }
])
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-start justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold mb-0.5">Content</h2>
        <p class="text-sm text-muted">
          Select what to include in your resume.
          <span v-if="profileSnapshotAt">Snapshot taken {{ formatSnapshotDate(profileSnapshotAt) }}.</span>
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

    <!-- Custom accordion sections -->
    <div v-if="hasContent" class="space-y-1">
      <div
        v-for="section in sections.filter(s => s.visible)"
        :key="section.key"
        class="border border-default rounded-lg overflow-hidden"
      >
        <!-- Section header -->
        <button
          type="button"
          class="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-elevated/40 transition-colors text-left"
          @click="toggleSection(section.key)"
        >
          <UIcon :name="section.icon" class="w-4 h-4 text-muted shrink-0" />
          <span class="text-sm font-medium flex-1">{{ section.label }}</span>
          <span v-if="section.count" class="text-xs text-muted tabular-nums">{{ section.count }}</span>
          <!-- New items badge -->
          <span
            v-if="section.updateCount > 0"
            class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 shrink-0"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 inline-block" />
            {{ section.updateCount }} update{{ section.updateCount > 1 ? 's' : '' }}
          </span>
          <UIcon
            :name="openSections.has(section.key) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            class="w-4 h-4 text-muted shrink-0"
          />
        </button>

        <!-- Section body -->
        <div v-if="openSections.has(section.key)" class="px-3 pb-3 pt-1 border-t border-default">

          <!-- Summary -->
          <template v-if="section.key === 'summary'">
            <div class="space-y-2 pt-2">
              <div
                v-for="summary in editableData.summaries"
                :key="summary.id"
                class="rounded-lg border p-3 transition-opacity"
                :class="[
                  summary.isNew
                    ? 'border-default ring-1 ring-cyan-500 dark:ring-cyan-400'
                    : 'border-default',
                  { 'opacity-50': !summary.enabled }
                ]"
              >
                <div class="flex items-start gap-3">
                  <UCheckbox
                    :model-value="summary.enabled"
                    class="mt-0.5 shrink-0"
                    @update:model-value="toggleSummary(summary.id, $event as boolean)"
                  />
                  <p class="text-sm text-muted whitespace-pre-wrap flex-1 leading-relaxed">
                    {{ summary.text }}
                  </p>
                  <UButton
                    icon="i-lucide-trash-2"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    class="shrink-0 cursor-pointer opacity-50 hover:opacity-100"
                    @click="deleteSummary(summary.id)"
                  />
                </div>
              </div>
            </div>
          </template>

          <!-- Work Experience -->
          <template v-else-if="section.key === 'workExperience'">
            <div class="space-y-3 pt-2">
              <div class="flex items-center gap-2">
                <UCheckbox
                  :model-value="allExpsSelected"
                  @update:model-value="selectAllInSection('workExperience', $event as boolean)"
                />
                <span class="text-xs text-muted">Select all</span>
              </div>
              <div
                v-for="exp in editableData.workExperience"
                :key="exp.id"
                class="rounded-lg p-3 space-y-2 transition-opacity border"
                :class="[
                  exp.isNew
                    ? 'border-default ring-1 ring-cyan-500 dark:ring-cyan-400'
                    : 'border-default',
                  { 'opacity-50': !exp.selected }
                ]"
              >
                <div class="flex items-start gap-3">
                  <UCheckbox
                    :model-value="exp.selected"
                    @update:model-value="toggleItem('workExperience', exp.id, $event as boolean)"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-sm">{{ exp.jobTitle }}</p>
                    <p class="text-xs text-muted">{{ exp.employer }} · {{ formatDate(exp.startDate) }} – {{ exp.currentPosition ? 'Present' : formatDate(exp.endDate) }}</p>
                  </div>
                </div>
                <div v-if="exp.highlights.length" class="pl-7 space-y-1.5">
                  <div
                    v-for="hl in exp.highlights"
                    :key="hl.id"
                    class="flex items-start gap-2 transition-opacity"
                    :class="{ 'opacity-40': !hl.selected }"
                  >
                    <UCheckbox
                      :model-value="hl.selected"
                      class="mt-0.5 shrink-0"
                      @update:model-value="toggleHighlight(exp.id, hl.id, $event as boolean)"
                    />
                    <p class="text-sm leading-snug flex-1">{{ hl.text }}</p>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Education -->
          <template v-else-if="section.key === 'education'">
            <div class="space-y-3 pt-2">
              <div class="flex items-center gap-2">
                <UCheckbox
                  :model-value="allEduSelected"
                  @update:model-value="selectAllInSection('education', $event as boolean)"
                />
                <span class="text-xs text-muted">Select all</span>
              </div>
              <div
                v-for="edu in editableData.education"
                :key="edu.id"
                class="rounded-lg p-3 transition-opacity border"
                :class="[
                  edu.isNew
                    ? 'border-default ring-1 ring-cyan-500 dark:ring-cyan-400'
                    : 'border-default',
                  { 'opacity-50': !edu.selected }
                ]"
              >
                <div class="flex items-start gap-3">
                  <UCheckbox
                    :model-value="edu.selected"
                    @update:model-value="toggleItem('education', edu.id, $event as boolean)"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-sm">{{ edu.institution }}</p>
                    <p class="text-xs text-muted">{{ edu.degree }}<span v-if="edu.areaOfStudy"> in {{ edu.areaOfStudy }}</span> · {{ formatDate(edu.endDate) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Skills -->
          <template v-else-if="section.key === 'skills'">
            <div class="space-y-3 pt-2">
              <div class="flex items-center gap-2">
                <UCheckbox
                  :model-value="allSkillsSelected"
                  @update:model-value="selectAllInSection('skills', $event as boolean)"
                />
                <span class="text-xs text-muted">Select all</span>
              </div>
              <div v-for="skillGroup in groupedSkills" :key="skillGroup.group" class="space-y-1.5">
                <p class="text-xs font-medium text-muted">{{ skillGroup.group }}</p>
                <div class="flex flex-wrap gap-2">
                  <UBadge
                    v-for="skill in skillGroup.skills"
                    :key="skill.id"
                    :color="skill.selected ? 'primary' : 'neutral'"
                    :variant="skill.selected ? 'subtle' : 'outline'"
                    size="md"
                    class="cursor-pointer select-none transition-opacity"
                    :class="[
                      { 'opacity-40': !skill.selected },
                      skill.isNew ? 'ring-1 ring-cyan-500 dark:ring-cyan-400' : ''
                    ]"
                    @click="toggleItem('skills', skill.id, !skill.selected)"
                  >
                    {{ skill.name }}
                  </UBadge>
                </div>
              </div>
            </div>
          </template>

          <!-- Certifications -->
          <template v-else-if="section.key === 'certifications'">
            <div class="space-y-3 pt-2">
              <div class="flex items-center gap-2">
                <UCheckbox
                  :model-value="allCertsSelected"
                  @update:model-value="selectAllInSection('certifications', $event as boolean)"
                />
                <span class="text-xs text-muted">Select all</span>
              </div>
              <div
                v-for="cert in editableData.certifications"
                :key="cert.id"
                class="rounded-lg p-3 transition-opacity border"
                :class="[
                  cert.isNew
                    ? 'border-default ring-1 ring-cyan-500 dark:ring-cyan-400'
                    : 'border-default',
                  { 'opacity-50': !cert.selected }
                ]"
              >
                <div class="flex items-start gap-3">
                  <UCheckbox
                    :model-value="cert.selected"
                    @update:model-value="toggleItem('certifications', cert.id, $event as boolean)"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-sm">{{ cert.name }}</p>
                    <p class="text-xs text-muted">{{ cert.issuer }}<span v-if="cert.issueDate"> · {{ formatDate(cert.issueDate) }}</span></p>
                  </div>
                </div>
              </div>
            </div>
          </template>

        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!hasContent" class="text-center py-12 text-muted">
      <UIcon name="i-lucide-file-x" class="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p class="text-lg font-medium">No content available</p>
      <p class="text-sm">Your profile needs experience, education, or skills to build a resume.</p>
    </div>
  </div>
</template>
