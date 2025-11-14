<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

interface SkillCategory {
  name: string
  skills: string[]
  isEditing: boolean
}

interface Certification {
  name: string
  issuer: string
  date: string
  url?: string
  isEditing: boolean
}

// Skills Categories - Start with one blank category
const skillCategories = ref<SkillCategory[]>([
  {
    name: '',
    skills: [],
    isEditing: true
  }
])

// Certifications - Start with one blank certification
const certifications = ref<Certification[]>([
  {
    name: '',
    issuer: '',
    date: '',
    url: '',
    isEditing: true
  }
])

// Top-level section visibility
const skillsSectionOpen = ref(true)
const certificationsSectionOpen = ref(false)

// Skill Category Functions
function createBlankSkillCategory(): SkillCategory {
  return {
    name: '',
    skills: [],
    isEditing: true
  }
}

function addNewSkillCategory() {
  skillCategories.value.push(createBlankSkillCategory())
}

function saveSkillCategory(index: number) {
  const category = skillCategories.value[index]
  if (!category) return
  category.isEditing = false
}

function editSkillCategory(index: number) {
  const category = skillCategories.value[index]
  if (!category) return
  category.isEditing = true
}

function deleteSkillCategory(index: number) {
  skillCategories.value.splice(index, 1)
}

function cancelEditSkillCategory(index: number) {
  const category = skillCategories.value[index]
  if (!category) return
  
  // If empty, remove it
  if (!category.name && category.skills.length === 0) {
    skillCategories.value.splice(index, 1)
  } else {
    category.isEditing = false
  }
}

// Certification Functions
function createBlankCertification(): Certification {
  return {
    name: '',
    issuer: '',
    date: '',
    url: '',
    isEditing: true
  }
}

function addNewCertification() {
  certifications.value.push(createBlankCertification())
}

function saveCertification(index: number) {
  const cert = certifications.value[index]
  if (!cert) return
  cert.isEditing = false
}

function editCertification(index: number) {
  const cert = certifications.value[index]
  if (!cert) return
  cert.isEditing = true
}

function deleteCertification(index: number) {
  certifications.value.splice(index, 1)
}

function cancelEditCertification(index: number) {
  const cert = certifications.value[index]
  if (!cert) return
  
  // If empty, remove it
  if (!cert.name && !cert.issuer) {
    certifications.value.splice(index, 1)
  } else {
    cert.isEditing = false
  }
}
</script>

