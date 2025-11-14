<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { vMaska } from 'maska/vue'

interface Education {
  degreeType: string
  areaOfStudy: string
  institution: string
  startDate: string
  endDate: string
  completed: boolean
  url?: string
  creditHours?: number
  coursework: string[]
  minors: string[]
  isEditing: boolean
}

// Start with one blank education in edit mode
const educationList = ref<Education[]>([
  {
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
])

function createBlankEducation(): Education {
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

function saveEducation(index: number) {
  const education = educationList.value[index]
  if (!education) return
  
  // Close editing mode for this education
  education.isEditing = false
  
  console.log('Saved education:', education)
}

function editEducation(index: number) {
  const education = educationList.value[index]
  if (!education) return
  
  education.isEditing = true
}

function cancelEdit(index: number) {
  const education = educationList.value[index]
  if (!education) return
  
  // If this is an empty unsaved education, remove it
  if (!education.degreeType && !education.areaOfStudy && !education.institution) {
    educationList.value.splice(index, 1)
  } else {
    education.isEditing = false
  }
}

function deleteEducation(index: number) {
  educationList.value.splice(index, 1)
}

function addNewEducation() {
  // Add a new blank education in edit mode
  educationList.value.push(createBlankEducation())
}

// Coursework management
function addCoursework(educationIndex: number) {
  const education = educationList.value[educationIndex]
  if (!education) return
  education.coursework.push('')
}

function removeCoursework(educationIndex: number, courseworkIndex: number) {
  const education = educationList.value[educationIndex]
  if (!education) return
  education.coursework.splice(courseworkIndex, 1)
}

// Minor management
function addMinor(educationIndex: number) {
  const education = educationList.value[educationIndex]
  if (!education) return
  education.minors.push('')
}

function removeMinor(educationIndex: number, minorIndex: number) {
  const education = educationList.value[educationIndex]
  if (!education) return
  education.minors.splice(minorIndex, 1)
}
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
                icon="i-lucide-trash-2" 
                color="error" 
                variant="ghost" 
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
                icon="i-lucide-trash-2" 
                color="error" 
                variant="ghost" 
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
              <UFormField size="xl" label="Institution" name="institution">
                <UInput 
                  class="w-full"
                  v-model="education.institution" 
                  placeholder="e.g., Stanford University, MIT"
                />
              </UFormField>

              <!-- Institution Website -->
              <UFormField size="xl" label="Institution Website" name="url">
                <UInput 
                  class="w-full"
                  v-model="education.url" 
                  placeholder="e.g., https://www.stanford.edu"
                />
              </UFormField>

              <!-- Start and End Date -->
              <div class="flex gap-2 w-full">
                <UFormField class="flex-1" size="xl" label="Start Date" name="startDate">
                  <UInput 
                    class="w-full"
                    v-model="education.startDate" 
                    v-maska="'##/####'" 
                    placeholder="MM/YYYY"
                  />
                </UFormField>

                <UFormField class="flex-1" size="xl" label="End Date" name="endDate">
                  <UInput 
                    class="w-full"
                    v-model="education.endDate" 
                    v-maska="'##/####'" 
                    placeholder="MM/YYYY"
                  />
                </UFormField>
              </div>

          

              <!-- GPA (always shown) and Credit Hours (only when not completed) -->
              <div class="grid grid-cols-2 gap-2 w-full">
                <UFormField size="xl" label="Completed?" name="completed">
                  <USwitch v-model="education.completed" class="w-full" />
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
                  icon="i-lucide-plus" 
                  color="neutral" 
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
                  icon="i-lucide-plus" 
                  color="neutral" 
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
                  Save Education
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

  </div>
</template>

