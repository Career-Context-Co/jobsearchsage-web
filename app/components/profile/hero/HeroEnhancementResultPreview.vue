<script setup lang="ts">
import type { HeroFieldResult } from '#shared/types/enhancement'

interface Props {
  results: HeroFieldResult[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<{
  back: []
  accept: [results: HeroFieldResult[]]
}>()

const editedResults = ref<HeroFieldResult[]>([])

onMounted(() => {
  editedResults.value = props.results.map(r => ({ ...r }))
})

watch(() => props.results, (newResults) => {
  editedResults.value = newResults.map(r => ({ ...r }))
})

function updateFieldText(index: number, text: string) {
  editedResults.value[index] = { ...editedResults.value[index], text }
}

function handleAccept() {
  const nonEmpty = editedResults.value.filter(r => r.text.trim())
  emit('accept', nonEmpty)
}

function handleBack() {
  emit('back')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
        <p class="text-sm text-muted">
          Synthesizing your answers...
        </p>
      </div>
    </div>

    <template v-else>
      <!-- Explanation Banner -->
      <div class="bg-base border border-default rounded-lg p-4">
        <div class="flex gap-3">
          <UIcon name="i-lucide-info" class="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div class="text-sm text-foreground">
            <p class="font-medium mb-1">
              Review your generated content
            </p>
            <p class="text-muted text-xs">
              Each field has been populated from your answers. Edit any field below, then accept to apply.
            </p>
          </div>
        </div>
      </div>

      <!-- Field Results -->
      <div class="space-y-4">
        <div
          v-for="(result, index) in editedResults"
          :key="result.fieldId"
          class="border border-default rounded-lg p-4 space-y-2"
        >
          <label
            :for="`field-${result.fieldId}`"
            class="text-sm font-semibold text-foreground flex items-center gap-2"
          >
            <UIcon name="i-lucide-pen-line" class="w-4 h-4 text-primary" />
            {{ result.fieldLabel }}
          </label>
          <UTextarea
            :id="`field-${result.fieldId}`"
            :model-value="result.text"
            :rows="3"
            autoresize
            class="w-full"
            @update:model-value="updateFieldText(index, $event)"
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between pt-2">
        <UButton
          label="Back"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="outline"
          class="cursor-pointer"
          @click="handleBack"
        />
        <UButton
          label="Accept & Apply"
          icon="i-lucide-check"
          color="primary"
          class="cursor-pointer"
          :disabled="editedResults.every(r => !r.text.trim())"
          @click="handleAccept"
        />
      </div>
    </template>
  </div>
</template>
