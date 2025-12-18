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

// Loading and saving states
const isLoading = computed(() => careerIDStore.isLoading)
const isSaving = computed(() => careerIDStore.isSaving)

// Education data from store
const educationList = computed(() => {
  // Sort by end date, most recent first
  return [...careerIDStore.education].sort((a, b) => {
    return new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  })
})

// Form states
const isAddingEducation = ref(false)
const editingEducationId = ref<number | null>(null)

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

// Start editing existing education
function startEditingEducation(education: Education) {
  editingEducationId.value = education.id
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
  editingEducationId.value = null
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
  
  // Validate end date
  const endDateError = validateMonthYear(formData.value.endDate, true)
  if (endDateError) errors.endDate = endDateError
  else if (formData.value.startDate) {
    // Validate date range
    const rangeError = validateDateRange(formData.value.startDate, formData.value.endDate, 'End Date')
    if (rangeError) errors.endDate = rangeError
  }
  
  // Validate URL if provided
  if (formData.value.url && formData.value.url.trim()) {
    const urlError = validateUrl(formData.value.url, false)
    if (urlError) errors.url = urlError
  }
  
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

// Add education
async function addEducation() {
  if (!validateForm()) {
    toast.add({
      title: 'Validation Error',
      description: 'Please fix the errors in the form',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }
  
  try {
    // Filter out empty coursework and minors
    const coursework = formData.value.coursework?.filter(c => c.trim()) || []
    const minors = formData.value.minors?.filter(m => m.trim()) || []
    
    await careerIDStore.addEducation({
      degreeType: formData.value.degreeType!,
      areaOfStudy: formData.value.areaOfStudy!,
      institution: formData.value.institution!,
      startDate: formatDateForAPI(formData.value.startDate)!,
      endDate: formatDateForAPI(formData.value.endDate)!,
      completed: formData.value.completed || false,
      url: formData.value.url || undefined,
      creditHours: formData.value.creditHours ? parseInt(formData.value.creditHours) : undefined,
      coursework,
      minors,
      displayOrder: educationList.value.length + 1
    })
    
    toast.add({
      title: 'Success',
      description: 'Education added successfully',
      icon: 'i-lucide-check',
      color: 'success'
    })
    
    cancelEdit()
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.message || 'Failed to add education',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

// Update education
async function updateEducation() {
  if (!validateForm()) {
    toast.add({
      title: 'Validation Error',
      description: 'Please fix the errors in the form',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }
  
  try {
    // Filter out empty coursework and minors
    const coursework = formData.value.coursework?.filter(c => c.trim()) || []
    const minors = formData.value.minors?.filter(m => m.trim()) || []
    
    await careerIDStore.updateEducation(editingEducationId.value!, {
      degreeType: formData.value.degreeType!,
      areaOfStudy: formData.value.areaOfStudy!,
      institution: formData.value.institution!,
      startDate: formatDateForAPI(formData.value.startDate)!,
      endDate: formatDateForAPI(formData.value.endDate)!,
      completed: formData.value.completed || false,
      url: formData.value.url || undefined,
      creditHours: formData.value.creditHours ? parseInt(formData.value.creditHours) : undefined,
      coursework,
      minors
    })
    
    toast.add({
      title: 'Success',
      description: 'Education updated successfully',
      icon: 'i-lucide-check',
      color: 'success'
    })
    
    cancelEdit()
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.message || 'Failed to update education',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

// Delete education
async function deleteEducation(id: number) {
  if (!confirm('Are you sure you want to delete this education entry?')) {
    return
  }
  
  try {
    await careerIDStore.deleteEducation(id)
    
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

// Fetch profile data on mount
// State to track if profile doesn't exist (for empty state)
const showEmptyState = ref(false)

onMounted(async () => {
  const profileId = careerIDStore.profileId

  // If no profileId is set, show empty state immediately
  if (!profileId) {
    showEmptyState.value = true
    return
  }

  try {
    // Only fetch if not already loaded
    if (!careerIDStore.isProfileLoaded) {
      await careerIDStore.fetchProfile(profileId)
    }

    // If no profile found after fetch, show empty state
    if (!careerIDStore.profile) {
      showEmptyState.value = true
    }
  } catch (err: any) {
    // Check if it's a 404 or profile not found error
    const is404 = err?.status === 404 || err?.statusCode === 404 || 
                  err?.message?.includes('not found') || 
                  err?.message?.includes('No profile')
    
    if (is404) {
      // Profile doesn't exist - show empty state instead of error
      showEmptyState.value = true
      // Clear the error from the store since we're handling it gracefully
      careerIDStore.error = null
    } else {
      // Other errors - log but still show empty state
      console.error('Failed to load profile:', err)
      showEmptyState.value = true
    }
  }
})
</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="space-y-4">
    <USkeleton class="h-32 w-full" />
    <USkeleton class="h-64 w-full" />
  </div>

  <!-- Empty State - No Profile Found -->
  <div v-else-if="showEmptyState">
    <UPageCard
      title="No Profile Yet"
      variant="subtle"
    >
      <div class="flex flex-col items-center justify-center py-12 gap-6 max-w-md mx-auto text-center">
        <UIcon name="i-lucide-graduation-cap" class="w-20 h-20 text-primary" />
        <div class="space-y-2">
          <h3 class="text-xl font-semibold">Create Your Profile First</h3>
          <p class="text-muted text-base">
            You need to complete your profile onboarding before you can manage your education.
          </p>
        </div>
        <UButton
          label="Start Onboarding"
          icon="i-lucide-rocket"
          size="lg"
          color="primary"
          @click="$router.push('/profile/onboarding')"
        />
      </div>
    </UPageCard>
  </div>

  <!-- Education Content -->
  <div v-else class="space-y-4">
    <!-- Page Header -->
    <UPageCard
      title="Education"
      description="Your academic background and qualifications"
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        v-if="!isAddingEducation && !editingEducationId"
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
        
        <!-- Degree Type and Area of Study -->
        <div class="flex gap-4 max-sm:flex-col">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Degree Type <span class="text-error">*</span></label>
            <UInput
              v-model="formData.degreeType"
              placeholder="e.g. Bachelor's, Master's, PhD"
              class="w-full"
              :error="!!formErrors.degreeType"
            />
            <p v-if="formErrors.degreeType" class="text-sm text-error mt-1">{{ formErrors.degreeType }}</p>
          </div>
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Area of Study <span class="text-error">*</span></label>
            <UInput
              v-model="formData.areaOfStudy"
              placeholder="e.g. Computer Science"
              class="w-full"
              :error="!!formErrors.areaOfStudy"
            />
            <p v-if="formErrors.areaOfStudy" class="text-sm text-error mt-1">{{ formErrors.areaOfStudy }}</p>
          </div>
        </div>

        <!-- Institution -->
        <div>
          <label class="block text-sm font-medium mb-1">Institution <span class="text-error">*</span></label>
          <UInput
            v-model="formData.institution"
            placeholder="e.g. Stanford University"
            class="w-full"
            :error="!!formErrors.institution"
          />
          <p v-if="formErrors.institution" class="text-sm text-error mt-1">{{ formErrors.institution }}</p>
        </div>

        <!-- Institution Website -->
        <div>
          <label class="block text-sm font-medium mb-1">Institution Website</label>
          <UInput
            v-model="formData.url"
            placeholder="https://university.edu"
            class="w-full"
            :error="!!formErrors.url"
          >
            <template #leading>
              <UIcon name="i-lucide-link" class="w-4 h-4 text-muted" />
            </template>
          </UInput>
          <p v-if="formErrors.url" class="text-sm text-error mt-1">{{ formErrors.url }}</p>
        </div>

        <!-- Start Date, End Date -->
        <div class="flex gap-4 max-sm:flex-col">
          <div class="flex-1">
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
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">End Date <span class="text-error">*</span></label>
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

        <!-- Completed and Credit Hours -->
        <div class="flex gap-4 max-sm:flex-col">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Completed</label>
            <div class="flex items-center gap-2">
              <USwitch v-model="formData.completed" />
              <span class="text-sm">{{ formData.completed ? 'Yes' : 'No' }}</span>
            </div>
          </div>
          <div class="flex-1">
            <label class="block text-sm font-medium mb-1">Credit Hours</label>
            <UInput
              v-model="formData.creditHours"
              type="number"
              placeholder="e.g. 120"
              class="w-full"
            />
          </div>
        </div>

        <!-- Coursework -->
        <div>
          <label class="block text-sm font-medium mb-1">Relevant Coursework</label>
          <div class="space-y-2">
            <div v-for="(course, index) in formData.coursework" :key="index" class="flex gap-2">
              <UInput
                v-model="formData.coursework![index]"
                placeholder="e.g. Data Structures and Algorithms"
                class="flex-1 w-full"
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
              label="Add Course"
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
            <div v-for="(minor, index) in formData.minors" :key="index" class="flex gap-2">
              <UInput
                v-model="formData.minors![index]"
                placeholder="e.g. Mathematics"
                class="flex-1 w-full"
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
            :disabled="isSaving"
          />
          <UButton
            label="Save Education"
            color="primary"
            icon="i-lucide-check"
            class="cursor-pointer"
            :loading="isSaving"
            @click="addEducation"
          />
        </div>
      </div>
    </UPageCard>

    <!-- Education List -->
    <div v-if="educationList.length > 0 && !isAddingEducation" class="space-y-4">
      <div
        v-for="education in educationList"
        :key="education.id"
        class="border border-default rounded-lg"
      >
        <!-- View Mode -->
        <UPageCard v-if="editingEducationId !== education.id" variant="subtle">
          <div class="flex justify-between items-start gap-4">
            <div class="flex-1">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <h3 class="text-lg font-semibold">{{ education.degreeType }} in {{ education.areaOfStudy }}</h3>
                  <p class="text-base font-medium text-muted">{{ education.institution }}</p>
                  <div class="flex flex-wrap gap-2 mt-2 text-sm text-muted">
                    <span>{{ formatDate(education.startDate) }} - {{ formatDate(education.endDate) }}</span>
                    <span v-if="education.completed">• Completed</span>
                    <span v-if="education.creditHours">• {{ education.creditHours }} credit hours</span>
                  </div>
                </div>
                <div class="flex gap-2">
                  <UButton
                    icon="i-lucide-pencil"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    class="cursor-pointer"
                    @click="startEditingEducation(education)"
                  />
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="sm"
                    class="cursor-pointer"
                    @click="deleteEducation(education.id)"
                    :loading="isSaving"
                  />
                </div>
              </div>

              <div v-if="education.minors.length > 0" class="mt-3">
                <p class="text-sm font-medium mb-1">Minors: <span class="text-muted">{{ education.minors.join(', ') }}</span></p>
              </div>

              <div v-if="education.url" class="mt-3">
                <a
                  :href="education.url"
                  target="_blank"
                  rel="noopener"
                  class="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  <UIcon name="i-lucide-external-link" class="w-3 h-3" />
                  Institution Website
                </a>
              </div>
            </div>
          </div>
        </UPageCard>

        <!-- Edit Mode -->
        <UPageCard v-else variant="subtle">
          <div class="space-y-4">
            <h3 class="text-lg font-semibold">Edit Education</h3>
            
            <!-- Degree Type and Area of Study -->
            <div class="flex gap-4 max-sm:flex-col">
              <div class="flex-1">
                <label class="block text-sm font-medium mb-1">Degree Type <span class="text-error">*</span></label>
                <UInput
                  v-model="formData.degreeType"
                  placeholder="e.g. Bachelor's, Master's, PhD"
                  class="w-full"
                  :error="!!formErrors.degreeType"
                />
                <p v-if="formErrors.degreeType" class="text-sm text-error mt-1">{{ formErrors.degreeType }}</p>
              </div>
              <div class="flex-1">
                <label class="block text-sm font-medium mb-1">Area of Study <span class="text-error">*</span></label>
                <UInput
                  v-model="formData.areaOfStudy"
                  placeholder="e.g. Computer Science"
                  class="w-full"
                  :error="!!formErrors.areaOfStudy"
                />
                <p v-if="formErrors.areaOfStudy" class="text-sm text-error mt-1">{{ formErrors.areaOfStudy }}</p>
              </div>
            </div>

            <!-- Institution -->
            <div>
              <label class="block text-sm font-medium mb-1">Institution <span class="text-error">*</span></label>
              <UInput
                v-model="formData.institution"
                placeholder="e.g. Stanford University"
                class="w-full"
                :error="!!formErrors.institution"
              />
              <p v-if="formErrors.institution" class="text-sm text-error mt-1">{{ formErrors.institution }}</p>
            </div>

            <!-- Institution Website -->
            <div>
              <label class="block text-sm font-medium mb-1">Institution Website</label>
              <UInput
                v-model="formData.url"
                placeholder="https://university.edu"
                class="w-full"
                :error="!!formErrors.url"
              >
                <template #leading>
                  <UIcon name="i-lucide-link" class="w-4 h-4 text-muted" />
                </template>
              </UInput>
              <p v-if="formErrors.url" class="text-sm text-error mt-1">{{ formErrors.url }}</p>
            </div>

            <!-- Start Date, End Date -->
            <div class="flex gap-4 max-sm:flex-col">
              <div class="flex-1">
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
              <div class="flex-1">
                <label class="block text-sm font-medium mb-1">End Date <span class="text-error">*</span></label>
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

            <!-- Completed and Credit Hours -->
            <div class="flex gap-4 max-sm:flex-col">
              <div class="flex-1">
                <label class="block text-sm font-medium mb-1">Completed</label>
                <div class="flex items-center gap-2">
                  <USwitch v-model="formData.completed" />
                  <span class="text-sm">{{ formData.completed ? 'Yes' : 'No' }}</span>
                </div>
              </div>
              <div class="flex-1">
                <label class="block text-sm font-medium mb-1">Credit Hours</label>
                <UInput
                  v-model="formData.creditHours"
                  type="number"
                  placeholder="e.g. 120"
                  class="w-full"
                />
              </div>
            </div>

            <!-- Coursework -->
            <div>
              <label class="block text-sm font-medium mb-1">Relevant Coursework</label>
              <div class="space-y-2">
                <div v-for="(course, index) in formData.coursework" :key="index" class="flex gap-2">
                  <UInput
                    v-model="formData.coursework![index]"
                    placeholder="e.g. Data Structures and Algorithms"
                    class="flex-1 w-full"
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
                  label="Add Course"
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
                <div v-for="(minor, index) in formData.minors" :key="index" class="flex gap-2">
                  <UInput
                    v-model="formData.minors![index]"
                    placeholder="e.g. Mathematics"
                    class="flex-1 w-full"
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
                :disabled="isSaving"
              />
              <UButton
                label="Update Education"
                color="primary"
                icon="i-lucide-check"
                class="cursor-pointer"
                :loading="isSaving"
                @click="updateEducation"
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
        <p class="text-muted mb-6">Add your educational background to showcase your academic qualifications.</p>
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
