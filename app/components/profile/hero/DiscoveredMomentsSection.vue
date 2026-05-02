<script setup lang="ts">
import { ref, computed } from 'vue'

interface Moment {
  id: string | number
  title: string
  raw_notes: string
  created_at: string
  status?: string
  source_experience_id?: string | number | null
}

interface Props {
  moments: Moment[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<{
  develop: [moment: Moment]
  developWithAI: [moment: Moment]
  remove: [moment: Moment]
  save: [payload: { moment: Moment; updates: { title: string; rawNotes: string } }]
  cancel: [moment: Moment]
  startSession: []
}>()

// Collapsible state
const isExpanded = ref(true)

// Sort moments by date (newest first)
const sortedMoments = computed(() => {
  return [...props.moments].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
})

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

function handleDevelop(moment: Moment) {
  emit('develop', moment)
}

function handleDevelopWithAI(moment: Moment) {
  emit('developWithAI', moment)
}

function handleRemove(moment: Moment) {
  emit('remove', moment)
}

function handleSave(moment: Moment, updates: { title: string; raw_notes: string }) {
  emit('save', {
    moment,
    updates: { title: updates.title, rawNotes: updates.raw_notes }
  })
}

function handleCancel(moment: Moment) {
  emit('cancel', moment)
}

function handleStartSession() {
  emit('startSession')
}
</script>

<template>
  <div class="space-y-3">
    <!-- Header: Collapsible Title -->
    <div
      class="flex items-center justify-between cursor-pointer px-3 rounded-lg hover:bg-muted/5 transition-colors"
      @click="toggleExpanded"
    >
      <div class="flex items-center flex-1">
        <div class="flex items-center gap-4">
          <h2 class="text-xl font-semibold text-foreground">Discovered HERO Moments</h2>
          <UBadge
            v-if="moments.length > 0"
            color="neutral"
            variant="soft"
            size="md"
          >
            {{ moments.length }}
          </UBadge>
        </div>
      </div>

      <UButton
          label="Get HERO Help"
          icon="i-lucide-sparkles"
          color="primary"
          variant="solid"
          size="md"
          class="cursor-pointer"
          @click="handleStartSession"
      />
      
      <UIcon
        :name="isExpanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
        class="w-5 h-5 text-muted shrink-0 ml-4"
      />
    </div>

    <!-- Expanded Content -->
    <template v-if="isExpanded">
      <div v-if="isLoading" class="px-3 text-sm text-muted">
        Loading moments...
      </div>

      <!-- Subtitle with CTA Button -->
      <div v-if="moments.length > 0" class="flex items-center justify-between px-3">
        <p class="text-base text-muted">
          You can develop these into full HERO stories.
        </p>
      </div>

      <!-- Empty State (Compact) -->
      <div v-if="!isLoading && moments.length === 0" class="border border-default rounded-lg p-4">
        <div class="flex flex-col items-center gap-4">
          <p class="text-sm text-muted">
            No moments captured yet. <span class="font-medium">Start a discovery session</span> to capture achievements.
          </p>
          <UButton
            label="Get HERO Help"
            icon="i-lucide-sparkles"
            color="primary"
            size="md"
            class="cursor-pointer shrink-0"
            @click="handleStartSession"
          />
        </div>
      </div>

      <!-- Moments List -->
      <div v-else-if="!isLoading" class="space-y-2 px-2">
        <ProfileHeroMomentCard
          v-for="moment in sortedMoments"
          :key="moment.id"
          :moment="moment"
          context="management"
          @develop="handleDevelop(moment)"
          @develop-with-a-i="handleDevelopWithAI(moment)"
          @remove="handleRemove(moment)"
          @save="(updates) => handleSave(moment, updates)"
          @cancel="() => handleCancel(moment)"
        />
      </div>
    </template>
  </div>
</template>
