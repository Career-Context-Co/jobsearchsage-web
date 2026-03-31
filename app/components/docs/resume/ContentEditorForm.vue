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
  summary: {
    text: string
    enabled: boolean
  }
  workExperience: WorkExperience[]
  education: Education[]
  skills: Skill[]
  certifications: Certification[]
}

const props = defineProps<{
  editableData: EditableData
}>()

const emit = defineEmits<{
  'update:editableData': [data: EditableData]
  'update:editingItem': [item: { type: string, id: string | number | null }]
}>()

// Track which items are being edited
const editingSummary = ref(false)
const editingExperienceId = ref<string | number | null>(null)
const editingEducationId = ref<string | number | null>(null)
const editingCertificationId = ref<string | number | null>(null)
const editingSkills = ref(false)

// Get only selected items for each section
const selectedExperiences = computed(() => 
  props.editableData.workExperience.filter(exp => exp.selected)
)

const selectedEducation = computed(() => 
  props.editableData.education.filter(edu => edu.selected)
)

const selectedSkills = computed(() => 
  props.editableData.skills.filter(skill => skill.selected)
)

const selectedCertifications = computed(() => 
  props.editableData.certifications.filter(cert => cert.selected)
)

// Sorted lists: selected first, then by date (most recent first)
const sortedExperiences = computed(() =>
  [...props.editableData.workExperience].sort((a, b) => {
    // First: selected items before unselected
    if (a.selected !== b.selected) {
      return Number(b.selected) - Number(a.selected)
    }
    // Second: sort by end date descending (most recent first)
    // Current positions (no end date) are treated as most recent
    const dateA = a.currentPosition || !a.endDate ? Infinity : new Date(a.endDate).getTime()
    const dateB = b.currentPosition || !b.endDate ? Infinity : new Date(b.endDate).getTime()
    return dateB - dateA
  })
)

const sortedEducation = computed(() =>
  [...props.editableData.education].sort((a, b) => {
    if (a.selected !== b.selected) {
      return Number(b.selected) - Number(a.selected)
    }
    const dateA = a.endDate ? new Date(a.endDate).getTime() : 0
    const dateB = b.endDate ? new Date(b.endDate).getTime() : 0
    return dateB - dateA
  })
)

const sortedCertifications = computed(() =>
  [...props.editableData.certifications].sort((a, b) => {
    if (a.selected !== b.selected) {
      return Number(b.selected) - Number(a.selected)
    }
    const dateA = a.issueDate ? new Date(a.issueDate).getTime() : 0
    const dateB = b.issueDate ? new Date(b.issueDate).getTime() : 0
    return dateB - dateA
  })
)

// Group ALL skills by category (not just selected)
const groupedSkills = computed(() => {
  const groups: Record<string, Array<{ id: string | number, name: string, group?: string, selected: boolean }>> = {}
  
  props.editableData.skills.forEach(skill => {
    const groupName = skill.group || 'Skills'
    if (!groups[groupName]) {
      groups[groupName] = []
    }
    groups[groupName].push(skill)
  })
  
  return Object.entries(groups).map(([group, skills]) => ({
    group,
    skills
  }))
})

// Group selected skills by category (for counts)
const groupedSelectedSkills = computed(() => {
  const groups: Record<string, Array<{ id: string | number, name: string, group?: string, selected: boolean }>> = {}
  
  selectedSkills.value.forEach(skill => {
    const groupName = skill.group || 'Skills'
    if (!groups[groupName]) {
      groups[groupName] = []
    }
    groups[groupName].push(skill)
  })
  
  return Object.entries(groups).map(([group, skills]) => ({
    group,
    skills
  }))
})

// Check if we have any content (not just selected)
const hasContent = computed(() => 
  props.editableData.summary.text ||
  props.editableData.workExperience.length > 0 ||
  props.editableData.education.length > 0 ||
  props.editableData.skills.length > 0 ||
  props.editableData.certifications.length > 0
)

