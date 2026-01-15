<script setup lang="ts">
interface Moment {
  id: string | number
  title: string
  raw_notes: string
  created_at: string
  status?: string
}

interface Props {
  moment: Moment
  context?: 'session' | 'management'
}

const props = withDefaults(defineProps<Props>(), {
  context: 'management'
})

const emit = defineEmits<{
  edit: []
  remove: []
  develop: []
}>()

// Format date for display
const formattedDate = computed(() => {
  if (!props.moment.created_at) return ''
  return new Date(props.moment.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// Truncate raw notes to first 2 sentences
const truncatedNotes = computed(() => {
  if (!props.moment.raw_notes) return ''
  
  const sentences = props.moment.raw_notes.match(/[^.!?]+[.!?]+/g) || []
  
  if (sentences.length <= 2) {
    return props.moment.raw_notes
  }
  
  return sentences.slice(0, 2).join(' ') + '...'
})

function handleEdit() {
  emit('edit')
}

function handleRemove() {
  emit('remove')
}

function handleDevelop() {
  emit('develop')
}
</script>

<template>
  <div class="border border-default rounded-lg p-4 hover:bg-muted/5 transition-colors">
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1 min-w-0">
        <!-- Title -->
        <h3 class="font-semibold mb-2 text-foreground">{{ moment.title }}</h3>
        
        <!-- Raw Notes (truncated) -->
        <p class="text-sm text-muted mb-3">{{ truncatedNotes }}</p>
        
        <!-- Timestamp and Status -->
        <div class="flex items-center gap-3 flex-wrap">
          <p class="text-xs text-muted">
            Discovered on {{ formattedDate }}
          </p>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex gap-2 shrink-0">
        <!-- Session Context: Edit and Remove -->
        <template v-if="context === 'session'">
          <UButton
            icon="i-lucide-pencil"
            color="neutral"
            variant="solid"
            size="sm"
            class="cursor-pointer"
            @click="handleEdit"
          />
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="sm"
            class="cursor-pointer"
            @click="handleRemove"
          />
        </template>
        
        <!-- Management Context: Develop and Remove -->
        <template v-else>
          <UButton
            label="Develop into HERO Story"
            icon="i-lucide-sparkles"
            color="primary"
            variant="subtle"
            size="sm"
            class="cursor-pointer"
            @click="handleDevelop"
          />
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="xs"
            class="cursor-pointer"
            @click="handleRemove"
          />
        </template>
      </div>
    </div>
  </div>
</template>
