<script setup lang="ts">
import { toMonthYearLabel } from '#shared/utils/monthYearDate'

// --- Config types (will eventually be a real DB-backed model) ---

interface HighlightConfig {
  sourceId: string
  isSelected: boolean
  displayOrder: number
}

interface ExperienceConfig {
  sourceId: string
  isSelected: boolean
  displayOrder: number
  fields: {
    jobTitle: boolean
    employer: boolean
    employmentType: boolean
    locationType: boolean
    dateRange: boolean
  }
  highlights: HighlightConfig[]
}

interface EducationConfig {
  sourceId: string
  isSelected: boolean
  displayOrder: number
  fields: {
    institution: boolean
    degree: boolean
    areaOfStudy: boolean
    dateRange: boolean
  }
}

interface SimpleConfig {
  sourceId: string
  isSelected: boolean
  displayOrder: number
}

// Structural constraint for the reorder helper
interface Orderable {
  sourceId: string
  displayOrder: number
}

const EXP_FIELDS: { key: keyof ExperienceConfig['fields']; label: string }[] = [
  { key: 'jobTitle', label: 'Job Title' },
  { key: 'employer', label: 'Company' },
  { key: 'employmentType', label: 'Employment Type' },
  { key: 'locationType', label: 'Location' },
  { key: 'dateRange', label: 'Date Range' }
]

const EDU_FIELDS: { key: keyof EducationConfig['fields']; label: string }[] = [
  { key: 'institution', label: 'Institution' },
  { key: 'degree', label: 'Degree' },
  { key: 'areaOfStudy', label: 'Field of Study' },
  { key: 'dateRange', label: 'Date Range' }
]

// --- Mock source data (will be replaced by real careerID data) ---