// Build accordion items dynamically based on available content
const accordionItems = computed(() => {
  const items = []
  
  if (props.editableData.summary.text) {
    items.push({
      label: `Professional Summary ${props.editableData.summary.enabled ? '✓' : ''}`,
      icon: 'i-lucide-text-cursor-input',
      defaultOpen: false,
      slot: 'summary'
    })
  }
  
  if (props.editableData.workExperience.length > 0) {
    items.push({
      label: `Work Experience (${selectedExperiences.value.length}/${props.editableData.workExperience.length})`,
      icon: 'i-lucide-briefcase',
      defaultOpen: false,
      slot: 'workExperience'
    })
  }
  
  if (props.editableData.education.length > 0) {
    items.push({
      label: `Education (${selectedEducation.value.length}/${props.editableData.education.length})`,
      icon: 'i-lucide-graduation-cap',
      defaultOpen: false,
      slot: 'education'
    })
  }
  
  if (props.editableData.skills.length > 0) {
    items.push({
      label: `Skills (${selectedSkills.value.length}/${props.editableData.skills.length})`,
      icon: 'i-lucide-lightbulb',
      defaultOpen: false,
      slot: 'skills'
    })
  }
  
  if (props.editableData.certifications.length > 0) {
    items.push({
      label: `Certifications (${selectedCertifications.value.length}/${props.editableData.certifications.length})`,
      icon: 'i-lucide-award',
      defaultOpen: false,
      slot: 'certifications'
    })
  }
  
  return items
})

// Helper to update a field in editableData
function updateField<T extends keyof EditableData>(
  section: T, 
  index: number, 
  field: string, 
  value: string
) {
  const newData = { ...props.editableData }
  const items = [...(newData[section] as any[])]
  items[index] = { ...items[index], [field]: value }
  newData[section] = items as any
  emit('update:editableData', newData)
}

// Toggle selection state for an item
function toggleItemSelection(
  type: 'workExperience' | 'education' | 'skills' | 'certifications',
  id: string | number,
  selected: boolean | string
) {
  const isSelected = typeof selected === 'boolean' ? selected : selected === 'true'
  const newData = { ...props.editableData }
  
  if (type === 'workExperience') {
    newData.workExperience = newData.workExperience.map(item =>
      item.id === id ? { ...item, selected: isSelected } : item
    )
  } else if (type === 'education') {
    newData.education = newData.education.map(item =>
      item.id === id ? { ...item, selected: isSelected } : item
    )
  } else if (type === 'skills') {
    newData.skills = newData.skills.map(item =>
      item.id === id ? { ...item, selected: isSelected } : item
    )
  } else if (type === 'certifications') {
    newData.certifications = newData.certifications.map(item =>
      item.id === id ? { ...item, selected: isSelected } : item
    )
  }
  
  emit('update:editableData', newData)
}

// Toggle summary enabled state
function toggleSummary(enabled: boolean | string) {
  const isEnabled = typeof enabled === 'boolean' ? enabled : enabled === 'true'
  const newData = { ...props.editableData }
  newData.summary = { ...newData.summary, enabled: isEnabled }
  emit('update:editableData', newData)
}

// Helper to update a highlight bullet
function updateHighlight(expIndex: number, highlightIndex: number, value: string) {
  const newData = { ...props.editableData }
  newData.workExperience = newData.workExperience.map((exp, eIdx) => {
    if (eIdx !== expIndex) return exp
    return {
      ...exp,
      highlights: (exp.highlights || []).map((h, hIdx) =>
        hIdx === highlightIndex ? { ...h, text: value } : h
      )
    }
  })
  emit('update:editableData', newData)
}

// Helper to update summary
function updateSummary(value: string) {
  const newData = { ...props.editableData }
  newData.summary = { ...newData.summary, text: value }
  emit('update:editableData', newData)
}

// Find the original index in the full array for a selected item
function getOriginalIndex(section: 'workExperience' | 'education' | 'skills' | 'certifications', itemId: string | number): number {
  return props.editableData[section].findIndex(item => item.id === itemId)
}

