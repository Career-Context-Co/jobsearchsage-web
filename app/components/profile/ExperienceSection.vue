<script setup lang="ts">
import type { Experience } from '~/shared/types/careerId'
import { vMaska } from 'maska/vue'

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

// Watch for external prop changes (when store updates)
// Preserve isEditing state for items that are currently being edited
watch(() => props.experience, (newValue) => {
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
  
  // Close edit mode
  experience.isEditing = false
}

function deleteExperience(index: number) {
  // Remove from local state - parent will diff and call delete API if it has an id
  experiences.value.splice(index, 1)
}

function addNewExperience() {
  // Add a new blank experience in edit mode
  experiences.value.push(createBlankExperience())
}

// Save individual experience - closes edit mode and emits just that experience
function saveExperience(index: number) {
  const experience = experiences.value[index]
  if (!experience) return
  
  // Close editing mode for this experience
  experience.isEditing = false
  
  // Emit just this one experience - parent handles POST (new) or PATCH (existing)
  const { isEditing, ...experienceToSave } = experience
  emit('save', experienceToSave)
}

// Emit all experiences on save - parent diffs against store
function saveAllExperiences() {
  // Remove isEditing field before emitting
  const experiencesToSave = experiences.value.map(exp => {
    const { isEditing, ...rest } = exp
    return rest
  })
  emit('saveAll', experiencesToSave)
}
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
                icon="i-lucide-trash-2" 
                color="error" 
                variant="ghost" 
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
                icon="i-lucide-trash-2" 
                color="error" 
                variant="ghost" 
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
              <UFormField size="xl" label="Job Title" name="title">
                <UInput class="w-full" v-model="experience.title" placeholder="e.g., Software Engineer, Project Manager" />
              </UFormField>

              <!-- Employer -->
              <UFormField size="xl" label="Employer" name="employer">
                <UInput class="w-full" v-model="experience.employer" placeholder="e.g., Google, Acme Corp" />
              </UFormField>

              <UFormField size="xl" label="Employer Website" name="url">
                <UInput class="w-full" v-model="experience.url" placeholder="e.g. https://www.google.com" />
              </UFormField>

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
                <UFormField class="flex-1" size="xl" label="Start Date" name="startDate">
                  <UInput class="w-full" v-model="experience.startDate" v-maska="'##/####'" placeholder="MM/YYYY" />
                </UFormField>

                <UFormField class="flex-1" size="xl" label="End Date" name="endDate">
                  <UInput :disabled="experience.currentPosition" class="w-full" v-model="experience.endDate" v-maska="'##/####'" placeholder="MM/YYYY" />
                </UFormField>
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
                  Save Experience
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