<template>
  <div class="max-w-xl mx-auto space-y-4">
    <!-- Section Title and Description -->
    <div class="mb-8 space-y-2">
      <h1 class="text-2xl sm:text-3xl font-semibold text-foreground">Additional Information</h1>
      <p class="text-sm text-muted">
        Add your skills, certifications, and other professional achievements.
      </p>
    </div>

    <!-- TOP LEVEL COLLAPSIBLES -->
    <div class="flex flex-col gap-3">
      
      <!-- SKILLS SECTION -->
      <div class="border border-muted rounded-lg overflow-hidden">
        <div 
          class="cursor-pointer p-4 hover:bg-primary/5 transition-colors"
          @click="skillsSectionOpen = !skillsSectionOpen"
        >
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-foreground">Core Skills</h2>
              <p class="text-sm text-muted">Core professional skills</p>
            </div>
            <UIcon 
              :name="skillsSectionOpen ? 'i-lucide-chevron-up' : 'i-lucide-plus'" 
              class="w-5 h-5 text-primary"
            />
          </div>
        </div>

        <div v-show="skillsSectionOpen">
          <div class="p-4 bg-card flex flex-col gap-4">
        <UCollapsible 
          disabled
          v-for="(category, catIndex) in skillCategories" 
          :key="catIndex"
          v-model:open="category.isEditing"
          class="flex flex-col gap-2"
        >
          <!-- Collapsed View -->
          <UCard v-if="!category.isEditing">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <h3 class="text-md font-semibold text-foreground">{{ category.name || 'Untitled Category' }}</h3>
                <div v-if="category.skills.length > 0" class="flex flex-wrap gap-2 mt-2">
                  <UBadge
                    v-for="(skill, skillIndex) in category.skills"
                    :key="skillIndex"
                    color="primary"
                    variant="subtle"
                    size="sm"
                  >
                    {{ skill }}
                  </UBadge>
                </div>
              </div>
              <div class="flex gap-2">
                <UButton 
                  class="cursor-pointer"
                  icon="i-lucide-pencil" 
                  color="neutral" 
                  variant="ghost" 
                  size="sm"
                  @click="editSkillCategory(catIndex)"
                />
                <UButton 
                  class="cursor-pointer"
                  icon="i-lucide-trash-2" 
                  color="error" 
                  variant="ghost" 
                  size="sm"
                  @click="deleteSkillCategory(catIndex)"
                />
              </div>
            </div>
          </UCard>

          <!-- Expanded Edit Form Header -->
          <UCard v-if="category.isEditing">
            <div class="flex items-center justify-between mb-4">
              <div class="flex-1">
                <h3 class="text-md font-semibold text-foreground">{{ category.name || 'General' }}</h3>
              </div>
              <div class="flex gap-2">
                <UButton 
                  class="cursor-pointer"
                  icon="i-lucide-pencil" 
                  color="success" 
                  variant="ghost" 
                  size="sm"
                  @click="category.isEditing = false"
                />
                <UButton 
                  class="cursor-pointer"
                  icon="i-lucide-trash-2" 
                  color="error" 
                  variant="ghost" 
                  size="sm"
                  @click="deleteSkillCategory(catIndex)"
                />
              </div>
            </div>
          </UCard>

          <template #content>
            <UCard>
              <div class="space-y-4">
                <!-- Category Name -->
                <UFormField size="xl" label="Category Name" name="name">
                  <UInput 
                    class="w-full"
                    v-model="category.name" 
                    placeholder="e.g., Core Skills, Programming Languages"
                  />
                </UFormField>

                <!-- Skills List -->
                <div class="space-y-2">
                  <UFormField size="xl" label="Skills" name="skills">
                    <UInputTags 
                      class="w-full"
                      v-model="category.skills"
                      placeholder="Press enter to add"
                      size="xl"
                    />
                  </UFormField>

                </div>

                <!-- Action Buttons -->
                <div class="flex gap-2 pt-4">
                  <UButton class="cursor-pointer" size="lg" @click="saveSkillCategory(catIndex)">
                    Save Category
                  </UButton>
                  <UButton class="cursor-pointer" size="lg" color="neutral" variant="ghost" @click="cancelEditSkillCategory(catIndex)">
                    Cancel
                  </UButton>
                </div>
              </div>
            </UCard>
          </template>
        </UCollapsible>

            <UButton class="cursor-pointer" icon="i-lucide-plus" color="primary" variant="ghost" size="lg" @click="addNewSkillCategory">
              Add Skill Category
            </UButton>
          </div>
        </div>
      </div>

      <!-- CERTIFICATIONS SECTION -->
      <div class="border border-muted rounded-lg overflow-hidden">
        <div 
          class="cursor-pointer p-4 hover:bg-primary/5 transition-colors"
          @click="certificationsSectionOpen = !certificationsSectionOpen"
        >
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-foreground">Certifications</h2>
              <p class="text-sm text-muted">Certifications earned</p>
            </div>
            <UIcon 
              :name="certificationsSectionOpen ? 'i-lucide-chevron-up' : 'i-lucide-plus'" 
              class="w-5 h-5 text-primary"
            />
          </div>
        </div>

        <div v-show="certificationsSectionOpen">
          <div class="p-4 bg-card flex flex-col gap-4">
        <UCollapsible 
          disabled
          v-for="(cert, certIndex) in certifications" 
          :key="certIndex"
          v-model:open="cert.isEditing"
          class="flex flex-col gap-2"
        >
          <!-- Collapsed View -->
          <UCard v-if="!cert.isEditing">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <h3 class="text-md font-semibold text-foreground">{{ cert.name || 'Untitled Certification' }}</h3>
                <p class="text-sm text-muted">{{ cert.issuer || 'Unknown Issuer' }}</p>
                <p class="text-sm text-muted" v-if="cert.date">{{ cert.date }}</p>
              </div>
              <div class="flex gap-2">
                <UButton 
                  class="cursor-pointer"
                  icon="i-lucide-pencil" 
                  color="neutral" 
                  variant="ghost" 
                  size="sm"
                  @click="editCertification(certIndex)"
                />
                <UButton 
                  class="cursor-pointer"
                  icon="i-lucide-trash-2" 
                  color="error" 
                  variant="ghost" 
                  size="sm"
                  @click="deleteCertification(certIndex)"
                />
              </div>
            </div>
          </UCard>

          <!-- Expanded Edit Form Header -->
          <UCard v-if="cert.isEditing">
            <div class="flex items-center justify-between mb-4">
              <div class="flex-1">
                <h3 class="text-md font-semibold text-foreground">{{ cert.name || 'Untitled Certification' }}</h3>
                <p class="text-sm text-muted">{{ cert.issuer || 'Unknown Issuer' }}</p>
              </div>
              <div class="flex gap-2">
                <UButton 
                  class="cursor-pointer"
                  icon="i-lucide-pencil" 
                  color="success" 
                  variant="ghost" 
                  size="sm"
                  @click="cert.isEditing = false"
                />
                <UButton 
                  class="cursor-pointer"
                  icon="i-lucide-trash-2" 
                  color="error" 
                  variant="ghost" 
                  size="sm"
                  @click="deleteCertification(certIndex)"
                />
              </div>
            </div>
          </UCard>

          <template #content>
            <UCard>
              <div class="space-y-4">
                <!-- Certification Name and Issuer -->
                <div class="flex gap-2 w-full">
                  <UFormField class="flex-1" size="xl" label="Certification" name="name">
                    <UInput 
                      class="w-full"
                      v-model="cert.name" 
                      placeholder="e.g., AWS Certified Solutions Architect"
                    />
                  </UFormField>

                  <UFormField class="flex-1" size="xl" label="Issuer" name="issuer">
                    <UInput 
                      class="w-full"
                      v-model="cert.issuer" 
                      placeholder="e.g., Amazon Web Services"
                    />
                  </UFormField>
                </div>

                <!-- Date and URL -->
                <div class="flex gap-2 w-full">
                  <UFormField class="flex-1" size="xl" label="Date" name="date">
                    <UInput 
                      class="w-full"
                      v-model="cert.date" 
                      placeholder="e.g., Jan 2023"
                    />
                  </UFormField>

                  <UFormField class="flex-1" size="xl" label="URL" name="url">
                    <UInput 
                      class="w-full"
                      v-model="cert.url" 
                      placeholder="e.g., https://..."
                    />
                  </UFormField>
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-2">
                  <UButton class="cursor-pointer" size="lg" @click="saveCertification(certIndex)">
                    Save Certification
                  </UButton>
                  <UButton class="cursor-pointer" size="lg" color="neutral" variant="ghost" @click="cancelEditCertification(certIndex)">
                    Cancel
                  </UButton>
                </div>
              </div>
            </UCard>
          </template>
        </UCollapsible>

            <UButton class="cursor-pointer" icon="i-lucide-plus" color="primary" variant="ghost" size="lg" @click="addNewCertification">
              Add Certification
            </UButton>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

