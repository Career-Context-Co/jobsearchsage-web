<script setup lang="ts">
import type { StepperItem } from '@nuxt/ui'

const stepper = useTemplateRef('stepper')
const currentStep = ref(0)

const steps: StepperItem[] = [
  { 
    title: 'Experience', 
    icon: 'i-lucide-briefcase',
    value: 'experience'
  },
  { 
    title: 'Education', 
    icon: 'i-lucide-graduation-cap',
    value: 'education'
  },
  { 
    title: 'Skills', 
    icon: 'i-lucide-wrench',
    value: 'skills'
  },
  { 
    title: 'Certifications', 
    icon: 'i-lucide-award',
    value: 'certifications'
  },
  { 
    title: 'Contact', 
    icon: 'i-lucide-user',
    value: 'contact'
  }
]

// Calculate completion progress (placeholder - will be updated when sections are completed)
const completedSteps = ref(0)
const progress = computed(() => (completedSteps.value / steps.length) * 100)
</script>

<template>
  <UDashboardPanel id="profile-onboarding">
    <template #header>
      <UDashboardNavbar title="Profile">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-6 sm:gap-8 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <!-- Stepper Component-->
        <UStepper
          ref="stepper"
          size="md"
          v-model="currentStep"
          :items="steps"
          orientation="horizontal"
          class="w-full"
        />

        <!-- Content Area with Dynamic Components -->
        <div class="p-6 sm:p-8">
          <ProfileExperienceSection v-if="steps[currentStep]?.value === 'experience'" />
          <ProfileEducationSection v-else-if="steps[currentStep]?.value === 'education'" />
          <ProfileSkillsSection v-else-if="steps[currentStep]?.value === 'skills'" />
          <ProfileCertificationsSection v-else-if="steps[currentStep]?.value === 'certifications'" />
          <ProfileContactSection v-else-if="steps[currentStep]?.value === 'contact'" />
        </div>

        <!-- Navigation Buttons -->
        <div class="flex justify-between items-center gap-4">
          <UButton
            label="Back"
            leading-icon="i-lucide-chevron-left"
            color="neutral"
            variant="subtle"
            :disabled="!stepper?.hasPrev"
            @click="stepper?.prev()"
          />
          
          <div class="flex gap-2">
            <UButton
              v-if="stepper?.hasNext"
              label="Continue"
              trailing-icon="i-lucide-chevron-right"
              color="primary"
              @click="stepper?.next()"
            />
            <UButton
              v-else
              label="Complete Profile"
              trailing-icon="i-lucide-check"
              color="success"
            />
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
