<script setup lang="ts">
import { nextTick } from 'vue'
import type { Experience } from '#shared/types/careerId'
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

// Props - receive Experience array from parent (store via onboarding)
const props = defineProps<{
  experience: Experience[]
}>()

// Experience data sorted by start date (most recent first)
const experiences = computed(() => {
  return [...props.experience].sort((a, b) => {
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  })
})

// Form states
const isAddingExperience = ref(false)
const editingExperienceIndex = ref<number | null>(null)
const isSavingExperience = ref(false)

// Enhancement states (component-level tracking, similar to isExtracted pattern)
const isEnhancingExperience = ref(false)
const enhancedHighlights = ref<Set<number>>(new Set()) // Track which highlight indices are enhanced
const originalHighlights = ref<Map<number, string>>(new Map()) // Store original text before enhancement for undo
const isProgrammaticUpdate = ref(false) // Flag to prevent watch from clearing flags during AI enhancement

// Form data
interface ExperienceFormData {
  employmentType: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship'
  employer: string
  title: string
  location: string
  locationType: 'on_site' | 'remote' | 'hybrid'
  url: string
  startDate: string
  endDate: string
  currentPosition: boolean
  summary: string
  highlights: string[]
}

const formData = ref<Partial<ExperienceFormData>>({
  employmentType: 'full_time',
  locationType: 'on_site',
  currentPosition: false,
  highlights: ['']
})
const formErrors = ref<Record<string, string>>({})

// Employment type options
const employmentTypes = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internship', label: 'Internship' }
]

