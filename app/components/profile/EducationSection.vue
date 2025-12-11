<script setup lang="ts">
import type { Education } from '~/shared/types/careerId'
import { vMaska } from 'maska/vue'
import { watchDeep } from '@vueuse/core'
import { validateRequired, validateUrl, validateMonthYear, validateDateRange } from '~/utils/validation'

// Form data type for local state (includes UI state like isEditing)
interface EducationFormData {
  id?: number
  degreeType: string
  areaOfStudy: string
  institution: string
  startDate: string
  endDate: string
  completed: boolean
  url?: string | null
  creditHours?: number | null
  coursework: string[]
  minors: string[]
  isEditing: boolean
}

// Error type matching form data structure
interface EducationErrors {
  degreeType?: string
  areaOfStudy?: string
  institution?: string
  startDate?: string
  endDate?: string
  url?: string
  creditHours?: string
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

// Props - receive Education array from parent (store)
const props = defineProps<{
  education: Education[]
}>()

// Emit on save - supports both single education and bulk save
const emit = defineEmits<{
  save: [education: Omit<EducationFormData, 'isEditing'>] // Single education save
  saveAll: [education: Omit<EducationFormData, 'isEditing'>[]] // Bulk save all
  delete: [id: number] // Delete education by id
}>()

// Track which educations have been edited (by index, since new items don't have IDs yet)
const editedEducations = ref<Set<number>>(new Set())

// Validation errors (keyed by education index)
const validationErrors = ref<Record<number, EducationErrors>>({})

// Track delete confirmation states
const educationDeleteConfirm = ref<Set<number>>(new Set())

// Local reactive copy for editing (convert Education to EducationFormData with isEditing state)
const educationList = ref<EducationFormData[]>(
  props.education.length > 0 
    ? props.education.map(edu => ({
        id: edu.id,
        degreeType: edu.degreeType,
        areaOfStudy: edu.areaOfStudy,
        institution: edu.institution,
        startDate: formatDateForUI(edu.startDate),
        endDate: formatDateForUI(edu.endDate),
        completed: edu.completed,
        url: edu.url,
        creditHours: edu.creditHours,
        coursework: edu.coursework || [],
        minors: edu.minors || [],
        isEditing: false
      }))
    : [{
        degreeType: '',
        areaOfStudy: '',
        institution: '',
        startDate: '',
        endDate: '',
        completed: true,
        url: '',
        creditHours: undefined,
        coursework: [],
        minors: [],
        isEditing: true
      }]
)

// Flag to temporarily disable change tracking during props updates
const isUpdatingFromProps = ref(false)

// Watch each education object for deep changes
watchDeep(educationList, () => {
  // Skip if we're updating from props
  if (isUpdatingFromProps.value) return
  
  // Mark all educations as potentially edited when any field changes
  // We'll verify actual changes when saving
  educationList.value.forEach((_, index) => {
    editedEducations.value.add(index)
  })
})

// Mark education as edited when any field changes
function markAsEdited(index: number) {
  editedEducations.value.add(index)
}

// Watch for external prop changes (when store updates)
// Preserve isEditing state for items that are currently being edited
watch(() => props.education, (newValue) => {
  // Disable change tracking during this update
  isUpdatingFromProps.value = true
  
  // Create a map of current isEditing states by id
  const editingStates = new Map(
    educationList.value.map(edu => [edu.id, edu.isEditing])
  )
  
  educationList.value = newValue.length > 0
    ? newValue.map(edu => ({
        id: edu.id,
        degreeType: edu.degreeType,
        areaOfStudy: edu.areaOfStudy,
        institution: edu.institution,
        startDate: formatDateForUI(edu.startDate),
        endDate: formatDateForUI(edu.endDate),
        completed: edu.completed,
        url: edu.url,
        creditHours: edu.creditHours,
        coursework: edu.coursework || [],
        minors: edu.minors || [],
        // Preserve isEditing state if this item was already being edited
        isEditing: editingStates.get(edu.id) ?? false
      }))
    : [{
        degreeType: '',
        areaOfStudy: '',
        institution: '',
        startDate: '',
        endDate: '',
        completed: true,
        url: '',
        creditHours: undefined,
        coursework: [],
        minors: [],
        isEditing: true
      }]
  
  // Clear edited educations tracking when props update
  editedEducations.value.clear()
  
  // Re-enable change tracking
  isUpdatingFromProps.value = false
}, { deep: true })

function createBlankEducation(): EducationFormData {
  return {
    degreeType: '',
    areaOfStudy: '',
    institution: '',
    startDate: '',
    endDate: '',
    completed: true,
    url: '',
    creditHours: undefined,
    coursework: [],
    minors: [],
    isEditing: true
  }
}

// Save individual education - closes edit mode and emits just that education
function saveEducation(index: number) {
  const education = educationList.value[index]
  if (!education) return
  
  // Validate before saving
  if (!validateEducation(education, index)) {
    return // Stop if validation fails
  }
  
  // Only save if this education was actually edited or is new (no id)
  if (!education.id || editedEducations.value.has(index)) {
    // Clean empty strings from arrays before emitting
    const cleanedEducation = cleanEducationArrays(education)
    emit('save', cleanedEducation)
    
    // Update local state with cleaned arrays
    education.coursework = cleanedEducation.coursework
    education.minors = cleanedEducation.minors
    
    // Clear the edited flag after saving
    editedEducations.value.delete(index)
  }
  
  // Close editing mode for this education
  education.isEditing = false
  // Clear validation errors on successful save
  if (validationErrors.value[index]) {
    delete validationErrors.value[index]
  }
}

// Emit all educations on save - only sends edited ones
function saveAllEducations() {
  // Validate all educations before saving
  let allValid = true
  const educationsToValidate = educationList.value
    .map((edu, index) => ({ edu, index }))
    .filter(({ edu, index }) => !edu.id || editedEducations.value.has(index))
  
  for (const { edu, index } of educationsToValidate) {
    if (!validateEducation(edu, index)) {
      allValid = false
    }
  }
  
  if (!allValid) {
    return // Stop if any validation fails
  }
  
  // Only save educations that were edited or are new (no id)
  const educationsToSave = educationList.value
    .map((edu, index) => ({ edu, index }))
    .filter(({ edu, index }) => !edu.id || editedEducations.value.has(index))
    .map(({ edu, index }) => {
      const cleaned = cleanEducationArrays(edu)
      
      // Update local state with cleaned arrays
      edu.coursework = cleaned.coursework
      edu.minors = cleaned.minors
      
      return cleaned
    })
  
  // Only emit if there are actually changes to save
  if (educationsToSave.length > 0) {
    emit('saveAll', educationsToSave)
    
    // Clear all edited flags and validation errors after saving
    editedEducations.value.clear()
    validationErrors.value = {}
  }
}

// Revert all changes back to original props values
function revertAllChanges() {
  isUpdatingFromProps.value = true
  
  educationList.value = props.education.length > 0
    ? props.education.map(edu => ({
        id: edu.id,
        degreeType: edu.degreeType,
        areaOfStudy: edu.areaOfStudy,
        institution: edu.institution,
        startDate: formatDateForUI(edu.startDate),
        endDate: formatDateForUI(edu.endDate),
        completed: edu.completed,
        url: edu.url,
        creditHours: edu.creditHours,
        coursework: edu.coursework || [],
        minors: edu.minors || [],
        isEditing: false
      }))
    : []
  
  editedEducations.value.clear()
  validationErrors.value = {}
  isUpdatingFromProps.value = false
}

function editEducation(index: number) {
  const education = educationList.value[index]
  if (!education) return
  
  education.isEditing = true
  // Don't mark as edited just by opening - only when they actually change something
}

function cancelEdit(index: number) {
  const education = educationList.value[index]
  if (!education) return
  
  // If this is a new unsaved education (no id), remove it
  if (!education.id) {
    educationList.value.splice(index, 1)
    editedEducations.value.delete(index)
    return
  }
  
  // If it has an id, reset it back to original values from props
  const original = props.education.find(edu => edu.id === education.id)
  if (original) {
    // Reset all fields to original values
    education.degreeType = original.degreeType
    education.areaOfStudy = original.areaOfStudy
    education.institution = original.institution
    education.startDate = formatDateForUI(original.startDate)
    education.endDate = formatDateForUI(original.endDate)
    education.completed = original.completed
    education.url = original.url
    education.creditHours = original.creditHours
    education.coursework = [...(original.coursework || [])]
    education.minors = [...(original.minors || [])]
  }
  
  // Clear edited flag and close edit mode
  editedEducations.value.delete(index)
  education.isEditing = false
}

function deleteEducation(index: number) {
  const education = educationList.value[index]
  if (!education) return
  
  // Check if already in confirm state
  if (educationDeleteConfirm.value.has(index)) {
    // Actually delete - emit event if it has an id, otherwise just remove from local state
    if (education.id) {
      emit('delete', education.id)
    }
    educationList.value.splice(index, 1)
    educationDeleteConfirm.value.delete(index)
  } else {
    // First click: enter confirm state
    educationDeleteConfirm.value.add(index)
    // Auto-clear confirmation after 3 seconds
    setTimeout(() => {
      educationDeleteConfirm.value.delete(index)
    }, 3000)
  }
}

function addNewEducation() {
  // Add a new blank education in edit mode
  const newIndex = educationList.value.length
  educationList.value.push(createBlankEducation())
  // New educations are automatically considered "edited" since they need to be saved
  editedEducations.value.add(newIndex)
}

// Validate single education
function validateEducation(edu: EducationFormData, index: number): boolean {
  // Clear previous errors for this education
  if (validationErrors.value[index]) {
    delete validationErrors.value[index]
  }
  
  const errors: EducationErrors = {}
  let isValid = true
  
  // Validate required fields
  const institutionError = validateRequired(edu.institution, 'Institution')
  if (institutionError) {
    errors.institution = institutionError
    isValid = false
  }
  
  // Validate start date
  const startDateError = validateMonthYear(edu.startDate, true)
  if (startDateError) {
    errors.startDate = startDateError
    isValid = false
  }
  
  // Validate end date (if completed)
  if (edu.completed && edu.endDate) {
    const endDateError = validateMonthYear(edu.endDate, false)
    if (endDateError) {
      errors.endDate = endDateError
      isValid = false
    } else if (edu.startDate) {
      // Validate date range
      const rangeError = validateDateRange(edu.startDate, edu.endDate, 'End date')
      if (rangeError) {
        errors.endDate = rangeError
        isValid = false
      }
    }
  }
  
  // Validate URL if provided
  if (edu.url && edu.url.trim()) {
    const urlError = validateUrl(edu.url, false)
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

// Coursework management
function addCoursework(educationIndex: number) {
  const education = educationList.value[educationIndex]
  if (!education) return
  education.coursework.push('')
  // watchDeep will automatically mark as edited
}

function removeCoursework(educationIndex: number, courseworkIndex: number) {
  const education = educationList.value[educationIndex]
  if (!education) return
  education.coursework.splice(courseworkIndex, 1)
  // watchDeep will automatically mark as edited
}

// Minor management
function addMinor(educationIndex: number) {
  const education = educationList.value[educationIndex]
  if (!education) return
  education.minors.push('')
  // watchDeep will automatically mark as edited
}

function removeMinor(educationIndex: number, minorIndex: number) {
  const education = educationList.value[educationIndex]
  if (!education) return
  education.minors.splice(minorIndex, 1)
  // watchDeep will automatically mark as edited
}

/**
 * Remove empty strings from an array
 */
function cleanEmptyStrings(arr: string[] | undefined | null): string[] {
  if (!arr) return []
  return arr.filter(item => item && item.trim() !== '')
}

/**
 * Clean empty entries from education arrays (coursework, minors)
 */
function cleanEducationArrays(education: EducationFormData): Omit<EducationFormData, 'isEditing'> {
  return {
    ...education,
    coursework: cleanEmptyStrings(education.coursework),
    minors: cleanEmptyStrings(education.minors)
  }
}

// Expose save method for autosave functionality and revert for error handling
defineExpose({
  triggerSave: saveAllEducations,
  revertChanges: revertAllChanges
})
</script>

<template>
  <div class="max-w-xl mx-auto space-y-4">
    <!-- Section Title and Description -->
    <div class="mb-8 space-y-2">
      <h1 class="text-2xl sm:text-3xl font-semibold text-foreground">Tell us about your education</h1>
      <p class="text-sm text-muted">
        Share your academic background and relevant coursework.
      </p>
    </div>

    <!-- Helper Text -->
    <div class="bg-info/5 border border-info/50 rounded-lg p-4">
      <div class="flex gap-3">
        <UIcon name="i-lucide-lightbulb" class="w-5 h-5 text-info shrink-0 mt-0.5" />
        <div class="text-sm text-muted">
          <p class="font-medium text-foreground mb-1">Tips for adding education</p>
          <ul class="list-disc list-inside space-y-1">
            <li>Add relevant coursework and minors that relate to your career goals.</li>
            <li>Even if you didn't finish, you can add credit hours earned.</li>
            <li>List all relevant degrees, certificates, and credentials.</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- All Education Entries (each with its own state) -->
    <div class="flex flex-col gap-4">
      <UCollapsible 
        disabled
        v-for="(education, index) in educationList" 
        :key="index"
        v-model:open="education.isEditing"
        class="flex flex-col gap-2"
      >
        <!-- Collapsed View -->
        <UCard v-if="!education.isEditing">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <h2 class="text-md font-semibold text-foreground">
                {{ education.degreeType || 'Unknown Degree' }}, {{ education.areaOfStudy || 'Unknown Subject' }}
              </h2>
              <h3 class="text-sm text-muted">{{ education.institution || 'Untitled Institution' }}</h3>
              <p class="text-sm text-muted" v-if="education.startDate || education.endDate">
                {{ education.startDate }} - {{ education.endDate || 'Present' }}
              </p>
            </div>
            <div class="flex gap-2">
              <UButton 
                class="cursor-pointer"
                icon="i-lucide-pencil" 
                color="neutral" 
                variant="ghost" 
                size="sm"
                @click="editEducation(index)"
              />
              <UButton 
                class="cursor-pointer"
                :icon="educationDeleteConfirm.has(index) ? 'i-lucide-check' : 'i-lucide-trash-2'"
                :label="educationDeleteConfirm.has(index) ? 'Sure?' : undefined"
                color="error" 
                :variant="educationDeleteConfirm.has(index) ? 'solid' : 'ghost'"
                size="sm"
                @click="deleteEducation(index)"
              />
            </div>
          </div>
        </UCard>

        <!-- Expanded Edit Form Header -->
        <UCard v-if="education.isEditing">
          <div class="flex items-center justify-between mb-4">
            <div class="flex-1">
              <h2 class="text-md font-semibold text-foreground">
                {{ education.degreeType || 'Unknown Degree' }}, {{ education.areaOfStudy || 'Unknown Subject' }}
              </h2>
              <h3 class="text-sm text-muted">{{ education.institution || 'Untitled Institution' }}</h3>
              <p class="text-sm text-muted" v-if="education.startDate || education.endDate">
                {{ education.startDate }} - {{ education.endDate || 'Present' }}
              </p>
            </div>
            <div class="flex gap-2">
              <UButton 
                class="cursor-pointer"
                icon="i-lucide-pencil" 
                color="success" 
                variant="ghost" 
                size="sm"
                @click="education.isEditing = false"
              />
              <UButton 
                class="cursor-pointer"
                :icon="educationDeleteConfirm.has(index) ? 'i-lucide-check' : 'i-lucide-trash-2'"
                :label="educationDeleteConfirm.has(index) ? 'Sure?' : undefined"
                color="error" 
                :variant="educationDeleteConfirm.has(index) ? 'solid' : 'ghost'"
                size="sm"
                @click="deleteEducation(index)"
              />
            </div>
          </div>
        </UCard>

        <template #content>
          <UCard>
            <UForm :state="education" class="space-y-4">
              <!-- Degree Type and Area of Study -->
              <div class="flex gap-2 w-full">
                <UFormField class="flex-1" size="xl" label="Degree Type" name="degreeType">
                  <UInput 
                    class="w-full"
                    v-model="education.degreeType" 
                    placeholder="e.g., Bachelor of Science, Master of Arts"
                  />
                </UFormField>

                <UFormField class="flex-1" size="xl" label="Area of Study" name="areaOfStudy">
                  <UInput 
                    class="w-full"
                    v-model="education.areaOfStudy" 
                    placeholder="e.g., Computer Science, Mathematics"
                  />
                </UFormField>
              </div>

              <!-- Institution -->
              <div>
                <UFormField size="xl" label="Institution" name="institution">
                  <UInput 
                    class="w-full"
                    v-model="education.institution" 
                    placeholder="e.g., Stanford University, MIT"
                  />
                </UFormField>
                <p v-if="validationErrors[index]?.institution" class="text-sm text-error mt-1">{{ validationErrors[index].institution }}</p>
              </div>

              <!-- Institution Website -->
              <div>
                <UFormField size="xl" label="Institution Website" name="url">
                  <UInput 
                    class="w-full"
                    v-model="education.url" 
                    placeholder="e.g., https://www.stanford.edu"
                  />
                </UFormField>
                <p v-if="validationErrors[index]?.url" class="text-sm text-error mt-1">{{ validationErrors[index].url }}</p>
              </div>

              <!-- Start and End Date -->
              <div class="flex gap-2 w-full">
                <div class="flex-1">
                  <UFormField class="w-full" size="xl" label="Start Date" name="startDate">
                    <UInput 
                      class="w-full"
                      v-model="education.startDate" 
                      v-maska="'##/####'" 
                      placeholder="MM/YYYY"
                    />
                  </UFormField>
                  <p v-if="validationErrors[index]?.startDate" class="text-sm text-error mt-1">{{ validationErrors[index].startDate }}</p>
                </div>

                <div class="flex-1">
                  <UFormField class="w-full" size="xl" label="End Date" name="endDate">
                    <UInput 
                      class="w-full"
                      v-model="education.endDate" 
                      v-maska="'##/####'" 
                      placeholder="MM/YYYY"
                    />
                  </UFormField>
                  <p v-if="validationErrors[index]?.endDate" class="text-sm text-error mt-1">{{ validationErrors[index].endDate }}</p>
                </div>
              </div>

              <!-- GPA (always shown) and Credit Hours (only when not completed) -->
              <div class="grid grid-cols-2 gap-2 w-full">
                <UFormField size="xl" label="Completed?" name="completed">
                  <USwitch size="xl" v-model="education.completed" class="w-full" />
                </UFormField>

                <UFormField 
                  v-if="!education.completed" 
                  class="col-span-1" 
                  size="xl" 
                  label="Credit Hours Earned" 
                  name="creditHours"
                >
                  <UInput 
                    class="w-full"
                    v-model.number="education.creditHours" 
                    type="number"
                    placeholder="e.g., 60"
                  />
                </UFormField>
              </div>

              <!-- Minors -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium text-foreground">Minors</label>
                </div>
                <div v-if="education.minors.length > 0" class="space-y-2">
                  <div v-for="(minor, minorIndex) in education.minors" :key="minorIndex" class="flex gap-2 items-start">
                    <UInput 
                      class="flex-1"
                      v-model="education.minors[minorIndex]" 
                      placeholder="e.g., Mathematics, Psychology"
                      size="lg"
                    />
                    <UButton 
                      icon="i-lucide-trash-2" 
                      color="error" 
                      variant="ghost" 
                      size="lg"
                      @click="removeMinor(index, minorIndex)"
                    />
                  </div>
                </div>
                <UButton 
                  class="cursor-pointer"
                  icon="i-lucide-plus" 
                  color="primary" 
                  variant="ghost" 
                  size="sm"
                  @click="addMinor(index)"
                >
                  Add Minor
                </UButton>
              </div>

              <!-- Relevant Coursework -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium text-foreground">Relevant Coursework</label>
                </div>
                <div v-if="education.coursework.length > 0" class="space-y-2">
                  <div v-for="(course, courseIndex) in education.coursework" :key="courseIndex" class="flex gap-2 items-start">
                    <UInput 
                      class="flex-1"
                      v-model="education.coursework[courseIndex]" 
                      placeholder="e.g., Data Structures, Machine Learning"
                      size="lg"
                    />
                    <UButton 
                      icon="i-lucide-trash-2" 
                      color="error" 
                      variant="ghost" 
                      size="lg"
                      @click="removeCoursework(index, courseIndex)"
                    />
                  </div>
                </div>
                <UButton 
                  class="cursor-pointer"
                  icon="i-lucide-plus" 
                  color="primary" 
                  variant="ghost" 
                  size="sm"
                  @click="addCoursework(index)"
                >
                  Add Course
                </UButton>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-2">
                <UButton class="cursor-pointer" size="lg" type="submit" @click="saveEducation(index)">
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

      <UButton class="cursor-pointer" icon="i-lucide-plus" color="primary" variant="ghost" size="lg" @click="addNewEducation">
        Add Education
      </UButton>
    </div>

    <!-- Single Save Button for all educations -->
    <div class="flex gap-2 pt-4">
      <UButton class="cursor-pointer" size="xl" @click="saveAllEducations">
        Save Education
      </UButton>
    </div>
  </div>
</template>