const mockData = {
  professionalSummary: {
    text: 'Experienced software engineer with 5+ years of building scalable web applications and leading cross-functional teams.'
  },
  workExperience: [
    {
      id: 'exp1',
      employer: 'Tech Corp',
      jobTitle: 'Senior Software Engineer',
      employmentType: 'Full-time',
      locationType: 'Remote',
      startDate: '2021-01',
      endDate: '2023-12',
      highlights: [
        { id: 'h1', text: 'Led migration of monolithic application to microservices architecture, reducing deployment time by 60%' },
        { id: 'h2', text: 'Mentored team of 5 junior developers, improving code quality and review processes' },
        { id: 'h3', text: 'Implemented CI/CD pipeline using GitHub Actions, reducing time-to-production by 40%' }
      ]
    },
    {
      id: 'exp2',
      employer: 'StartupXYZ',
      jobTitle: 'Full Stack Developer',
      employmentType: 'Full-time',
      locationType: 'On-site',
      startDate: '2019-06',
      endDate: '2021-01',
      highlights: [
        { id: 'h4', text: 'Built RESTful APIs serving 1M+ requests daily using Node.js and PostgreSQL' },
        { id: 'h5', text: 'Developed responsive web application using Vue.js and TypeScript' }
      ]
    }
  ],
  education: [
    {
      id: 'edu1',
      institution: 'University of Technology',
      degree: 'Bachelor of Science',
      areaOfStudy: 'Computer Science',
      startDate: '2015-09',
      endDate: '2019-05'
    }
  ],
  skills: [
    { id: 's1', name: 'JavaScript' },
    { id: 's2', name: 'TypeScript' },
    { id: 's3', name: 'Vue.js' },
    { id: 's4', name: 'Node.js' },
    { id: 's5', name: 'PostgreSQL' },
    { id: 's6', name: 'Docker' },
    { id: 's7', name: 'AWS' },
    { id: 's8', name: 'CI/CD' }
  ],
  certifications: [
    { id: 'cert1', name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services', issueDate: '2022-03' },
    { id: 'cert2', name: 'Professional Scrum Master I', issuer: 'Scrum.org', issueDate: '2020-11' }
  ]
}

// Fast lookups into source data
const expById = Object.fromEntries(mockData.workExperience.map(e => [e.id, e]))
const eduById = Object.fromEntries(mockData.education.map(e => [e.id, e]))
const skillById = Object.fromEntries(mockData.skills.map(s => [s.id, s]))
const certById = Object.fromEntries(mockData.certifications.map(c => [c.id, c]))

function getHighlight(expId: string, hlId: string) {
  return expById[expId].highlights.find(h => h.id === hlId)!
}

function formatDateRange(startDate: string, endDate: string | null) {
  const fmt = (d: string) => toMonthYearLabel(d)
  return endDate ? `${fmt(startDate)} – ${fmt(endDate)}` : `${fmt(startDate)} – Present`
}

// --- Resume config: selection + field visibility + ordering ---

const summaryConfig = reactive({ isSelected: true })

const expConfigs = reactive<ExperienceConfig[]>(
  mockData.workExperience.map((exp, i) => ({
    sourceId: exp.id,
    isSelected: true,
    displayOrder: i,
    fields: { jobTitle: true, employer: true, employmentType: true, locationType: true, dateRange: true },
    highlights: exp.highlights.map((h, j) => ({ sourceId: h.id, isSelected: true, displayOrder: j }))
  }))
)

const eduConfigs = reactive<EducationConfig[]>(
  mockData.education.map((edu, i) => ({
    sourceId: edu.id,
    isSelected: true,
    displayOrder: i,
    fields: { institution: true, degree: true, areaOfStudy: true, dateRange: true }
  }))
)

const skillConfigs = reactive<SimpleConfig[]>(
  mockData.skills.map((s, i) => ({ sourceId: s.id, isSelected: true, displayOrder: i }))
)

const certConfigs = reactive<SimpleConfig[]>(
  mockData.certifications.map((c, i) => ({ sourceId: c.id, isSelected: true, displayOrder: i }))
)

// --- Sorted views (render order respects displayOrder) ---

const sortedExps = computed(() => [...expConfigs].sort((a, b) => a.displayOrder - b.displayOrder))
const sortedEdus = computed(() => [...eduConfigs].sort((a, b) => a.displayOrder - b.displayOrder))
const sortedSkills = computed(() => [...skillConfigs].sort((a, b) => a.displayOrder - b.displayOrder))
const sortedCerts = computed(() => [...certConfigs].sort((a, b) => a.displayOrder - b.displayOrder))

function sortedHighlights(expConfig: ExperienceConfig) {
  return [...expConfig.highlights].sort((a, b) => a.displayOrder - b.displayOrder)
}

// --- Reordering: swap displayOrder between two adjacent items ---

function move(items: Orderable[], sortedIdx: number, direction: 'up' | 'down') {
  const sorted = [...items].sort((a, b) => a.displayOrder - b.displayOrder)
  const swapIdx = direction === 'up' ? sortedIdx - 1 : sortedIdx + 1
  if (swapIdx < 0 || swapIdx >= sorted.length) return
  const a = items.find(x => x.sourceId === sorted[sortedIdx].sourceId)!
  const b = items.find(x => x.sourceId === sorted[swapIdx].sourceId)!
  const temp = a.displayOrder
  a.displayOrder = b.displayOrder
  b.displayOrder = temp
}

// --- Section "select all" writable computeds ---

const allExpsSelected = computed({
  get: () => expConfigs.every(e => e.isSelected),
  set: (val) => expConfigs.forEach(e => {
    e.isSelected = val
    e.highlights.forEach(h => h.isSelected = val)
  })
})

const allEdusSelected = computed({
  get: () => eduConfigs.every(e => e.isSelected),
  set: (val) => eduConfigs.forEach(e => e.isSelected = val)
})

const allSkillsSelected = computed({
  get: () => skillConfigs.every(s => s.isSelected),
  set: (val) => skillConfigs.forEach(s => s.isSelected = val)
})

const allCertsSelected = computed({
  get: () => certConfigs.every(c => c.isSelected),
  set: (val) => certConfigs.forEach(c => c.isSelected = val)
})

// --- Accordion ---

const accordionItems = [
  { label: 'Professional Summary', icon: 'i-lucide-text-cursor-input', content: 'summary' },
  { label: 'Work Experience', icon: 'i-lucide-briefcase', content: 'workExperience' },
  { label: 'Education', icon: 'i-lucide-graduation-cap', content: 'education' },
  { label: 'Skills', icon: 'i-lucide-lightbulb', content: 'skills' },
  { label: 'Certifications', icon: 'i-lucide-award', content: 'certifications' }
]
</script>

<template>
  <div class="space-y-4">
    <div>
      <h2 class="text-lg font-semibold mb-1">
        Content Selection
      </h2>
      <p class="text-sm text-muted">
        Choose what to include in your resume
      </p>
    </div>

    <UAccordion
      :items="accordionItems"
      multiple
    >
      <!-- Professional Summary -->
      <template #summary>
        <div
          class="flex items-start gap-3 py-2 transition-opacity"
          :class="{ 'opacity-50': !summaryConfig.isSelected }"
        >
          <UCheckbox
            v-model="summaryConfig.isSelected"
            @click.stop
          />
          <p class="text-sm text-muted whitespace-pre-wrap flex-1">
            {{ mockData.professionalSummary.text }}
          </p>
        </div>
      </template>

      <!-- Work Experience -->
      <template #workExperience>
        <div class="space-y-3">
          <div class="flex items-center gap-2 pb-1">
            <UCheckbox
              v-model="allExpsSelected"
              @click.stop
            />
            <span class="text-xs text-muted">Select all</span>
          </div>

          <div
            v-for="(expConfig, sortedIdx) in sortedExps"
            :key="expConfig.sourceId"
            class="border border-default rounded-lg p-3 space-y-3 transition-opacity"
            :class="{ 'opacity-50': !expConfig.isSelected }"
          >
            <!-- Header: checkbox + title/company + reorder -->
            <div class="flex items-start gap-3">
              <UCheckbox
                v-model="expConfig.isSelected"
                @click.stop
              />
              <div class="flex-1 min-w-0">
                <p class="font-medium text-sm">
                  {{ expById[expConfig.sourceId].jobTitle }}
                </p>
                <p class="text-xs text-muted">
                  {{ expById[expConfig.sourceId].employer }}
                  · {{ formatDateRange(expById[expConfig.sourceId].startDate, expById[expConfig.sourceId].endDate) }}
                </p>
              </div>
              <div class="flex gap-0.5 shrink-0">
                <UButton
                  icon="i-lucide-chevron-up"
                  size="xs"
                  variant="ghost"
                  :disabled="sortedIdx === 0"
                  @click.stop="move(expConfigs, sortedIdx, 'up')"
                />
                <UButton
                  icon="i-lucide-chevron-down"
                  size="xs"
                  variant="ghost"
                  :disabled="sortedIdx === sortedExps.length - 1"
                  @click.stop="move(expConfigs, sortedIdx, 'down')"
                />
              </div>
            </div>

            <!-- Field visibility toggles -->
            <div class="flex flex-wrap gap-1.5 pl-7">
              <label
                v-for="field in EXP_FIELDS"
                :key="field.key"
                class="flex items-center gap-1.5 text-xs border border-default rounded px-2 py-1 cursor-pointer select-none hover:bg-elevated/50 transition-colors"
                :class="{ 'opacity-40': !expConfig.fields[field.key] }"
              >
                <UCheckbox
                  :model-value="expConfig.fields[field.key]"
                  size="sm"
                  @update:model-value="expConfig.fields[field.key] = $event as boolean"
                  @click.stop
                />
                {{ field.label }}
              </label>
            </div>

            <!-- Bullets -->
            <div class="pl-7 space-y-2">
              <p class="text-xs text-muted font-medium">
                Bullets
              </p>
              <div
                v-for="(hlConfig, hlIdx) in sortedHighlights(expConfig)"
                :key="hlConfig.sourceId"
                class="flex items-start gap-2 transition-opacity"
                :class="{ 'opacity-40': !hlConfig.isSelected }"
              >
                <UCheckbox
                  v-model="hlConfig.isSelected"
                  class="mt-0.5 shrink-0"
                  @click.stop
                />
                <p class="text-sm flex-1 leading-snug">
                  {{ getHighlight(expConfig.sourceId, hlConfig.sourceId).text }}
                </p>
                <div class="flex gap-0.5 shrink-0">
                  <UButton
                    icon="i-lucide-chevron-up"
                    size="xs"
                    variant="ghost"
                    :disabled="hlIdx === 0"
                    @click.stop="move(expConfig.highlights, hlIdx, 'up')"
                  />
                  <UButton
                    icon="i-lucide-chevron-down"
                    size="xs"
                    variant="ghost"
                    :disabled="hlIdx === sortedHighlights(expConfig).length - 1"
                    @click.stop="move(expConfig.highlights, hlIdx, 'down')"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Education -->
      <template #education>
        <div class="space-y-3">
          <div class="flex items-center gap-2 pb-1">
            <UCheckbox
              v-model="allEdusSelected"
              @click.stop
            />
            <span class="text-xs text-muted">Select all</span>
          </div>

          <div
            v-for="(eduConfig, sortedIdx) in sortedEdus"
            :key="eduConfig.sourceId"
            class="border border-default rounded-lg p-3 space-y-3 transition-opacity"
            :class="{ 'opacity-50': !eduConfig.isSelected }"
          >
            <div class="flex items-start gap-3">
              <UCheckbox
                v-model="eduConfig.isSelected"
                @click.stop
              />
              <div class="flex-1 min-w-0">
                <p class="font-medium text-sm">
                  {{ eduById[eduConfig.sourceId].institution }}
                </p>
                <p class="text-xs text-muted">
                  {{ eduById[eduConfig.sourceId].degree }} in {{ eduById[eduConfig.sourceId].areaOfStudy }}
                </p>
              </div>
              <div class="flex gap-0.5 shrink-0">
                <UButton
                  icon="i-lucide-chevron-up"
                  size="xs"
                  variant="ghost"
                  :disabled="sortedIdx === 0"
                  @click.stop="move(eduConfigs, sortedIdx, 'up')"
                />
                <UButton
                  icon="i-lucide-chevron-down"
                  size="xs"
                  variant="ghost"
                  :disabled="sortedIdx === sortedEdus.length - 1"
                  @click.stop="move(eduConfigs, sortedIdx, 'down')"
                />
              </div>
            </div>

            <div class="flex flex-wrap gap-1.5 pl-7">
              <label
                v-for="field in EDU_FIELDS"
                :key="field.key"
                class="flex items-center gap-1.5 text-xs border border-default rounded px-2 py-1 cursor-pointer select-none hover:bg-elevated/50 transition-colors"
                :class="{ 'opacity-40': !eduConfig.fields[field.key] }"
              >
                <UCheckbox
                  :model-value="eduConfig.fields[field.key]"
                  size="sm"
                  @update:model-value="eduConfig.fields[field.key] = $event as boolean"
                  @click.stop
                />
                {{ field.label }}
              </label>
            </div>
          </div>
        </div>
      </template>

      <!-- Skills -->
      <template #skills>
        <div class="space-y-3">
          <div class="flex items-center gap-2 pb-1">
            <UCheckbox
              v-model="allSkillsSelected"
              @click.stop
            />
            <span class="text-xs text-muted">Select all</span>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="(skillConfig, sortedIdx) in sortedSkills"
              :key="skillConfig.sourceId"
              class="flex items-center gap-2 transition-opacity"
              :class="{ 'opacity-50': !skillConfig.isSelected }"
            >
              <UCheckbox
                v-model="skillConfig.isSelected"
                @click.stop
              />
              <span class="text-sm flex-1">{{ skillById[skillConfig.sourceId].name }}</span>
              <div class="flex gap-0.5">
                <UButton
                  icon="i-lucide-chevron-up"
                  size="xs"
                  variant="ghost"
                  :disabled="sortedIdx === 0"
                  @click.stop="move(skillConfigs, sortedIdx, 'up')"
                />
                <UButton
                  icon="i-lucide-chevron-down"
                  size="xs"
                  variant="ghost"
                  :disabled="sortedIdx === sortedSkills.length - 1"
                  @click.stop="move(skillConfigs, sortedIdx, 'down')"
                />
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Certifications -->
      <template #certifications>
        <div class="space-y-3">
          <div class="flex items-center gap-2 pb-1">
            <UCheckbox
              v-model="allCertsSelected"
              @click.stop
            />
            <span class="text-xs text-muted">Select all</span>
          </div>

          <div
            v-for="(certConfig, sortedIdx) in sortedCerts"
            :key="certConfig.sourceId"
            class="border border-default rounded-lg p-3 transition-opacity"
            :class="{ 'opacity-50': !certConfig.isSelected }"
          >
            <div class="flex items-start gap-3">
              <UCheckbox
                v-model="certConfig.isSelected"
                @click.stop
              />
              <div class="flex-1 min-w-0">
                <p class="font-medium text-sm">
                  {{ certById[certConfig.sourceId].name }}
                </p>
                <p class="text-xs text-muted">
                  {{ certById[certConfig.sourceId].issuer }}
                </p>
                <p class="text-xs text-muted mt-0.5">
                  Issued {{ toMonthYearLabel(certById[certConfig.sourceId].issueDate) }}
                </p>
              </div>
              <div class="flex gap-0.5 shrink-0">
                <UButton
                  icon="i-lucide-chevron-up"
                  size="xs"
                  variant="ghost"
                  :disabled="sortedIdx === 0"
                  @click.stop="move(certConfigs, sortedIdx, 'up')"
                />
                <UButton
                  icon="i-lucide-chevron-down"
                  size="xs"
                  variant="ghost"
                  :disabled="sortedIdx === sortedCerts.length - 1"
                  @click.stop="move(certConfigs, sortedIdx, 'down')"
                />
              </div>
            </div>
          </div>
        </div>
      </template>
    </UAccordion>
  </div>
</template>
