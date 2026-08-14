<script setup lang="ts">
import type { Experience } from '#shared/types/careerId'
import type { ExperienceLinkChoice } from '@/utils/heroWizardSections'

interface ExperienceOption {
  label: string
  value: number
}

interface Props {
  experiences: Experience[]
  titleError?: string
}

const props = withDefaults(defineProps<Props>(), {
  titleError: ''
})

const title = defineModel<string>('title', { required: true })
const sourceExperienceId = defineModel<number | null>('sourceExperienceId', { required: true })
const experienceLinked = defineModel<ExperienceLinkChoice>('experienceLinked', { required: true })

const experienceOptions = computed<ExperienceOption[]>(() =>
  props.experiences.map(experience => ({
    label: `${experience.title} at ${experience.employer}`,
    value: experience.id
  }))
)

watch(experienceLinked, (value) => {
  if (value !== 'yes') {
    sourceExperienceId.value = null
  }
})
</script>

<template>
  <UCard>
    <div class="space-y-8">
      <UFormField
        label="Story Title"
        description="A short, headline version of this achievement — you can refine it later."
        required
        :error="titleError || undefined"
      >
        <UInput
          v-model="title"
          placeholder="e.g. Led migration that cut support tickets 45%"
          class="w-full"
          :error="!!titleError"
        />
      </UFormField>

      <div class="space-y-3">
        <div>
          <p class="text-sm font-medium text-highlighted">
            Is this tied to a specific job or experience?
          </p>
          <p class="text-sm text-muted mt-1">
            Linking it helps us pull in the right context and keep this story with the right role.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <UButton
            label="Yes, link it"
            :color="experienceLinked === 'yes' ? 'primary' : 'neutral'"
            :variant="experienceLinked === 'yes' ? 'soft' : 'outline'"
            class="cursor-pointer"
            @click="experienceLinked = 'yes'"
          />
          <UButton
            label="No, it's standalone"
            :color="experienceLinked === 'no' ? 'primary' : 'neutral'"
            :variant="experienceLinked === 'no' ? 'soft' : 'outline'"
            class="cursor-pointer"
            @click="experienceLinked = 'no'"
          />
        </div>

        <USelectMenu
          v-if="experienceLinked === 'yes'"
          v-model="sourceExperienceId"
          :items="experienceOptions"
          value-key="value"
          label-key="label"
          placeholder="Select a job or experience"
          class="w-full"
        />
      </div>
    </div>
  </UCard>
</template>
