<script setup lang="ts">
import type { ContextStory } from '#shared/types/enhancement'

interface Props {
  storyNotes: ContextStory[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<{
  back: []
  save: [{ contextNotes: string }]
  cancel: []
}>()

// Editable context notes state
const contextNotes = ref('')

function handleBack() {
  emit('back')
}

function handleSave() {
  emit('save', {
    contextNotes: contextNotes.value
  })
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
        <p class="text-sm text-muted">Generating bullets...</p>
      </div>
    </div>

    <template v-else>
      <!-- Process Explanation Banner -->
      <div class="bg-base border border-default rounded-lg p-4">
        <div class="flex gap-3">
          <UIcon name="i-lucide-info" class="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div class="text-sm text-foreground">
            <p class="font-medium mb-1">Finalize your context for bullet generation</p>
            <p class="text-muted text-xs">Review and add any final context notes, then click "Next" to generate and select your resume bullets.</p>
          </div>
        </div>
      </div>

      <!-- Story Notes Section (Read-only) -->
      <div class="space-y-3">
        <!-- Story Notes Header -->
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
            <UIcon name="i-lucide-sparkles" class="w-5 h-5 text-teal-500" />
            Your Context Stories
          </h3>
          <span class="text-xs text-muted">{{ storyNotes.length }} captured</span>
        </div>

        <!-- Story Notes Display -->
        <div v-if="storyNotes && storyNotes.length > 0" class="border-2 border-teal-500 bg-teal-500/10 p-4 rounded-lg">
          <ul class="space-y-2">
            <li v-for="(note, index) in storyNotes" :key="`note-${index}`" class="flex gap-2 text-sm text-foreground">
              <span class="text-teal-500 shrink-0">•</span>
              <span>{{ note.text }}</span>
            </li>
          </ul>
        </div>
        <div v-else class="flex items-start gap-3 border-2 border-teal-500 bg-teal-500/10 p-4 rounded-lg">
          <UIcon name="i-lucide-lightbulb" class="w-4 h-4 text-muted shrink-0 mt-0.5" />
          <div class="text-sm text-muted">
            <p class="font-medium mb-1">No context stories yet</p>
            <p class="text-xs">Go back and answer questions to generate context.</p>
          </div>
        </div>
      </div>

      <!-- Additional Context Notes Section (Editable) -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-foreground">
          Additional Context <span class="text-muted font-normal">(Optional)</span>
        </label>
        <p class="text-xs text-muted mb-2">
          Add any additional context about your achievements, metrics, or accomplishments...
        </p>
        <UTextarea
          v-model="contextNotes"
          placeholder="E.g., Led team of 5, Reduced costs by 30%, Improved performance 5x..."
          :rows="4"
          class="w-full"
        />
      </div>
    </template>
  </div>
</template>

