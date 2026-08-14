<script setup lang="ts">
import type { HeroWizardDraft, HeroWizardSection } from '@/utils/heroWizardSections'

interface Props {
  section: HeroWizardSection
}

defineProps<Props>()

const draft = defineModel<HeroWizardDraft>({ required: true })
</script>

<template>
  <UCard>
    <div class="flex gap-4 items-start mb-7 pb-6 border-b border-default">
      <div class="size-12 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-xl">
        {{ section.letter }}
      </div>
      <div>
        <h2 class="text-lg font-bold">
          {{ section.title }}
        </h2>
        <p class="text-sm text-muted italic mt-0.5">
          {{ section.question }}
        </p>
        <p class="text-sm text-muted mt-2">
          {{ section.description }}
        </p>
      </div>
    </div>

    <div class="space-y-6">
      <UFormField
        v-for="field in section.fields"
        :key="field.key"
        :description="field.prompt"
      >
        <template #label>
          <span class="inline-flex items-center gap-2">
            <UBadge
              :label="field.tag"
              color="primary"
              variant="subtle"
              size="sm"
            />
            <span>{{ field.label }}</span>
          </span>
        </template>
        <UTextarea
          v-model="draft[field.dbField]"
          placeholder="Write your answer here…"
          :rows="3"
          autoresize
          class="w-full"
        />
      </UFormField>
    </div>
  </UCard>
</template>
