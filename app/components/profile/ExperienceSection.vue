<script setup lang="ts">
import type { Experience } from '~/shared/types/careerId'
import { vMaska } from 'maska/vue'
import { validateRequired, validateUrl, validateMonthYear, validateDateRange } from '~/utils/validation'

// Form data type for local state (includes UI state like isEditing)
interface ExperienceFormData {
  id?: number
  employmentType: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship'
  employer: string
  title: string
  location?: string
  locationType: 'on_site' | 'remote' | 'hybrid'
  url?: string | null
  startDate: string
  endDate?: string | null
  currentPosition: boolean
  summary?: string | null
  highlights: string[]
  isEditing: boolean
}

// Error type matching form data structure
interface ExperienceErrors {
  employer?: string
  title?: string
  startDate?: string
  endDate?: string
  url?: string
}

/**
 * Convert date from YYYY-MM-DD to MM/YYYY format for UI display
 */
function formatDateForUI(dateString: string | null | undefined): string {
  if (!dateString) return ''
  
  // If already in MM/YYYY format, return as-is
  if (/^\d{2}\/\d{4}$/.test(dateString)) return dateString
  
  // Parse YYYY-MM-DD and convert to MM/YYYY
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  
  return `${month}/${year}`
}

// Props - receive Experience array from parent (store)
const props = defineProps<{
  experience: Experience[]
}>()

// Emit on save - supports both single experience and bulk save
const emit = defineEmits<{
  save: [experience: Omit<ExperienceFormData, 'isEditing'>] // Single experience save
  saveAll: [experiences: Omit<ExperienceFormData, 'isEditing'>[]] // Bulk save all
}>()

// Local reactive copy for editing (convert Experience to ExperienceFormData with isEditing state)
const experiences = ref<ExperienceFormData[]>(
  props.experience.length > 0 
    ? props.experience.map(exp => ({
        id: exp.id,
        employmentType: exp.employmentType,
        employer: exp.employer,
        title: exp.title,
        location: exp.location,
        locationType: exp.locationType,
        url: exp.url,
        startDate: formatDateForUI(exp.startDate),
        endDate: formatDateForUI(exp.endDate),
        currentPosition: exp.currentPosition,
        summary: exp.summary,
        highlights: exp.highlights || [],
        isEditing: false
      }))
    : [{
        employmentType: 'full_time',
        employer: '',
        title: '',
        location: '',
        locationType: 'on_site',
        url: '',
        startDate: '',
        endDate: '',
        currentPosition: false,
        summary: '',
        highlights: [],
        isEditing: true
      }]
)

// Track which experiences have been edited
const editedExperiences = ref<Set<number>>(new Set())
// Flag to temporarily disable change tracking during props updates
const isUpdatingFromProps = ref(false)

// Validation errors (keyed by experience index)
const validationErrors = ref<Record<number, ExperienceErrors>>({})

// Track delete confirmation states
const experienceDeleteConfirm = ref<Set<number>>(new Set())

// Watch for changes - will not fire on initial setup (immediate: false by default)
watch(experiences, () => {
  // Skip if we're updating from props
  if (isUpdatingFromProps.value) return
  
  // Mark all experiences as potentially edited when any field changes
  experiences.value.forEach((_, index) => {
    editedExperiences.value.add(index)
  })
}, { deep: true })

// Watch for external prop changes (when store updates)
// Preserve isEditing state for items that are currently being edited
watch(() => props.experience, (newValue) => {
  // Disable change tracking during this update
  isUpdatingFromProps.value = true
  
  // Create a map of current isEditing states by id
  const editingStates = new Map(
    experiences.value.map(exp => [exp.id, exp.isEditing])
  )
  
  experiences.value = newValue.length > 0
    ? newValue.map(exp => ({
        id: exp.id,
        employmentType: exp.employmentType,
        employer: exp.employer,
        title: exp.title,
        location: exp.location,
        locationType: exp.locationType,
        url: exp.url,
        startDate: formatDateForUI(exp.startDate),
        endDate: formatDateForUI(exp.endDate),
        currentPosition: exp.currentPosition,
        summary: exp.summary,
        highlights: exp.highlights || [],
        // Preserve isEditing state if this item was already being edited
        isEditing: editingStates.get(exp.id) ?? false
      }))
    : [{
        employmentType: 'full_time',
        employer: '',
        title: '',
        location: '',
        locationType: 'on_site',
        url: '',
        startDate: '',
        endDate: '',
        currentPosition: false,
        summary: '',
        highlights: [],
        isEditing: true
      }]
  
  // Clear edited experiences tracking when props update
  editedExperiences.value.clear()
  
  // Re-enable change tracking
  isUpdatingFromProps.value = false
}, { deep: true })

// Employment type options
const employmentTypeOptions = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internship', label: 'Internship' }
]

