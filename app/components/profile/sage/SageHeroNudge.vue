<script setup lang="ts">
defineProps<{
  signal: string
  context: string
  experienceId: number
  isLoading?: boolean
}>()

const emit = defineEmits<{
  start: [experienceId: number]
  dismiss: [experienceId: number]
}>()
</script>

<template>
  <div class="rounded-2xl border border-primary-200/70 dark:border-primary-700/60 bg-primary-500/10 p-4">
    <div class="flex items-start gap-3">
      <UIcon
        name="i-lucide-zap"
        class="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5"
      />
      <div class="flex-1 space-y-2">
        <div>
          <p class="text-sm font-semibold text-primary-950 dark:text-primary-200">
            {{ signal }}
          </p>
          <p class="text-sm text-primary-900/80 dark:text-primary-200/80 mt-1">
            {{ context }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <UButton
            label="Start HERO interview"
            color="primary"
            size="sm"
            icon="i-lucide-sparkles"
            class="cursor-pointer"
            :loading="isLoading"
            :disabled="isLoading"
            @click="emit('start', experienceId)"
          />
          <UButton
            label="Dismiss"
            color="neutral"
            variant="ghost"
            size="sm"
            class="cursor-pointer"
            @click="emit('dismiss', experienceId)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
