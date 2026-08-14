<script setup lang="ts">
import type { Experience } from '#shared/types/careerId'
import type { ExperienceLinkChoice, HeroWizardDraft, HeroWizardStepValue } from '@/utils/heroWizardSections'

interface Props {
  draft: HeroWizardDraft
  experienceLinked: ExperienceLinkChoice
  experiences: Experience[]
  isSaving?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSaving: false
})

const emit = defineEmits<{
  edit: [step: HeroWizardStepValue]
  save: []
}>()

function displayValue(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim()
  return trimmed || 'Not filled in yet'
}

function isEmpty(value: string | null | undefined): boolean {
  return !isHeroFieldFilled(value)
}

const titleDisplay = computed(() => displayValue(props.draft.title))

const linkedExperienceLabel = computed(() => {
  if (props.experienceLinked === 'no') {
    return 'Standalone story'
  }

  if (props.experienceLinked === 'yes') {
    const experience = props.experiences.find(item => item.id === props.draft.sourceExperienceId)
    if (experience) {
      return `${experience.title} at ${experience.employer}`
    }
    return 'Linked (no details added)'
  }

  return 'Not answered yet'
})

const linkedIsEmpty = computed(() => {
  return props.experienceLinked !== 'yes' && props.experienceLinked !== 'no'
})
</script>

<template>
  <div class="space-y-4 max-w-3xl mx-auto">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-base font-bold">
            Basics
          </h3>
          <UButton
            label="Edit"
            color="neutral"
            variant="outline"
            size="xs"
            class="cursor-pointer"
            @click="emit('edit', 'basics')"
          />
        </div>
      </template>

      <div class="space-y-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
            Title
          </p>
          <p :class="isEmpty(draft.title) ? 'text-sm text-muted' : 'text-sm'">
            {{ titleDisplay }}
          </p>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
            Linked Experience
          </p>
          <p :class="linkedIsEmpty ? 'text-sm text-muted' : 'text-sm'">
            {{ linkedExperienceLabel }}
          </p>
        </div>
      </div>
    </UCard>

    <UCard
      v-for="section in HERO_WIZARD_SECTIONS"
      :key="section.key"
    >
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-extrabold">
              {{ section.letter }}
            </div>
            <h3 class="text-base font-bold">
              {{ section.title }}
            </h3>
          </div>
          <UButton
            label="Edit"
            color="neutral"
            variant="outline"
            size="xs"
            class="cursor-pointer"
            @click="emit('edit', section.key)"
          />
        </div>
      </template>

      <div class="space-y-4">
        <div
          v-for="field in section.fields"
          :key="field.key"
        >
          <p class="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
            {{ field.label }}
          </p>
          <p :class="isEmpty(draft[field.dbField]) ? 'text-sm text-muted' : 'text-sm'">
            {{ displayValue(draft[field.dbField]) }}
          </p>
        </div>
      </div>
    </UCard>

    <UButton
      label="Save HERO Story"
      color="primary"
      size="xl"
      block
      class="cursor-pointer mt-2"
      :loading="isSaving"
      :disabled="isSaving"
      @click="emit('save')"
    />
  </div>
</template>