// Location type options
const locationTypeOptions = [
  { value: 'on_site', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' }
]

function createBlankExperience(): ExperienceFormData {
  return {
    employmentType: 'full_time',
    employer: '',
    title: '',
    location: '',
    locationType: 'on_site',
    url: '',
    startDate: '',
    endDate: '',
    currentPosition: false,
    summary: '',
    highlights: [],
    isEditing: true
  }
}

// All changes are local until save
function editExperience(index: number) {
  const experience = experiences.value[index]
  if (!experience) return
  
  experience.isEditing = true
}

function cancelEdit(index: number) {
  const experience = experiences.value[index]
  if (!experience) return
  
  // If this is a new unsaved experience (no id), remove it
  if (!experience.id) {
    experiences.value.splice(index, 1)
    editedExperiences.value.delete(index)
    return
  }
  
  // If it has an id, reset it back to original values from props
  const original = props.experience.find(exp => exp.id === experience.id)
  if (original) {
    // Reset all fields to original values
    experience.employmentType = original.employmentType
    experience.employer = original.employer
    experience.title = original.title
    experience.location = original.location
    experience.locationType = original.locationType
    experience.url = original.url
    experience.startDate = formatDateForUI(original.startDate)
    experience.endDate = formatDateForUI(original.endDate)
    experience.currentPosition = original.currentPosition
    experience.summary = original.summary
    experience.highlights = [...(original.highlights || [])]
  }
  
  // Clear the edited flag
  editedExperiences.value.delete(index)
  
  // Close edit mode
  experience.isEditing = false
}

function deleteExperience(index: number) {
  // Check if already in confirm state
  if (experienceDeleteConfirm.value.has(index)) {
    // Actually delete
    experiences.value.splice(index, 1)
    experienceDeleteConfirm.value.delete(index)
  } else {
    // First click: enter confirm state
    experienceDeleteConfirm.value.add(index)
    // Auto-clear confirmation after 3 seconds
    setTimeout(() => {
      experienceDeleteConfirm.value.delete(index)
    }, 3000)
  }
}

function addNewExperience() {
  // Add a new blank experience in edit mode
  experiences.value.push(createBlankExperience())
}

// Validate single experience
function validateExperience(exp: ExperienceFormData, index: number): boolean {
  // Clear previous errors for this experience
  if (validationErrors.value[index]) {
    delete validationErrors.value[index]
  }
  
  const errors: ExperienceErrors = {}
  let isValid = true
  
  // Validate required fields
  const employerError = validateRequired(exp.employer, 'Employer')
  if (employerError) {
    errors.employer = employerError
    isValid = false
  }
  
  const titleError = validateRequired(exp.title, 'Job title')
  if (titleError) {
    errors.title = titleError
    isValid = false
  }
  
  // Validate start date
  const startDateError = validateMonthYear(exp.startDate, true)
  if (startDateError) {
    errors.startDate = startDateError
    isValid = false
  }
  
  // Validate end date (if not current position)
  if (!exp.currentPosition && exp.endDate) {
    const endDateError = validateMonthYear(exp.endDate, false)
    if (endDateError) {
      errors.endDate = endDateError
      isValid = false
    } else if (exp.startDate) {
      // Validate date range
      const rangeError = validateDateRange(exp.startDate, exp.endDate, 'End date')
      if (rangeError) {
        errors.endDate = rangeError
        isValid = false
      }
    }
  }
  
  // Validate URL if provided
  if (exp.url && exp.url.trim()) {
    const urlError = validateUrl(exp.url, false)
    if (urlError) {
      errors.url = urlError
      isValid = false
    }
  }
  
  if (!isValid) {
    validationErrors.value[index] = errors
  }
  
  return isValid
}

// Save individual experience - closes edit mode and emits just that experience
function saveExperience(index: number) {
  const experience = experiences.value[index]
  if (!experience) return
  
  // Validate before saving
  if (!validateExperience(experience, index)) {
    return // Stop if validation fails
  }
  
  // Only save if this experience was actually edited or is new (no id)
  if (!experience.id || editedExperiences.value.has(index)) {
    const { isEditing, ...experienceToSave } = experience
    emit('save', experienceToSave)
    
    // Clear the edited flag after saving
    editedExperiences.value.delete(index)
  }
  
  // Close editing mode for this experience
  experience.isEditing = false
  // Clear validation errors on successful save
  if (validationErrors.value[index]) {
    delete validationErrors.value[index]
  }
}

// Emit all experiences on save - only sends edited ones
function saveAllExperiences() {
  // Validate all experiences before saving
  let allValid = true
  const experiencesToValidate = experiences.value
    .map((exp, index) => ({ exp, index }))
    .filter(({ exp, index }) => !exp.id || editedExperiences.value.has(index))
  
  for (const { exp, index } of experiencesToValidate) {
    if (!validateExperience(exp, index)) {
      allValid = false
    }
  }
  
  if (!allValid) {
    return // Stop if any validation fails
  }
  
  // Only save experiences that were edited or are new (no id)
  const experiencesToSave = experiences.value
    .map((exp, index) => ({ exp, index }))
    .filter(({ exp, index }) => !exp.id || editedExperiences.value.has(index))
    .map(({ exp }) => {
      const { isEditing, ...rest } = exp
      return rest
    })
  
  // Only emit if there are actually changes to save
  if (experiencesToSave.length > 0) {
    emit('saveAll', experiencesToSave)
    
    // Clear all edited flags and validation errors after saving
    editedExperiences.value.clear()
    validationErrors.value = {}
  }
}

// Revert all changes back to original props values
function revertAllChanges() {
  isUpdatingFromProps.value = true
  
  experiences.value = props.experience.length > 0
    ? props.experience.map(exp => ({
        id: exp.id,
        employmentType: exp.employmentType,
        employer: exp.employer,
        title: exp.title,
        location: exp.location,
        locationType: exp.locationType,
        url: exp.url,
        startDate: formatDateForUI(exp.startDate),
        endDate: formatDateForUI(exp.endDate),
        currentPosition: exp.currentPosition,
        summary: exp.summary,
        highlights: exp.highlights || [],
        isEditing: false
      }))
    : []
  
  editedExperiences.value.clear()
  validationErrors.value = {}
  isUpdatingFromProps.value = false
}

// Expose save method for autosave functionality and revert for error handling
defineExpose({
  triggerSave: saveAllExperiences,
  revertChanges: revertAllChanges
})
</script>

<template>
  <div class="max-w-xl mx-auto space-y-4">
    <!-- Section Title and Description -->
    <div class="mb-8 space-y-2">
      <h1 class="text-2xl sm:text-3xl font-semibold text-foreground">Tell us where you worked</h1>
      <p class="text-sm text-muted">
        Let hiring managers know where you worked and what you accomplished.
      </p>
    </div>

        <!-- Helper Text -->
        <div class="bg-info/5 border border-info/50 rounded-lg p-4">
      <div class="flex gap-3">
        <UIcon name="i-lucide-lightbulb" class="w-5 h-5 text-info shrink-0 mt-0.5" />
        <div class="text-sm text-muted">
          <p class="font-medium text-foreground mb-1">Tips for adding work experience</p>
          <ul class="list-disc list-inside space-y-1">
            <li>Include the company name, job title, and dates of employment.</li>
            <li>Use the summary section to list any accomplishments or achievements you had in the role.</li>
            <li>Promotions within the company should be entered as a new experience.</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- All Experiences (each with its own state) -->
    <div class="flex flex-col gap-4">
      <UCollapsible 
        disabled
        v-for="(experience, index) in experiences" 
        :key="index"
        v-model:open="experience.isEditing"
        class="flex flex-col gap-2"
      >
        <!-- Collapsed View -->
        <UCard v-if="!experience.isEditing">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <h2 class="text-md font-semibold text-foreground">{{ experience.title || 'Untitled Position' }}</h2>
              <h3 class="text-sm text-muted">{{ experience.employer || 'Untitled Company' }}</h3>
              <p class="text-sm text-muted">{{ experience.location }}</p>
            </div>
            <div class="flex gap-2">
              <UButton 
                class="cursor-pointer"
                icon="i-lucide-pencil" 
                color="neutral" 
                variant="ghost" 
                size="sm"
                @click="editExperience(index)"
              />
              <UButton 
                class="cursor-pointer"
                :icon="experienceDeleteConfirm.has(index) ? 'i-lucide-check' : 'i-lucide-trash-2'"
                :label="experienceDeleteConfirm.has(index) ? 'Sure?' : undefined"
                color="error" 
                :variant="experienceDeleteConfirm.has(index) ? 'solid' : 'ghost'"
                size="sm"
                @click="deleteExperience(index)"
              />
            </div>
          </div>
        </UCard>

        <!-- Expanded Edit Form - Still needs a clickable trigger when in edit mode -->
        <UCard v-if="experience.isEditing">
          <div class="flex items-center justify-between mb-4">
            <div class="flex-1">
              <h2 class="text-md font-semibold text-foreground">{{ experience.title || 'Untitled Position' }}</h2>
              <h3 class="text-sm text-muted">{{ experience.employer || 'Untitled Company' }}</h3>
            </div>
            <div class="flex gap-2">
              <UButton 
                class="cursor-pointer"
                icon="i-lucide-pencil" 
                color="success" 
                variant="ghost" 
                size="sm"
                @click="experience.isEditing = false"
              />
              <UButton 
                class="cursor-pointer"
                :icon="experienceDeleteConfirm.has(index) ? 'i-lucide-check' : 'i-lucide-trash-2'"
                :label="experienceDeleteConfirm.has(index) ? 'Sure?' : undefined"
                color="error" 
                :variant="experienceDeleteConfirm.has(index) ? 'solid' : 'ghost'"
                size="sm"
                @click="deleteExperience(index)"
              />
            </div>
          </div>
        </UCard>

        <template #content>
          <UCard>
            <UForm :state="experience" class="space-y-4">
              <!-- Job Title -->
              <div>
              <UFormField size="xl" label="Job Title" name="title">
                <UInput class="w-full" v-model="experience.title" placeholder="e.g., Software Engineer, Project Manager" />
              </UFormField>
                <p v-if="validationErrors[index]?.title" class="text-sm text-error mt-1">{{ validationErrors[index].title }}</p>
              </div>

              <!-- Employer -->
              <div>
              <UFormField size="xl" label="Employer" name="employer">
                <UInput class="w-full" v-model="experience.employer" placeholder="e.g., Google, Acme Corp" />
              </UFormField>
                <p v-if="validationErrors[index]?.employer" class="text-sm text-error mt-1">{{ validationErrors[index].employer }}</p>
              </div>

              <div>
              <UFormField size="xl" label="Employer Website" name="url">
                <UInput class="w-full" v-model="experience.url" placeholder="e.g. https://www.google.com" />
              </UFormField>
                <p v-if="validationErrors[index]?.url" class="text-sm text-error mt-1">{{ validationErrors[index].url }}</p>
              </div>

              <!-- Employment Type -->
              <UFormField size="xl" label="Employment Type" name="employmentType">
                <USelectMenu
                  v-model="experience.employmentType"
                  :items="employmentTypeOptions"
                  value-key="value"
                  label-key="label"
                  size="lg"
                />
              </UFormField>

              <!-- Location Type and Location -->
                <UFormField class="flex-1" size="xl" label="Location Type" name="locationType">
                  <USelectMenu
                    v-model="experience.locationType"
                    :items="locationTypeOptions"
                    value-key="value"
                    label-key="label"
                    size="lg"
                  />
                </UFormField>

                <UFormField class="flex-2" size="xl" label="Location" name="location">
                  <UInput 
                    class="w-full" 
                    v-model="experience.location" 
                    :placeholder="experience.locationType === 'remote' ? 'Remote' : 'e.g. Houston, TX'" 
                    :disabled="experience.locationType === 'remote'"
                  />
                </UFormField>

              <!-- Start and End Date -->
              <div class="flex gap-2 w-full"> 
                <div class="flex-1">
                  <UFormField class="w-full" size="xl" label="Start Date" name="startDate">
                  <UInput class="w-full" v-model="experience.startDate" v-maska="'##/####'" placeholder="MM/YYYY" />
                </UFormField>
                  <p v-if="validationErrors[index]?.startDate" class="text-sm text-error mt-1">{{ validationErrors[index].startDate }}</p>
                </div>

                <div class="flex-1">
                  <UFormField class="w-full" size="xl" label="End Date" name="endDate">
                  <UInput :disabled="experience.currentPosition" class="w-full" v-model="experience.endDate" v-maska="'##/####'" placeholder="MM/YYYY" />
                </UFormField>
                  <p v-if="validationErrors[index]?.endDate" class="text-sm text-error mt-1">{{ validationErrors[index].endDate }}</p>
                </div>
              </div>

              <UFormField size="xl" label="Current Position?" name="currentPosition">
                <USwitch v-model="experience.currentPosition" />
              </UFormField>

              <!-- Summary -->
              <UFormField size="xl" label="Summary" name="summary">
                <UTextarea class="w-full" v-model="experience.summary" :rows="6" autoresize placeholder="e.g. I worked on the Google Search team and helped improve the search algorithm." />
              </UFormField>

              <!-- Action Buttons -->
              <div class="flex gap-2">
                <UButton class="cursor-pointer" size="lg" type="submit" @click="saveExperience(index)">
                  Save
                </UButton>
                <UButton class="cursor-pointer" size="lg" color="neutral" variant="ghost" @click="cancelEdit(index)">
                  Cancel
                </UButton>
              </div>
            </UForm>
          </UCard>
        </template>
      </UCollapsible>

      <UButton class="cursor-pointer" icon="i-lucide-plus" color="primary" variant="ghost" size="lg" @click="addNewExperience">
        Add Work Experience
      </UButton>
    </div>

    <!-- Single Save Button for all experiences -->
    <div class="flex gap-2 pt-4">
      <UButton class="cursor-pointer" size="xl" @click="saveAllExperiences">
        Save Work Experience
      </UButton>
    </div>
  </div>
</template>

