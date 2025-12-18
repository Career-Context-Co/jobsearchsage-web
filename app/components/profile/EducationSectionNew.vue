<script setup lang="ts">
import type { Education } from '#shared/types/careerId'
import { vMaska } from 'maska/vue'
import { validateRequired, validateUrl, validateMonthYear, validateDateRange } from '~/utils/validation'

const careerIDStore = useCareerIDStore()
const toast = useToast()

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

/**
 * Convert date from MM/YYYY to YYYY-MM-DD format for API
 */
function formatDateForAPI(dateString: string | undefined): string | undefined {
  if (!dateString || !dateString.trim()) return undefined
  
  // If already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString
  
  // Parse MM/YYYY and convert to YYYY-MM-DD
  const match = dateString.match(/^(\d{2})\/(\d{4})$/)
  if (!match) return dateString
  
  const [, month, year] = match
  return `${year}-${month}-01`
}

// Props - receive Education array from parent (store via onboarding)
const props = defineProps<{
  education: Education[]
}>()

// Education data sorted by end date (most recent first)
const educationList = computed(() => {
  return [...props.education].sort((a, b) => {
    return new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  })
})

// Form states - using INDEX-based tracking (not ID-based) to handle extracted items
const isAddingEducation = ref(false)
const editingEducationIndex = ref<number | null>(null)
const isSavingEducation = ref(false)

// Form data
interface EducationFormData {
  degreeType: string
  areaOfStudy: string
  institution: string
  startDate: string
  endDate: string
  completed: boolean
  url: string
  creditHours: string
  coursework: string[]
  minors: string[]
}

const formData = ref<Partial<EducationFormData>>({
  completed: true,
  coursework: [''],
  minors: ['']
})
const formErrors = ref<Record<string, string>>({})

// Start adding new education
function startAddingEducation() {
  formData.value = {
    degreeType: '',
    areaOfStudy: '',
    institution: '',
    startDate: '',
    endDate: '',
    completed: true,
    url: '',
    creditHours: '',
    coursework: [''],
    minors: ['']
  }
  formErrors.value = {}
  isAddingEducation.value = true
}

// Start editing existing education - accepts INDEX not object
function startEditingEducation(eduIndex: number) {
  const education = educationList.value[eduIndex]
  if (!education) return
  
  editingEducationIndex.value = eduIndex
  formData.value = {
    degreeType: education.degreeType,
    areaOfStudy: education.areaOfStudy,
    institution: education.institution,
    startDate: formatDateForUI(education.startDate),
    endDate: formatDateForUI(education.endDate),
    completed: education.completed,
    url: education.url || '',
    creditHours: education.creditHours?.toString() || '',
    coursework: education.coursework.length > 0 ? [...education.coursework] : [''],
    minors: education.minors.length > 0 ? [...education.minors] : ['']
  }
  formErrors.value = {}
}

// Cancel editing
function cancelEdit() {
  isAddingEducation.value = false
  editingEducationIndex.value = null
  formData.value = {}
  formErrors.value = {}
}

// Add coursework field
function addCoursework() {
  if (!formData.value.coursework) {
    formData.value.coursework = []
  }
  formData.value.coursework.push('')
}

// Remove coursework field
function removeCoursework(index: number) {
  if (formData.value.coursework) {
    formData.value.coursework.splice(index, 1)
  }
}

// Add minor field
function addMinor() {
  if (!formData.value.minors) {
    formData.value.minors = []
  }
  formData.value.minors.push('')
}

// Remove minor field
function removeMinor(index: number) {
  if (formData.value.minors) {
    formData.value.minors.splice(index, 1)
  }
}

