<script setup lang="ts">
import type { StepperItem } from '@nuxt/ui'

const stepper = useTemplateRef('stepper')
const activeStep = ref('contact')

const steps: StepperItem[] = [
{ 
    title: 'Contact', 
    icon: 'i-lucide-user',
    value: 'contact'
  },
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
    title: 'Additional', 
    icon: 'i-lucide-award',
    value: 'additional'
  }
]

</script>

<template>
  <UDashboardPanel id="profile-onboarding">
    <template #header>
      <UDashboardNavbar title="Profile Onboarding">
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
          size="lg"
          v-model="activeStep"
          :items="steps"
          orientation="horizontal"
          class="w-full"
        />

        <!-- Content Area with Dynamic Components -->
        <div class="p-6 sm:p-8">
          <ProfileContactSection v-show="activeStep === 'contact'" />
          <ProfileExperienceSection v-show="activeStep === 'experience'" />
          <ProfileEducationSection v-show="activeStep === 'education'" />
          <ProfileAdditionalSection v-show="activeStep === 'additional'" />   
        </div>

        <!-- Navigation Buttons -->
        <div class="flex justify-between items-center gap-4">
          <UButton
            label="Back"
            class="cursor-pointer"
            size="xl"
            leading-icon="i-lucide-chevron-left"
            color="neutral"
            variant="subtle"
            :disabled="!stepper?.hasPrev"
            @click="stepper?.prev()"
          />
          
          <div class="flex gap-2">
            <UButton
              v-if="stepper?.hasNext"
              class="cursor-pointer"
              size="xl"
              label="Continue"
              trailing-icon="i-lucide-chevron-right"
              color="primary"
              @click="stepper?.next()"
            />
            <UButton
              v-else
              class="cursor-pointer"
              size="xl"
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