// Location type options
const locationTypes = [
  { value: 'on_site', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' }
]

// Start adding new experience
function startAddingExperience() {
  formData.value = {
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
    highlights: ['']
  }
  formErrors.value = {}
  isAddingExperience.value = true
}

// Track which experience object we're editing (to handle extracted items)
const editingExperienceRef = ref<Experience | null>(null)

// Start editing existing experience
function startEditingExperience(expIndex: number) {
  const experience = experiences.value[expIndex]
  if (!experience) return
  
  editingExperienceIndex.value = expIndex
  editingExperienceRef.value = experience // Store reference to the actual object
  formData.value = {
    employmentType: experience.employmentType,
    employer: experience.employer,
    title: experience.title,
    location: experience.location || '',
    locationType: experience.locationType,
    url: experience.url || '',
    startDate: formatDateForUI(experience.startDate),
    endDate: formatDateForUI(experience.endDate),
    currentPosition: experience.currentPosition,
    summary: experience.summary || '',
    highlights: experience.highlights.length > 0 ? [...experience.highlights] : ['']
  }
  formErrors.value = {}
}

// Cancel editing
function cancelEdit() {
  isAddingExperience.value = false
  editingExperienceIndex.value = null
  editingExperienceRef.value = null
  formData.value = {}
  formErrors.value = {}
  enhancedHighlights.value.clear() // Clear enhancement tracking
  originalHighlights.value.clear() // Clear original text storage
}

// Add highlight field
function addHighlight() {
  if (!formData.value.highlights) {
    formData.value.highlights = []
  }
  formData.value.highlights.push('')
}

// Remove highlight field
function removeHighlight(index: number) {
  if (formData.value.highlights) {
    formData.value.highlights.splice(index, 1)
  }
}

// Watch currentPosition checkbox to clear endDate
watch(() => formData.value.currentPosition, (isCurrent) => {
  if (isCurrent) {
    formData.value.endDate = ''
  }
})

// Watch highlights for manual edits - clear enhanced flag if user modifies
const highlightsSnapshot = ref<string[]>([])
watch(() => formData.value.highlights, (newHighlights, oldHighlights) => {
  if (!newHighlights || !oldHighlights) return
  
  // Skip if this is a programmatic update (AI enhancement in progress)
  if (isProgrammaticUpdate.value) {
    return
  }
  
  // Check each highlight for changes
  newHighlights.forEach((highlight, index) => {
    if (oldHighlights[index] !== highlight && enhancedHighlights.value.has(index)) {
      // User manually edited an enhanced highlight - remove enhanced flag
      enhancedHighlights.value.delete(index)
    }
  })
}, { deep: true })

// Validate form
function validateForm(): boolean {
  const errors: Record<string, string> = {}
  
  // Required fields
  const employerError = validateRequired(formData.value.employer, 'Company/Employer')
  if (employerError) errors.employer = employerError
  
  const titleError = validateRequired(formData.value.title, 'Job Title')
  if (titleError) errors.title = titleError
  
  // Validate start date
  const startDateError = validateMonthYear(formData.value.startDate, true)
  if (startDateError) errors.startDate = startDateError
  
  // Validate end date (if not current position)
  if (!formData.value.currentPosition && formData.value.endDate) {
    const endDateError = validateMonthYear(formData.value.endDate, false)
    if (endDateError) errors.endDate = endDateError
    else if (formData.value.startDate) {
      // Validate date range
      const rangeError = validateDateRange(formData.value.startDate, formData.value.endDate, 'End Date')
      if (rangeError) errors.endDate = rangeError
    }
  }
  
  // Validate URL if provided
  if (formData.value.url && formData.value.url.trim()) {
    const urlError = validateUrl(formData.value.url, false)
    if (urlError) errors.url = urlError
  }
  
  // Validate at least one highlight
  const nonEmptyHighlights = formData.value.highlights?.filter(h => h.trim()) || []
  if (nonEmptyHighlights.length === 0) {
    errors.highlights = 'At least one highlight is required'
  }
  
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

// Save experience (add or update). Pass silent=true to suppress per-item toasts (used during bulk save).
async function saveExperience(silent = false): Promise<boolean> {
  if (!validateForm()) {
    if (!silent) {
      toast.add({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
    }
    return false
  }
  
  isSavingExperience.value = true
  
  try {
    // Filter out empty highlights
    const highlights = formData.value.highlights?.filter(h => h.trim()) || []
    
    const experienceData = {
      employmentType: formData.value.employmentType!,
      employer: formData.value.employer!,
      title: formData.value.title!,
      location: formData.value.location || undefined,
      locationType: formData.value.locationType!,
      url: formData.value.url || undefined,
      startDate: formatDateForAPI(formData.value.startDate)!,
      endDate: formData.value.currentPosition ? undefined : formatDateForAPI(formData.value.endDate),
      currentPosition: formData.value.currentPosition || false,
      summary: formData.value.summary || undefined,
      highlights
    }
    
    // Check if we're editing an existing experience with an ID (UPDATE) or adding/saving extracted (ADD)
    const isUpdating = editingExperienceIndex.value !== null && experiences.value[editingExperienceIndex.value]?.id
    
    if (isUpdating) {
      const experience = experiences.value[editingExperienceIndex.value!]
      if (!experience?.id) {
        throw new Error('Cannot update experience without ID')
      }
      await careerIDStore.updateExperience(experience.id, experienceData)
      
      if (!silent) {
        toast.add({
          title: 'Success',
          description: 'Work experience updated successfully',
          icon: 'i-lucide-check',
          color: 'success'
        })
      }
    } else {
      await careerIDStore.addExperience({
        ...experienceData,
        displayOrder: experiences.value.length + 1
      })
      
      // If we were editing an extracted experience (no ID), remove it after successful save
      if (editingExperienceRef.value && !editingExperienceRef.value.id && editingExperienceRef.value.isExtracted) {
        careerIDStore.experience = careerIDStore.experience.filter(
          exp => exp !== editingExperienceRef.value
        )
      }
      
      if (!silent) {
        toast.add({
          title: 'Success',
          description: 'Work experience added successfully',
          icon: 'i-lucide-check',
          color: 'success'
        })
      }
    }
    
    cancelEdit()
    return true
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: getApiErrorMessage(err, 'Failed to save work experience'),
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return false
  } finally {
    isSavingExperience.value = false
  }
}

// Delete experience
async function deleteExperience(experienceToDelete: Experience) {
  if (!confirm('Are you sure you want to delete this work experience?')) {
    return
  }
  
  try {
    // If experience has an ID, it's saved in DB - call API to delete
    if (experienceToDelete.id) {
      await careerIDStore.deleteExperience(experienceToDelete.id)
    } else {
      // If no ID, it's extracted but not saved - just remove from store array
      careerIDStore.experience = careerIDStore.experience.filter(
        exp => exp !== experienceToDelete
      )
    }
    
    toast.add({
      title: 'Success',
      description: 'Work experience deleted successfully',
      icon: 'i-lucide-check',
      color: 'success'
    })
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: getApiErrorMessage(err, 'Failed to delete work experience'),
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

// Format date for display
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Present'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// Enhance experience achievements using AI
async function enhanceExperience() {
  // Validation: ensure we have highlights to enhance
  const nonEmptyHighlights = formData.value.highlights?.filter(h => h && h.trim()) || []
  
  if (nonEmptyHighlights.length === 0) {
    toast.add({
      title: 'No Achievements to Enhance',
      description: 'Please add at least one achievement before enhancing',
      icon: 'i-lucide-alert-circle',
      color: 'warning'
    })
    return
  }

  isEnhancingExperience.value = true
  
  try {
    // Build experience slice for AI enhancement
    const experienceSlice = {
      employmentType: formData.value.employmentType || 'full_time',
      employer: formData.value.employer || '',
      title: formData.value.title || '',
      url: formData.value.url,
      summary: formData.value.summary,
      highlights: nonEmptyHighlights
    }

    // Call store action to enhance achievements
    const enhanced = await careerIDStore.enhanceExperience(experienceSlice)

    // Replace highlights with enhanced versions
    if (formData.value.highlights) {
      // Set flag to prevent watch from clearing our enhancement flags
      isProgrammaticUpdate.value = true
      
      let enhancedIndex = 0
      formData.value.highlights = formData.value.highlights.map((highlight, index) => {
        if (highlight && highlight.trim()) {
          // Store original before replacement
          originalHighlights.value.set(index, highlight)
          // Track this highlight as enhanced
          enhancedHighlights.value.add(index)
          return enhanced[enhancedIndex++]
        }
        return highlight
      })
      
      // Wait for next tick to ensure Vue has processed the updates
      await nextTick()
      
      // Clear the flag after updates are complete
      isProgrammaticUpdate.value = false
    }

    toast.add({
      title: 'Achievements Enhanced',
      description: 'Your achievements have been polished successfully',
      icon: 'i-lucide-sparkles',
      color: 'success'
    })
  } catch (error: any) {
    // Error message already set in store, just show toast
    toast.add({
      title: 'Enhancement Failed',
      description: getApiErrorMessage(error, 'Failed to enhance achievements. Please try again.'),
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    isEnhancingExperience.value = false
  }
}

// Undo AI enhancement for a specific highlight
function undoEnhancement(index: number) {
  const original = originalHighlights.value.get(index)
  if (original && formData.value.highlights) {
    formData.value.highlights[index] = original
    enhancedHighlights.value.delete(index)
    originalHighlights.value.delete(index)
  }
}

// Exposed methods for compatibility with onboarding.vue
async function triggerSave() {
  // Auto-save if in edit mode or adding mode
  if (isAddingExperience.value || editingExperienceIndex.value !== null) {
    await saveExperience()
  }
}

// Save any open form + all unsaved extracted items. Shows a single summary toast.
async function saveAllUnsaved(): Promise<boolean> {
  let savedCount = 0

  // Step 1: If user has an open form (adding or editing), save it first
  if (isAddingExperience.value || editingExperienceIndex.value !== null) {
    const formSuccess = await saveExperience(true)
    if (!formSuccess) return false
    savedCount++
  }

  // Step 2: Save remaining unsaved extracted items (no ID)
  const unsavedExperiences = experiences.value.filter(exp => !exp.id)
  for (const experience of unsavedExperiences) {
    const index = experiences.value.indexOf(experience)
    startEditingExperience(index)

    const success = await saveExperience(true)
    if (!success) return false
    savedCount++
  }

  if (savedCount > 0) {
    toast.add({
      title: 'Saved',
      description: `${savedCount} work experience${savedCount > 1 ? 's' : ''} saved successfully`,
      icon: 'i-lucide-check',
      color: 'success'
    })
  }

  return true
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
      title="Professional Experience"
      description="Your professional work history and accomplishments"
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        v-if="!isAddingExperience && editingExperienceIndex === null"
        label="Add Experience"
        color="primary"
        variant="outline"
        icon="i-lucide-plus"
        class="cursor-pointer w-fit lg:ms-auto"
        @click="startAddingExperience"
      />
    </UPageCard>

    <!-- Add Experience Form -->
    <UPageCard v-if="isAddingExperience" variant="subtle" class="mb-4">
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Add Work Experience</h3>
        
        <!-- Employment Type -->
        <div>
          <label class="block text-sm font-medium mb-1">Employment Type <span class="text-error">*</span></label>
          <USelectMenu
            v-model="formData.employmentType"
            :items="employmentTypes"
            value-attribute="value"
            option-attribute="label"
            placeholder="Select employment type"
            class="w-full"
          />
        </div>

        <!-- Company/Employer -->
        <div>
          <label class="block text-sm font-medium mb-1">Company/Employer <span class="text-error">*</span></label>
          <UInput
            v-model="formData.employer"
            placeholder="e.g. Google, Microsoft, Acme Corp"
            class="w-full"
            :error="!!formErrors.employer"
          />
          <p v-if="formErrors.employer" class="text-sm text-error mt-1">{{ formErrors.employer }}</p>
        </div>

        <!-- Job Title -->
        <div>
          <label class="block text-sm font-medium mb-1">Job Title <span class="text-error">*</span></label>
          <UInput
            v-model="formData.title"
            placeholder="e.g. Senior Software Engineer"
            class="w-full"
            :error="!!formErrors.title"
          />
          <p v-if="formErrors.title" class="text-sm text-error mt-1">{{ formErrors.title }}</p>
        </div>

        <!-- Location -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Location</label>
            <UInput
              v-model="formData.location"
              placeholder="e.g. San Francisco, CA"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Location Type</label>
            <USelectMenu
              v-model="formData.locationType"
              :items="locationTypes"
              value-attribute="value"
              option-attribute="label"
              placeholder="Select location type"
              class="w-full"
            />
          </div>
        </div>

        <!-- Company Website -->
        <div>
          <label class="block text-sm font-medium mb-1">Company Website</label>
          <UInput
            v-model="formData.url"
            placeholder="https://example.com"
            class="w-full"
            :error="!!formErrors.url"
          >
            <template #leading>
              <UIcon name="i-lucide-link" class="w-4 h-4 text-muted" />
            </template>
          </UInput>
          <p v-if="formErrors.url" class="text-sm text-error mt-1">{{ formErrors.url }}</p>
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
            <label class="block text-sm font-medium mb-1">End Date</label>
            <UInput
              v-model="formData.endDate"
              v-maska="'##/####'"
              placeholder="MM/YYYY"
              class="w-full"
              :disabled="formData.currentPosition"
              :error="!!formErrors.endDate"
            />
            <p v-if="formErrors.endDate" class="text-sm text-error mt-1">{{ formErrors.endDate }}</p>
          </div>
        </div>

        <!-- Current Position Checkbox -->
        <div>
          <UCheckbox
            v-model="formData.currentPosition"
            label="I currently work here"
          />
        </div>

        <!-- Summary -->
        <div>
          <label class="block text-sm font-medium mb-1">Summary</label>
          <UTextarea
            v-model="formData.summary"
            placeholder="Brief overview of your role and responsibilities..."
            :rows="4"
            class="w-full"
          />
        </div>

        <!-- Highlights/Achievements -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-sm font-medium">Key Achievements/Highlights <span class="text-error">*</span></label>
            <UButton
              :label="isEnhancingExperience ? 'Enhancing...' : 'Enhance with AI'"
              icon="i-lucide-sparkles"
              color="primary"
              variant="outline"
              size="xs"
              class="cursor-pointer"
              :loading="isEnhancingExperience"
              :disabled="isEnhancingExperience"
              @click="enhanceExperience"
            />
          </div>
          <div class="space-y-2">
            <div
              v-for="(highlight, index) in formData.highlights"
              :key="index"
              class="flex gap-2 items-start"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <UBadge
                    v-if="enhancedHighlights.has(index)"
                    color="neutral"
                    size="xs"
                    class="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300"
                  >
                    <div class="flex items-center gap-1">
                      <UIcon name="i-lucide-sparkles" class="w-3 h-3" />
                      <span>Enhanced</span>
                    </div>
                  </UBadge>
                </div>
                <UTextarea
                  v-model="formData.highlights![index]"
                  placeholder="Describe a key achievement or responsibility..."
                  :rows="2"
                  autoresize
                  class="w-full"
                  :class="{ 'ring-1 ring-cyan-500 dark:ring-cyan-400': enhancedHighlights.has(index) }"
                />
              </div>
              <div class="flex gap-1">
                <!-- Undo button (only show if enhanced) -->
                <UButton
                  v-if="enhancedHighlights.has(index)"
                  icon="i-lucide-undo-2"
                  color="primary"
                  variant="ghost"
                  size="sm"
                  title="Undo enhancement"
                  class="cursor-pointer mt-7"
                  @click="undoEnhancement(index)"
                />
                <!-- Delete button -->
                <UButton
                  v-if="formData.highlights!.length > 1"
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="ghost"
                  size="sm"
                  class="cursor-pointer mt-7"
                  @click="removeHighlight(index)"
                />
              </div>
            </div>
            <UButton
              label="Add Highlight"
              icon="i-lucide-plus"
              color="neutral"
              variant="outline"
              size="sm"
              class="cursor-pointer"
              @click="addHighlight"
            />
          </div>
          <p v-if="formErrors.highlights" class="text-sm text-error mt-1">{{ formErrors.highlights }}</p>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2 justify-end pt-4">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            class="cursor-pointer"
            @click="cancelEdit"
            :disabled="isSavingExperience"
          />
          <UButton
            label="Save Experience"
            color="primary"
            icon="i-lucide-check"
            class="cursor-pointer"
            :loading="isSavingExperience"
            @click="saveExperience"
          />
        </div>
      </div>
    </UPageCard>

    <!-- Experience List -->
    <div v-if="experiences.length > 0 && !isAddingExperience" class="space-y-4">
      <div
        v-for="(experience, expIndex) in experiences"
        :key="experience.id || expIndex"
        class="border border-default rounded-lg"
        :class="{ 'ring-1 ring-cyan-500 dark:ring-cyan-400': experience.isExtracted }"
      >
        <!-- View Mode -->
        <UPageCard v-if="editingExperienceIndex !== expIndex" variant="subtle">
          <div class="flex justify-between items-start gap-4">
            <div class="flex-1">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="text-lg font-semibold">{{ experience.title }}</h3>
                    <UBadge
                      v-if="experience.isExtracted"
                      color="neutral"
                      class="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300"
                    >
                      <div class="flex items-center gap-1">
                        <UIcon name="i-lucide-sparkles" class="w-3 h-3" />
                        <span>Extracted</span>
                      </div>
                    </UBadge>
                  </div>
                  <p class="text-base font-medium text-muted">{{ experience.employer }}</p>
                  <div class="flex flex-wrap gap-2 mt-2 text-sm text-muted">
                    <span>{{ formatDate(experience.startDate) }} - {{ formatDate(experience.endDate) }}</span>
                    <span v-if="experience.location">• {{ experience.location }}</span>
                    <span>• {{ experience.locationType.replace('_', ' ') }}</span>
                  </div>
                </div>
                <div class="flex gap-2">
                  <UButton
                    icon="i-lucide-pencil"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    class="cursor-pointer"
                    @click="startEditingExperience(expIndex)"
                  />
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="sm"
                    class="cursor-pointer"
                    @click="deleteExperience(experience)"
                  />
                </div>
              </div>

              <div v-if="experience.summary" class="mt-3 text-sm">
                <p>{{ experience.summary }}</p>
              </div>

              <div v-if="experience.url" class="mt-3">
                <a
                  :href="experience.url"
                  target="_blank"
                  rel="noopener"
                  class="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  <UIcon name="i-lucide-external-link" class="w-3 h-3" />
                  Visit Company Website
                </a>
              </div>
            </div>
          </div>
        </UPageCard>

        <!-- Edit Mode -->
        <UPageCard v-else variant="subtle">
          <div class="space-y-4">
            <h3 class="text-lg font-semibold">Edit Work Experience</h3>
            
            <!-- Employment Type -->
            <div>
              <label class="block text-sm font-medium mb-1">Employment Type <span class="text-error">*</span></label>
              <USelectMenu
                v-model="formData.employmentType"
                :items="employmentTypes"
                value-attribute="value"
                option-attribute="label"
                placeholder="Select employment type"
                class="w-full"
              />
            </div>

            <!-- Company/Employer -->
            <div>
              <label class="block text-sm font-medium mb-1">Company/Employer <span class="text-error">*</span></label>
              <UInput
                v-model="formData.employer"
                placeholder="e.g. Google, Microsoft, Acme Corp"
                class="w-full"
                :error="!!formErrors.employer"
              />
              <p v-if="formErrors.employer" class="text-sm text-error mt-1">{{ formErrors.employer }}</p>
            </div>

            <!-- Job Title -->
            <div>
              <label class="block text-sm font-medium mb-1">Job Title <span class="text-error">*</span></label>
              <UInput
                v-model="formData.title"
                placeholder="e.g. Senior Software Engineer"
                class="w-full"
                :error="!!formErrors.title"
              />
              <p v-if="formErrors.title" class="text-sm text-error mt-1">{{ formErrors.title }}</p>
            </div>

            <!-- Location -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Location</label>
                <UInput
                  v-model="formData.location"
                  placeholder="e.g. San Francisco, CA"
                  class="w-full"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Location Type</label>
                <USelectMenu
                  v-model="formData.locationType"
                  :items="locationTypes"
                  value-attribute="value"
                  option-attribute="label"
                  placeholder="Select location type"
                  class="w-full"
                />
              </div>
            </div>

            <!-- Company Website -->
            <div>
              <label class="block text-sm font-medium mb-1">Company Website</label>
              <UInput
                v-model="formData.url"
                placeholder="https://example.com"
                class="w-full"
                :error="!!formErrors.url"
              >
                <template #leading>
                  <UIcon name="i-lucide-link" class="w-4 h-4 text-muted" />
                </template>
              </UInput>
              <p v-if="formErrors.url" class="text-sm text-error mt-1">{{ formErrors.url }}</p>
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
                <label class="block text-sm font-medium mb-1">End Date</label>
                <UInput
                  v-model="formData.endDate"
                  v-maska="'##/####'"
                  placeholder="MM/YYYY"
                  class="w-full"
                  :disabled="formData.currentPosition"
                  :error="!!formErrors.endDate"
                />
                <p v-if="formErrors.endDate" class="text-sm text-error mt-1">{{ formErrors.endDate }}</p>
              </div>
            </div>

            <!-- Current Position Checkbox -->
            <div>
              <UCheckbox
                v-model="formData.currentPosition"
                label="I currently work here"
              />
            </div>

            <!-- Summary -->
            <div>
              <label class="block text-sm font-medium mb-1">Summary</label>
              <UTextarea
                v-model="formData.summary"
                placeholder="Brief overview of your role and responsibilities..."
                :rows="4"
                class="w-full"
              />
            </div>

            <!-- Highlights/Achievements -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-sm font-medium">Key Achievements/Highlights <span class="text-error">*</span></label>
                <UButton
                  :label="isEnhancingExperience ? 'Enhancing...' : 'Enhance with AI'"
                  icon="i-lucide-sparkles"
                  color="primary"
                  variant="outline"
                  size="xs"
                  class="cursor-pointer"
                  :loading="isEnhancingExperience"
                  :disabled="isEnhancingExperience"
                  @click="enhanceExperience"
                />
              </div>
              <div class="space-y-2">
                <div
                  v-for="(highlight, index) in formData.highlights"
                  :key="index"
                  class="flex gap-2 items-start"
                >
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <UBadge
                        v-if="enhancedHighlights.has(index)"
                        color="neutral"
                        size="xs"
                        class="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300"
                      >
                        <div class="flex items-center gap-1">
                          <UIcon name="i-lucide-sparkles" class="w-3 h-3" />
                          <span>Enhanced</span>
                        </div>
                      </UBadge>
                    </div>
                    <UTextarea
                      v-model="formData.highlights![index]"
                      placeholder="Describe a key achievement or responsibility..."
                      autoresize
                      :rows="2"
                      class="w-full"
                      :class="{ 'ring-1 ring-cyan-500 dark:ring-cyan-400': enhancedHighlights.has(index) }"
                    />
                  </div>
                  <div class="flex gap-1">
                    <!-- Undo button (only show if enhanced) -->
                    <UButton
                      v-if="enhancedHighlights.has(index)"
                      icon="i-lucide-undo-2"
                      color="primary"
                      variant="ghost"
                      size="sm"
                      title="Undo enhancement"
                      class="cursor-pointer mt-7"
                      @click="undoEnhancement(index)"
                    />
                    <!-- Delete button -->
                    <UButton
                      v-if="formData.highlights!.length > 1"
                      icon="i-lucide-x"
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      class="cursor-pointer mt-7"
                      @click="removeHighlight(index)"
                    />
                  </div>
                </div>
                <UButton
                  label="Add Highlight"
                  icon="i-lucide-plus"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  class="cursor-pointer"
                  @click="addHighlight"
                />
              </div>
              <p v-if="formErrors.highlights" class="text-sm text-error mt-1">{{ formErrors.highlights }}</p>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2 justify-end pt-4">
              <UButton
                label="Cancel"
                color="neutral"
                variant="ghost"
                class="cursor-pointer"
                @click="cancelEdit"
                :disabled="isSavingExperience"
              />
              <UButton
                label="Save Changes"
                color="primary"
                icon="i-lucide-check"
                class="cursor-pointer"
                :loading="isSavingExperience"
                @click="saveExperience"
              />
            </div>
          </div>
        </UPageCard>
      </div>
    </div>

    <!-- Empty State -->
    <UPageCard v-if="experiences.length === 0 && !isAddingExperience" variant="subtle">
      <div class="text-center py-12">
        <UIcon name="i-lucide-briefcase" class="w-16 h-16 text-muted mx-auto mb-4" />
        <h3 class="text-lg font-semibold mb-2">No Work Experience Added</h3>
        <p class="text-muted mb-6">Add your professional work history to showcase your experience.</p>
        <UButton
          label="Add Your First Experience"
          color="primary"
          icon="i-lucide-plus"
          class="cursor-pointer"
          @click="startAddingExperience"
        />
      </div>
    </UPageCard>
  </div>
</template>
