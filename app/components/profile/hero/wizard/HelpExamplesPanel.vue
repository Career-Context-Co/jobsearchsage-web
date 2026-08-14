<script setup lang="ts">
import type { HeroExampleRole, HeroWizardSection } from '@/utils/heroWizardSections'

interface Props {
  section: HeroWizardSection
  exampleRole: HeroExampleRole
}

defineProps<Props>()

const emit = defineEmits<{
  shuffle: []
}>()
</script>

<template>
  <UCard class="lg:sticky lg:top-6">
    <template #header>
      <div class="flex items-start justify-between gap-2">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">
            Help & Examples
          </p>
          <p class="text-xs text-muted mt-1">
            What to cover in this section — shuffle for a different role's example
          </p>
        </div>
        <UButton
          :label="HERO_EXAMPLE_ROLE_LABELS[exampleRole]"
          icon="i-lucide-shuffle"
          color="primary"
          variant="soft"
          size="xs"
          class="cursor-pointer shrink-0"
          @click="emit('shuffle')"
        />
      </div>
    </template>

    <div class="space-y-3">
      <div
        v-for="field in section.fields"
        :key="field.key"
        class="rounded-lg border border-default bg-muted/10 p-4"
      >
        <div class="flex items-center gap-2 mb-2">
          <UBadge
            :label="field.tag"
            color="primary"
            variant="subtle"
            size="sm"
          />
          <span class="text-sm font-semibold">{{ field.label }}</span>
        </div>
        <p class="text-sm text-muted mb-3">
          {{ field.prompt }}
        </p>
        <p class="text-sm text-primary pt-3 border-t border-dashed border-default">
          <span class="font-semibold">Example: </span>{{ field.examples[exampleRole] }}
        </p>
      </div>
    </div>
  </UCard>
</template>