// Validate form
function validateForm(): boolean {
  const errors: Record<string, string> = {}
  
  // Required fields
  const degreeTypeError = validateRequired(formData.value.degreeType, 'Degree Type')
  if (degreeTypeError) errors.degreeType = degreeTypeError
  
  const areaOfStudyError = validateRequired(formData.value.areaOfStudy, 'Area of Study')
  if (areaOfStudyError) errors.areaOfStudy = areaOfStudyError
  
  const institutionError = validateRequired(formData.value.institution, 'Institution')
  if (institutionError) errors.institution = institutionError
  
  // Validate start date
  const startDateError = validateMonthYear(formData.value.startDate, true)
  if (startDateError) errors.startDate = startDateError
  
  // Validate end date - only required if degree is completed
  if (formData.value.completed) {
    const endDateError = validateMonthYear(formData.value.endDate, true)
    if (endDateError) errors.endDate = endDateError
    else if (formData.value.startDate && formData.value.endDate) {
      // Validate date range
      const rangeError = validateDateRange(formData.value.startDate, formData.value.endDate, 'End Date')
      if (rangeError) errors.endDate = rangeError
    }
  } else if (formData.value.endDate && formData.value.endDate.trim()) {
    // If end date is provided for in-progress degree, validate format
    const endDateError = validateMonthYear(formData.value.endDate, false)
    if (endDateError) errors.endDate = endDateError
    else if (formData.value.startDate) {
      // Validate date range if provided
      const rangeError = validateDateRange(formData.value.startDate, formData.value.endDate, 'End Date')
      if (rangeError) errors.endDate = rangeError
    }
  }
  
  // Validate URL if provided
  if (formData.value.url && formData.value.url.trim()) {
    const urlError = validateUrl(formData.value.url, false)
    if (urlError) errors.url = urlError
  }
  
  // Validate credit hours if provided
  if (formData.value.creditHours && formData.value.creditHours.trim()) {
    const hours = parseInt(formData.value.creditHours)
    if (isNaN(hours) || hours < 0 || hours > 500) {
      errors.creditHours = 'Credit hours must be between 0 and 500'
    }
  }
  
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

// Save education (add or update)
async function saveEducation(): Promise<boolean> {
  if (!validateForm()) {
    toast.add({
      title: 'Validation Error',
      description: 'Please fix the errors in the form',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return false // Return false to indicate validation failure
  }
  
  isSavingEducation.value = true
  
  try {
    // Filter out empty coursework and minors
    const coursework = formData.value.coursework?.filter(c => c.trim()) || []
    const minors = formData.value.minors?.filter(m => m.trim()) || []
    
    const educationData = {
      degreeType: formData.value.degreeType!,
      areaOfStudy: formData.value.areaOfStudy!,
      institution: formData.value.institution!,
      startDate: formatDateForAPI(formData.value.startDate)!,
      endDate: formData.value.completed 
        ? formatDateForAPI(formData.value.endDate)! 
        : formatDateForAPI(formData.value.endDate),
      completed: formData.value.completed || false,
      url: formData.value.url || undefined,
      creditHours: formData.value.creditHours ? parseInt(formData.value.creditHours) : undefined,
      coursework,
      minors
    }
    
    // Check if we're editing an existing education with an ID (UPDATE) or adding/saving extracted (ADD)
    const isUpdating = editingEducationIndex.value !== null && educationList.value[editingEducationIndex.value]?.id
    
    if (isUpdating) {
      // Update existing education (has ID in database)
      const education = educationList.value[editingEducationIndex.value!]
      if (!education?.id) {
        throw new Error('Cannot update education without ID')
      }
      await careerIDStore.updateEducation(education.id, educationData)
      
      toast.add({
        title: 'Success',
        description: 'Education updated successfully',
        icon: 'i-lucide-check',
        color: 'success'
      })
    } else {
      // Add new education (includes: new items, extracted items being saved for first time)
      // Find the extracted education we're saving (if any)
      const extractedEducation = educationList.value.find(edu => 
        !edu.id && 
        edu.institution === formData.value.institution &&
        edu.areaOfStudy === formData.value.areaOfStudy &&
        edu.isExtracted
      )
      
      await careerIDStore.addEducation({
        ...educationData,
        displayOrder: educationList.value.length + 1
      })
      
      // Remove the extracted version after successful save to avoid duplicates
      if (extractedEducation) {
        careerIDStore.education = careerIDStore.education.filter(
          edu => edu !== extractedEducation
        )
      }
      
      toast.add({
        title: 'Success',
        description: 'Education added successfully',
        icon: 'i-lucide-check',
        color: 'success'
      })
    }
    
    cancelEdit()
    return true // Success
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.message || 'Failed to save education',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return false // API error
  } finally {
    isSavingEducation.value = false
  }
}

// Delete education - accepts OBJECT to handle extracted items without IDs
async function deleteEducation(educationToDelete: Education) {
  if (!confirm('Are you sure you want to delete this education?')) {
    return
  }
  
  try {
    // If education has an ID, it's saved in DB - call API to delete
    if (educationToDelete.id) {
      await careerIDStore.deleteEducation(educationToDelete.id)
    } else {
      // If no ID, it's extracted but not saved - just remove from store array
      careerIDStore.education = careerIDStore.education.filter(
        edu => edu !== educationToDelete
      )
    }
    
    toast.add({
      title: 'Success',
      description: 'Education deleted successfully',
      icon: 'i-lucide-check',
      color: 'success'
    })
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.message || 'Failed to delete education',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

// Format date for display
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// Exposed methods for compatibility with onboarding.vue
async function triggerSave() {
  // Auto-save if in edit mode or adding mode
  if (isAddingEducation.value || editingEducationIndex.value !== null) {
    await saveEducation()
  }
}

// Save all unsaved items (extracted items without IDs)
async function saveAllUnsaved(): Promise<boolean> {
  const unsavedEducation = educationList.value.filter(edu => !edu.id)
  
  if (unsavedEducation.length === 0) {
    return true // Nothing to save
  }
  
  for (const education of unsavedEducation) {
    // Start editing this education to trigger validation
    const index = educationList.value.indexOf(education)
    startEditingEducation(index)
    
    // Try to save it
    const success = await saveEducation()
    
    if (!success) {
      // Validation or save failed - keep the form open with errors visible
      return false
    }
  }
  
  return true // All saved successfully
}

function revertChanges() {
  // Cancel any active edits
  cancelEdit()
}

function handleApiError(error: any) {
  toast.add({
    title: 'Error',
    description: error?.data?.error?.message || error?.message || 'An error occurred',
    icon: 'i-lucide-alert-circle',
    color: 'error'
  })
}

// Expose methods for parent component
defineExpose({
  triggerSave,
  saveAllUnsaved,
  revertChanges,
  handleApiError
})
</script>

<template>
  <div class="space-y-4">
    <!-- Page Header -->
    <UPageCard
      title="Education"
      description="Your academic background and qualifications"
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        v-if="!isAddingEducation && editingEducationIndex === null"
        label="Add Education"
        color="primary"
        variant="outline"
        icon="i-lucide-plus"
        class="cursor-pointer w-fit lg:ms-auto"
        @click="startAddingEducation"
      />
    </UPageCard>

    <!-- Add Education Form -->
    <UPageCard v-if="isAddingEducation" variant="subtle" class="mb-4">
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Add Education</h3>
        
        <!-- Degree Type -->
        <div>
          <label class="block text-sm font-medium mb-1">Degree Type <span class="text-error">*</span></label>
          <UInput
            v-model="formData.degreeType"
            placeholder="e.g. Bachelor of Science, Master of Arts"
            class="w-full"
            :error="!!formErrors.degreeType"
          />
          <p v-if="formErrors.degreeType" class="text-sm text-error mt-1">{{ formErrors.degreeType }}</p>
        </div>

        <!-- Area of Study -->
        <div>
          <label class="block text-sm font-medium mb-1">Area of Study <span class="text-error">*</span></label>
          <UInput
            v-model="formData.areaOfStudy"
            placeholder="e.g. Computer Science, Business Administration"
            class="w-full"
            :error="!!formErrors.areaOfStudy"
          />
          <p v-if="formErrors.areaOfStudy" class="text-sm text-error mt-1">{{ formErrors.areaOfStudy }}</p>
        </div>

        <!-- Institution -->
        <div>
          <label class="block text-sm font-medium mb-1">Institution <span class="text-error">*</span></label>
          <UInput
            v-model="formData.institution"
            placeholder="e.g. Stanford University, MIT"
            class="w-full"
            :error="!!formErrors.institution"
          />
          <p v-if="formErrors.institution" class="text-sm text-error mt-1">{{ formErrors.institution }}</p>
        </div>

        <!-- Dates -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Start Date <span class="text-error">*</span></label>
            <UInput
              v-model="formData.startDate"
              v-maska="'##/####'"
              placeholder="MM/YYYY"
              class="w-full"
              :error="!!formErrors.startDate"
            />
            <p v-if="formErrors.startDate" class="text-sm text-error mt-1">{{ formErrors.startDate }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">
              End Date 
              <span v-if="formData.completed" class="text-error">*</span>
              <span v-else class="text-muted text-xs">(optional if in progress)</span>
            </label>
            <UInput
              v-model="formData.endDate"
              v-maska="'##/####'"
              placeholder="MM/YYYY"
              class="w-full"
              :error="!!formErrors.endDate"
            />
            <p v-if="formErrors.endDate" class="text-sm text-error mt-1">{{ formErrors.endDate }}</p>
          </div>
        </div>

        <!-- Completed Checkbox -->
        <div>
          <UCheckbox
            v-model="formData.completed"
            label="Degree completed"
          />
        </div>

        <!-- Institution Website -->
        <div>
          <label class="block text-sm font-medium mb-1">Institution Website</label>
          <UInput
            v-model="formData.url"
            placeholder="https://example.edu"
            class="w-full"
            :error="!!formErrors.url"
          >
            <template #leading>
              <UIcon name="i-lucide-link" class="w-4 h-4 text-muted" />
            </template>
          </UInput>
          <p v-if="formErrors.url" class="text-sm text-error mt-1">{{ formErrors.url }}</p>
        </div>

        <!-- Credit Hours -->
        <div>
          <label class="block text-sm font-medium mb-1">Credit Hours</label>
          <UInput
            v-model="formData.creditHours"
            type="number"
            placeholder="120"
            class="w-full"
            :error="!!formErrors.creditHours"
          />
          <p v-if="formErrors.creditHours" class="text-sm text-error mt-1">{{ formErrors.creditHours }}</p>
        </div>

        <!-- Relevant Coursework -->
        <div>
          <label class="block text-sm font-medium mb-1">Relevant Coursework</label>
          <div class="space-y-2">
            <div
              v-for="(course, index) in formData.coursework"
              :key="index"
              class="flex gap-2 items-start"
            >
              <UInput
                v-model="formData.coursework![index]"
                placeholder="Course name..."
                class="flex-1"
              />
              <UButton
                v-if="formData.coursework!.length > 1"
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                class="cursor-pointer"
                @click="removeCoursework(index)"
              />
            </div>
            <UButton
              label="Add Coursework"
              icon="i-lucide-plus"
              color="neutral"
              variant="outline"
              size="sm"
              class="cursor-pointer"
              @click="addCoursework"
            />
          </div>
        </div>

        <!-- Minors -->
        <div>
          <label class="block text-sm font-medium mb-1">Minors</label>
          <div class="space-y-2">
            <div
              v-for="(minor, index) in formData.minors"
              :key="index"
              class="flex gap-2 items-start"
            >
              <UInput
                v-model="formData.minors![index]"
                placeholder="Minor name..."
                class="flex-1"
              />
              <UButton
                v-if="formData.minors!.length > 1"
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                class="cursor-pointer"
                @click="removeMinor(index)"
              />
            </div>
            <UButton
              label="Add Minor"
              icon="i-lucide-plus"
              color="neutral"
              variant="outline"
              size="sm"
              class="cursor-pointer"
              @click="addMinor"
            />
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2 justify-end pt-4">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            class="cursor-pointer"
            @click="cancelEdit"
            :disabled="isSavingEducation"
          />
          <UButton
            label="Save Education"
            color="primary"
            icon="i-lucide-check"
            class="cursor-pointer"
            :loading="isSavingEducation"
            @click="saveEducation"
          />
        </div>
      </div>
    </UPageCard>

    <!-- Education List -->
    <div v-if="educationList.length > 0 && !isAddingEducation" class="space-y-4">
      <div
        v-for="(education, eduIndex) in educationList"
        :key="education.id || eduIndex"
        class="border border-default rounded-lg"
        :class="{ 'ring-1 ring-cyan-500 dark:ring-cyan-400': education.isExtracted }"
      >
        <!-- View Mode -->
        <UPageCard v-if="editingEducationIndex !== eduIndex" variant="subtle">
          <div class="flex justify-between items-start gap-4">
            <div class="flex-1">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="text-lg font-semibold">{{ education.degreeType }}</h3>
                    <UBadge
                      v-if="education.isExtracted"
                      color="neutral"
                      class="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300"
                    >
                      <div class="flex items-center gap-1">
                        <UIcon name="i-lucide-sparkles" class="w-3 h-3" />
                        <span>Extracted</span>
                      </div>
                    </UBadge>
                  </div>
                  <p class="text-base font-medium">{{ education.areaOfStudy }}</p>
                  <p class="text-base font-medium text-muted">{{ education.institution }}</p>
                  <div class="flex flex-wrap gap-2 mt-2 text-sm text-muted">
                    <span>{{ formatDate(education.startDate) }} - {{ formatDate(education.endDate) }}</span>
                    <span v-if="!education.completed && education.creditHours">• {{ education.creditHours }} credit hours</span>
                  </div>
                </div>
                <div class="flex gap-2">
                  <UButton
                    icon="i-lucide-pencil"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    class="cursor-pointer"
                    @click="startEditingEducation(eduIndex)"
                  />
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="sm"
                    class="cursor-pointer"
                    @click="deleteEducation(education)"
                  />
                </div>
              </div>

              <div v-if="education.minors && education.minors.length > 0" class="mt-3">
                <p class="text-sm font-medium mb-1">Minors:</p>
                <p class="text-sm text-muted">{{ education.minors.join(', ') }}</p>
              </div>

              <div v-if="education.url" class="mt-3">
                <a
                  :href="education.url"
                  target="_blank"
                  rel="noopener"
                  class="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  <UIcon name="i-lucide-external-link" class="w-3 h-3" />
                  Visit Institution Website
                </a>
              </div>
            </div>
          </div>
        </UPageCard>

        <!-- Edit Mode -->
        <UPageCard v-else variant="subtle">
          <div class="space-y-4">
            <h3 class="text-lg font-semibold">Edit Education</h3>
            
            <!-- Degree Type -->
            <div>
              <label class="block text-sm font-medium mb-1">Degree Type <span class="text-error">*</span></label>
              <UInput
                v-model="formData.degreeType"
                placeholder="e.g. Bachelor of Science, Master of Arts"
                class="w-full"
                :error="!!formErrors.degreeType"
              />
              <p v-if="formErrors.degreeType" class="text-sm text-error mt-1">{{ formErrors.degreeType }}</p>
            </div>

            <!-- Area of Study -->
            <div>
              <label class="block text-sm font-medium mb-1">Area of Study <span class="text-error">*</span></label>
              <UInput
                v-model="formData.areaOfStudy"
                placeholder="e.g. Computer Science, Business Administration"
                class="w-full"
                :error="!!formErrors.areaOfStudy"
              />
              <p v-if="formErrors.areaOfStudy" class="text-sm text-error mt-1">{{ formErrors.areaOfStudy }}</p>
            </div>

            <!-- Institution -->
            <div>
              <label class="block text-sm font-medium mb-1">Institution <span class="text-error">*</span></label>
              <UInput
                v-model="formData.institution"
                placeholder="e.g. Stanford University, MIT"
                class="w-full"
                :error="!!formErrors.institution"
              />
              <p v-if="formErrors.institution" class="text-sm text-error mt-1">{{ formErrors.institution }}</p>
            </div>

            <!-- Dates -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Start Date <span class="text-error">*</span></label>
                <UInput
                  v-model="formData.startDate"
                  v-maska="'##/####'"
                  placeholder="MM/YYYY"
                  class="w-full"
                  :error="!!formErrors.startDate"
                />
                <p v-if="formErrors.startDate" class="text-sm text-error mt-1">{{ formErrors.startDate }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">
                  End Date 
                  <span v-if="formData.completed" class="text-error">*</span>
                  <span v-else class="text-muted text-xs">(optional if in progress)</span>
                </label>
                <UInput
                  v-model="formData.endDate"
                  v-maska="'##/####'"
                  placeholder="MM/YYYY"
                  class="w-full"
                  :error="!!formErrors.endDate"
                />
                <p v-if="formErrors.endDate" class="text-sm text-error mt-1">{{ formErrors.endDate }}</p>
              </div>
            </div>

            <!-- Completed Checkbox -->
            <div>
              <UCheckbox
                v-model="formData.completed"
                label="Degree completed"
              />
            </div>

            <!-- Institution Website -->
            <div>
              <label class="block text-sm font-medium mb-1">Institution Website</label>
              <UInput
                v-model="formData.url"
                placeholder="https://example.edu"
                class="w-full"
                :error="!!formErrors.url"
              >
                <template #leading>
                  <UIcon name="i-lucide-link" class="w-4 h-4 text-muted" />
                </template>
              </UInput>
              <p v-if="formErrors.url" class="text-sm text-error mt-1">{{ formErrors.url }}</p>
            </div>

            <!-- Credit Hours -->
            <div>
              <label class="block text-sm font-medium mb-1">Credit Hours</label>
              <UInput
                v-model="formData.creditHours"
                type="number"
                placeholder="120"
                class="w-full"
                :error="!!formErrors.creditHours"
              />
              <p v-if="formErrors.creditHours" class="text-sm text-error mt-1">{{ formErrors.creditHours }}</p>
            </div>

            <!-- Relevant Coursework -->
            <div>
              <label class="block text-sm font-medium mb-1">Relevant Coursework</label>
              <div class="space-y-2">
                <div
                  v-for="(course, index) in formData.coursework"
                  :key="index"
                  class="flex gap-2 items-start"
                >
                  <UInput
                    v-model="formData.coursework![index]"
                    placeholder="Course name..."
                    class="flex-1"
                  />
                  <UButton
                    v-if="formData.coursework!.length > 1"
                    icon="i-lucide-x"
                    color="neutral"
                    variant="ghost"
                    class="cursor-pointer"
                    @click="removeCoursework(index)"
                  />
                </div>
                <UButton
                  label="Add Coursework"
                  icon="i-lucide-plus"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  class="cursor-pointer"
                  @click="addCoursework"
                />
              </div>
            </div>

            <!-- Minors -->
            <div>
              <label class="block text-sm font-medium mb-1">Minors</label>
              <div class="space-y-2">
                <div
                  v-for="(minor, index) in formData.minors"
                  :key="index"
                  class="flex gap-2 items-start"
                >
                  <UInput
                    v-model="formData.minors![index]"
                    placeholder="Minor name..."
                    class="flex-1"
                  />
                  <UButton
                    v-if="formData.minors!.length > 1"
                    icon="i-lucide-x"
                    color="neutral"
                    variant="ghost"
                    class="cursor-pointer"
                    @click="removeMinor(index)"
                  />
                </div>
                <UButton
                  label="Add Minor"
                  icon="i-lucide-plus"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  class="cursor-pointer"
                  @click="addMinor"
                />
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2 justify-end pt-4">
              <UButton
                label="Cancel"
                color="neutral"
                variant="ghost"
                class="cursor-pointer"
                @click="cancelEdit"
                :disabled="isSavingEducation"
              />
              <UButton
                label="Save Changes"
                color="primary"
                icon="i-lucide-check"
                class="cursor-pointer"
                :loading="isSavingEducation"
                @click="saveEducation"
              />
            </div>
          </div>
        </UPageCard>
      </div>
    </div>

    <!-- Empty State -->
    <UPageCard v-if="educationList.length === 0 && !isAddingEducation" variant="subtle">
      <div class="text-center py-12">
        <UIcon name="i-lucide-graduation-cap" class="w-16 h-16 text-muted mx-auto mb-4" />
        <h3 class="text-lg font-semibold mb-2">No Education Added</h3>
        <p class="text-muted mb-6">Add your academic background and qualifications.</p>
        <UButton
          label="Add Your First Education"
          color="primary"
          icon="i-lucide-plus"
          class="cursor-pointer"
          @click="startAddingEducation"
        />
      </div>
    </UPageCard>
  </div>
</template>
