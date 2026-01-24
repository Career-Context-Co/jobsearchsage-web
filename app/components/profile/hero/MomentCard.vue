<script setup lang="ts">
import { ref } from 'vue'

interface Moment {
  id: string | number
  title: string
  raw_notes: string
  created_at: string
  status?: string
  source_experience_id?: string | number | null
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
  save: [payload: { title: string; raw_notes: string }]
  cancel: []
}>()

const isEditing = ref(false)
const draftTitle = ref('')
const draftNotes = ref('')

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
  draftTitle.value = props.moment.title
  draftNotes.value = props.moment.raw_notes
  isEditing.value = true
  emit('edit')
}

function handleRemove() {
  emit('remove')
}

function handleDevelop() {
  emit('develop')
}

function handleCancel() {
  isEditing.value = false
  emit('cancel')
}

function handleSave() {
  emit('save', {
    title: draftTitle.value.trim(),
    raw_notes: draftNotes.value.trim()
  })
  isEditing.value = false
}
</script>

<template>
  <UPageCard v-if="isEditing && context === 'management'" variant="subtle">
    <div class="space-y-4">
      <h3 class="text-lg font-semibold">Edit Moment</h3>
      <div>
        <label class="block text-sm font-medium mb-1">Title <span class="text-error">*</span></label>
        <UInput
          v-model="draftTitle"
          placeholder="Moment title"
          maxlength="50"
          class="w-full"
        />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Raw Notes <span class="text-error">*</span></label>
        <UTextarea
          v-model="draftNotes"
          placeholder="Raw notes"
          maxlength="500"
          :rows="4"
          class="w-full"
        />
      </div>
      <div class="flex items-center justify-end gap-2">
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="handleCancel"
        />
        <UButton
          label="Update Moment"
          color="primary"
          size="sm"
          @click="handleSave"
        />
      </div>
    </div>
  </UPageCard>
  <UPageCard v-else variant="subtle">
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1 min-w-0">
        <!-- Title -->
        <h3 class="font-semibold mb-2 text-foreground">{{ moment.title }}</h3>
        
        <!-- Raw Notes (truncated) -->
        <p class="text-sm text-muted mb-3">{{ truncatedNotes }}</p>
        
        <!-- Timestamp and Status -->
        <div v-if="formattedDate" class="flex items-center gap-3 flex-wrap">
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
            :disabled="isEditing"
            @click="handleEdit"
          />
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="sm"
            class="cursor-pointer"
            :disabled="isEditing"
            @click="handleRemove"
          />
        </template>
        
        <!-- Management Context: Develop and Remove -->
        <template v-else>
          <UButton
            icon="i-lucide-pencil"
            color="neutral"
            variant="ghost"
            size="xs"
            class="cursor-pointer"
            :disabled="isEditing"
            @click="handleEdit"
          />  
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="xs"
            class="cursor-pointer"
            :disabled="isEditing"
            @click="handleRemove"
          />
          <UButton
            label="Develop into HERO Story"
            icon="i-lucide-sparkles"
            color="primary"
            variant="subtle"
            size="sm"
            class="cursor-pointer"
            :disabled="isEditing"
            @click="handleDevelop"
          />
        </template>
      </div>
    </div>
  </UPageCard>
</template>
