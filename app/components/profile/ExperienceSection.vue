<script setup lang="ts">
import type { Experience } from '~/shared/types/careerId'
import { vMaska } from 'maska/vue'

// Form data type (without server-managed fields)
interface ExperienceFormData {
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

// Props
interface Props {
  modelValue?: ExperienceFormData[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [{
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
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: ExperienceFormData[]]
  save: [index: number, data: ExperienceFormData]
  delete: [index: number]
}>()

// Local reactive copy for two-way binding
const workExperiences = ref<ExperienceFormData[]>([...props.modelValue])

// Watch for external prop changes
watch(() => props.modelValue, (newValue) => {
  workExperiences.value = [...newValue]
}, { deep: true })

// Emit updates when local value changes
watch(workExperiences, (newValue) => {
  emit('update:modelValue', newValue)
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

function saveExperience(index: number) {
  const experience = workExperiences.value[index]
  if (!experience) return
  
  // Close editing mode for this experience
  experience.isEditing = false
  
  // Emit save event to parent
  emit('save', index, experience)
}

function editExperience(index: number) {
  const experience = workExperiences.value[index]
  if (!experience) return
  
  experience.isEditing = true
}

function cancelEdit(index: number) {
  const experience = workExperiences.value[index]
  if (!experience) return
  
  // If this is an empty unsaved experience, remove it
  if (!experience.title && !experience.employer) {
    workExperiences.value.splice(index, 1)
    emit('delete', index)
  } else {
    experience.isEditing = false
  }
}

function deleteExperience(index: number) {
  workExperiences.value.splice(index, 1)
  emit('delete', index)
}

function addNewExperience() {
  // Add a new blank experience in edit mode
  workExperiences.value.push(createBlankExperience())
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
        v-for="(experience, index) in workExperiences" 
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

  </div>
</template>