// Format date for display (YYYY-MM-DD to Mon Year)
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Present'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// Format date for input display (YYYY-MM-DD to MM/YYYY)
function formatDateForInput(dateString: string | null | undefined): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${month}/${year}`
}

// Parse date from input (MM/YYYY to YYYY-MM-01)
function parseDateFromInput(value: string): string {
  if (!value) return ''
  const match = value.match(/^(\d{1,2})\/(\d{4})$/)
  if (match) {
    const month = match[1].padStart(2, '0')
    const year = match[2]
    return `${year}-${month}-01`
  }
  return value
}

// Update date field with parsing
function updateDateField(
  section: 'workExperience' | 'education' | 'certifications',
  itemId: string | number,
  field: string,
  displayValue: string
) {
  const index = getOriginalIndex(section, itemId)
  if (index === -1) return
  
  const parsedDate = parseDateFromInput(displayValue)
  updateField(section, index, field, parsedDate)
}

// Start/stop editing with event emission
function startEditingSummary() {
  editingSummary.value = true
  emit('update:editingItem', { type: 'summary', id: 'summary' })
}

function stopEditingSummary() {
  editingSummary.value = false
  emit('update:editingItem', { type: '', id: null })
}

function startEditingExperience(id: string | number) {
  editingExperienceId.value = id
  emit('update:editingItem', { type: 'experience', id })
}

function stopEditingExperience() {
  editingExperienceId.value = null
  emit('update:editingItem', { type: '', id: null })
}

function startEditingEducation(id: string | number) {
  editingEducationId.value = id
  emit('update:editingItem', { type: 'education', id })
}

function stopEditingEducation() {
  editingEducationId.value = null
  emit('update:editingItem', { type: '', id: null })
}

function startEditingSkills() {
  editingSkills.value = true
  emit('update:editingItem', { type: 'skills', id: 'skills' })
}

function stopEditingSkills() {
  editingSkills.value = false
  emit('update:editingItem', { type: '', id: null })
}

// Get skill names as array for a specific group (for UInputTags)
function getSkillTagsForGroup(groupName: string): string[] {
  return selectedSkills.value
    .filter(skill => (skill.group || 'Skills') === groupName)
    .map(skill => skill.name)
}

// Update skills when tags change for a group
function updateSkillTags(groupName: string, newTags: string[]) {
  const updatedData = { ...props.editableData }
  const existingSkillsInGroup = updatedData.skills.filter(
    skill => skill.selected && (skill.group || 'Skills') === groupName
  )
  
  // Find skills to remove (in existing but not in new tags)
  const existingNames = existingSkillsInGroup.map(s => s.name)
  const removedNames = existingNames.filter(name => !newTags.includes(name))
  
  // Find skills to add (in new tags but not in existing)
  const addedNames = newTags.filter(name => !existingNames.includes(name))
  
  // Update skills array: mark removed as not selected, add new ones
  updatedData.skills = updatedData.skills.map(skill => {
    if (skill.selected && (skill.group || 'Skills') === groupName && removedNames.includes(skill.name)) {
      return { ...skill, selected: false }
    }
    return skill
  })
  
  // Add new skills
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

function startEditingCertification(id: string | number) {
  editingCertificationId.value = id
  emit('update:editingItem', { type: 'certification', id })
}

function stopEditingCertification() {
  editingCertificationId.value = null
  emit('update:editingItem', { type: '', id: null })
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <h2 class="text-lg font-semibold mb-1">Edit Content</h2>
      <p class="text-sm text-muted">Make changes to your resume content before exporting. Edits here won't affect your profile.</p>
    </div>

    <!-- Collapsible sections using UAccordion -->
    <UAccordion v-if="hasContent" :items="accordionItems" multiple>
      <!-- Professional Summary Section -->
      <template #summary>
        <div class="flex items-start gap-3 py-2">
          <UCheckbox
            :model-value="editableData.summary.enabled"
            @update:model-value="toggleSummary($event)"
            class="mt-3"
          />
          <div 
            class="flex-1 border border-default rounded-lg"
            :class="{ 'opacity-50': !editableData.summary.enabled }"
          >
            <UPageCard variant="subtle">
              <!-- View Mode -->
              <div v-if="!editingSummary" class="flex justify-between items-start gap-4">
                <div class="flex-1">
                  <p class="text-sm whitespace-pre-wrap">{{ editableData.summary.text || 'No summary provided' }}</p>
                </div>
                <UButton
                  icon="i-lucide-pencil"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  class="cursor-pointer shrink-0"
                  @click="startEditingSummary"
                />
              </div>

              <!-- Edit Mode -->
              <div v-else class="space-y-4">
                <UTextarea
                  :model-value="editableData.summary.text"
                  @update:model-value="updateSummary($event)"
                  :rows="4"
                  placeholder="Your professional summary..."
                  class="w-full"
                />
                <div class="flex justify-end">
                  <UButton
                    label="Done"
                    color="primary"
                    size="sm"
                  @click="stopEditingSummary"
                />
              </div>
            </div>
            </UPageCard>
          </div>
        </div>
      </template>

      <!-- Work Experience Section -->
      <template #workExperience>
        <div class="space-y-3 py-2">
          <div
            v-for="exp in sortedExperiences"
            :key="exp.id"
            class="flex items-start gap-3"
          >
            <UCheckbox
              :model-value="exp.selected"
              @update:model-value="toggleItemSelection('workExperience', exp.id, $event)"
              class="mt-3"
            />
            <div 
              class="flex-1 border border-default rounded-lg"
              :class="{ 'opacity-50': !exp.selected }"
            >
              <UPageCard variant="subtle">
                <!-- View Mode (condensed - no bullets) -->
                <div v-if="editingExperienceId !== exp.id" class="flex justify-between items-start gap-4">
                  <div class="flex-1">
                    <h4 class="text-lg font-semibold">{{ exp.jobTitle }}</h4>
                    <p class="text-base font-medium text-muted">{{ exp.employer }}</p>
                    <p class="text-sm text-muted mt-1">
                      {{ formatDate(exp.startDate) }} - {{ exp.currentPosition ? 'Present' : formatDate(exp.endDate) }}
                    </p>
                  </div>
                  <UButton
                    icon="i-lucide-pencil"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    class="cursor-pointer shrink-0"
                    @click="startEditingExperience(exp.id)"
                  />
                </div>

              <!-- Edit Mode -->
              <div v-else class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium mb-1">Job Title</label>
                    <UInput
                      :model-value="exp.jobTitle"
                      @update:model-value="updateField('workExperience', getOriginalIndex('workExperience', exp.id), 'jobTitle', $event)"
                      placeholder="Job Title"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">Company</label>
                    <UInput
                      :model-value="exp.employer"
                      @update:model-value="updateField('workExperience', getOriginalIndex('workExperience', exp.id), 'employer', $event)"
                      placeholder="Company Name"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium mb-1">Start Date</label>
                    <UInput
                      :model-value="formatDateForInput(exp.startDate)"
                      @update:model-value="updateDateField('workExperience', exp.id, 'startDate', $event)"
                      placeholder="MM/YYYY"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">{{ exp.currentPosition ? 'End Date (Current)' : 'End Date' }}</label>
                    <UInput
                      :model-value="exp.currentPosition ? 'Present' : formatDateForInput(exp.endDate)"
                      @update:model-value="updateDateField('workExperience', exp.id, 'endDate', $event)"
                      :placeholder="exp.currentPosition ? 'Present' : 'MM/YYYY'"
                      :disabled="exp.currentPosition"
                    />
                  </div>
                </div>

                <!-- Achievement bullets -->
                <div v-if="exp.highlights.filter(h => h.selected).length > 0">
                  <label class="block text-sm font-medium mb-2">Achievements</label>
                  <div class="space-y-2">
                    <div
                      v-for="(highlight, hIndex) in exp.highlights.filter(h => h.selected)"
                      :key="highlight.id"
                      class="flex gap-2 items-start"
                    >
                      <span class="text-muted mt-2.5 shrink-0">&bull;</span>
                      <UTextarea
                        :model-value="highlight.text"
                        @update:model-value="updateHighlight(
                          getOriginalIndex('workExperience', exp.id),
                          exp.highlights.findIndex(h => h.id === highlight.id),
                          $event
                        )"
                        :rows="2"
                        autoresize
                        class="flex-1"
                        placeholder="Achievement or responsibility..."
                      />
                    </div>
                  </div>
                </div>

                <div class="flex justify-end pt-2">
                  <UButton
                    label="Done"
                    color="primary"
                    size="sm"
                    @click="stopEditingExperience"
                  />
                </div>
              </div>
            </UPageCard>
            </div>
          </div>
        </div>
      </template>

      <!-- Education Section -->
      <template #education>
        <div class="space-y-3 py-2">
          <div
            v-for="edu in sortedEducation"
            :key="edu.id"
            class="flex items-start gap-3"
          >
            <UCheckbox
              :model-value="edu.selected"
              @update:model-value="toggleItemSelection('education', edu.id, $event)"
              class="mt-3"
            />
            <div 
              class="flex-1 border border-default rounded-lg"
              :class="{ 'opacity-50': !edu.selected }"
            >
              <UPageCard variant="subtle">
                <!-- View Mode (condensed) -->
                <div v-if="editingEducationId !== edu.id" class="flex justify-between items-start gap-4">
                  <div class="flex-1">
                    <h4 class="text-lg font-semibold">{{ edu.degree }}<span v-if="edu.areaOfStudy"> in {{ edu.areaOfStudy }}</span></h4>
                    <p class="text-base font-medium text-muted">{{ edu.institution }}</p>
                    <p class="text-sm text-muted mt-1">{{ formatDate(edu.endDate) }}</p>
                  </div>
                  <UButton
                    icon="i-lucide-pencil"
                    color="neutral"
                  variant="ghost"
                  size="sm"
                  class="cursor-pointer shrink-0"
                  @click="startEditingEducation(edu.id)"
                />
              </div>

              <!-- Edit Mode -->
              <div v-else class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium mb-1">Institution</label>
                    <UInput
                      :model-value="edu.institution"
                      @update:model-value="updateField('education', getOriginalIndex('education', edu.id), 'institution', $event)"
                      placeholder="Institution Name"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">Degree</label>
                    <UInput
                      :model-value="edu.degree"
                      @update:model-value="updateField('education', getOriginalIndex('education', edu.id), 'degree', $event)"
                      placeholder="Degree Type"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-1">Field of Study</label>
                  <UInput
                    :model-value="edu.areaOfStudy"
                    @update:model-value="updateField('education', getOriginalIndex('education', edu.id), 'areaOfStudy', $event)"
                    placeholder="Field of Study"
                  />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium mb-1">Start Date</label>
                    <UInput
                      :model-value="formatDateForInput(edu.startDate)"
                      @update:model-value="updateDateField('education', edu.id, 'startDate', $event)"
                      placeholder="MM/YYYY"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">End Date</label>
                    <UInput
                      :model-value="formatDateForInput(edu.endDate)"
                      @update:model-value="updateDateField('education', edu.id, 'endDate', $event)"
                      placeholder="MM/YYYY"
                    />
                  </div>
                </div>

                <div class="flex justify-end pt-2">
                  <UButton
                    label="Done"
                    color="primary"
                    size="sm"
                    @click="stopEditingEducation"
                  />
                </div>
              </div>
            </UPageCard>
            </div>
          </div>
        </div>
      </template>

      <!-- Skills Section -->
      <template #skills>
        <div class="py-2">
          <UPageCard variant="subtle">
            <!-- View Mode -->
            <div v-if="!editingSkills" class="flex justify-between items-start gap-4">
              <div class="flex-1">
                <div v-for="skillGroup in groupedSkills" :key="skillGroup.group" class="mb-3 last:mb-0">
                  <p class="text-sm font-medium text-muted mb-1">{{ skillGroup.group }}</p>
                  <div class="flex flex-wrap gap-2">
                    <UBadge
                      v-for="skill in skillGroup.skills"
                      :key="skill.id"
                      :color="skill.selected ? 'neutral' : 'neutral'"
                      :variant="skill.selected ? 'subtle' : 'outline'"
                      :class="{ 'opacity-50': !skill.selected }"
                      class="cursor-pointer"
                      @click="toggleItemSelection('skills', skill.id, !skill.selected)"
                    >
                      {{ skill.name }}
                    </UBadge>
                  </div>
                </div>
              </div>
              <UButton
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                size="sm"
                class="cursor-pointer shrink-0"
                @click="startEditingSkills"
              />
            </div>

            <!-- Edit Mode with Tag Input -->
            <div v-else class="space-y-4">
              <div v-for="skillGroup in groupedSkills" :key="skillGroup.group" class="space-y-2">
                <p class="text-sm font-medium text-muted">{{ skillGroup.group }}</p>
                <UInputTags
                  :model-value="getSkillTagsForGroup(skillGroup.group)"
                  @update:model-value="updateSkillTags(skillGroup.group, $event)"
                  placeholder="Type skill and press Enter..."
                  color="neutral"
                  variant="outline"
                />
              </div>
              <p class="text-xs text-muted">Type a skill name and press Enter to add. Click the × to remove.</p>
              <div class="flex justify-end pt-2">
                <UButton
                  label="Done"
                  color="primary"
                  size="sm"
                  @click="stopEditingSkills"
                />
              </div>
            </div>
          </UPageCard>
        </div>
      </template>

      <!-- Certifications Section -->
      <template #certifications>
        <div class="space-y-3 py-2">
          <div
            v-for="cert in sortedCertifications"
            :key="cert.id"
            class="flex items-start gap-3"
          >
            <UCheckbox
              :model-value="cert.selected"
              @update:model-value="toggleItemSelection('certifications', cert.id, $event)"
              class="mt-3"
            />
            <div 
              class="flex-1 border border-default rounded-lg"
              :class="{ 'opacity-50': !cert.selected }"
            >
              <UPageCard variant="subtle">
                <!-- View Mode (condensed) -->
                <div v-if="editingCertificationId !== cert.id" class="flex justify-between items-start gap-4">
                  <div class="flex-1">
                    <h4 class="text-lg font-semibold">{{ cert.name }}</h4>
                    <p v-if="cert.issuer" class="text-base font-medium text-muted">{{ cert.issuer }}</p>
                    <p v-if="cert.issueDate" class="text-sm text-muted mt-1">Issued {{ formatDate(cert.issueDate) }}</p>
                  </div>
                  <UButton
                    icon="i-lucide-pencil"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    class="cursor-pointer shrink-0"
                    @click="startEditingCertification(cert.id)"
                  />
                </div>

                <!-- Edit Mode -->
                <div v-else class="space-y-4">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium mb-1">Certification Name</label>
                      <UInput
                        :model-value="cert.name"
                        @update:model-value="updateField('certifications', getOriginalIndex('certifications', cert.id), 'name', $event)"
                        placeholder="Certification Name"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-1">Issuer</label>
                      <UInput
                        :model-value="cert.issuer"
                        @update:model-value="updateField('certifications', getOriginalIndex('certifications', cert.id), 'issuer', $event)"
                        placeholder="Issuing Organization"
                      />
                    </div>
                  </div>

                  <div class="md:w-1/2">
                    <label class="block text-sm font-medium mb-1">Issue Date</label>
                    <UInput
                      :model-value="formatDateForInput(cert.issueDate)"
                      @update:model-value="updateDateField('certifications', cert.id, 'issueDate', $event)"
                      placeholder="MM/YYYY"
                    />
                  </div>

                  <div class="flex justify-end pt-2">
                    <UButton
                      label="Done"
                      color="primary"
                      size="sm"
                      @click="stopEditingCertification"
                    />
                  </div>
                </div>
              </UPageCard>
            </div>
          </div>
        </div>
      </template>
    </UAccordion>

    <!-- Empty state -->
    <div 
      v-if="!hasContent"
      class="text-center py-12 text-muted"
    >
      <UIcon name="i-lucide-file-x" class="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p class="text-lg font-medium">No content selected</p>
      <p class="text-sm">Go to the Content tab to select items to include in your resume.</p>
    </div>
  </div>
</template>
