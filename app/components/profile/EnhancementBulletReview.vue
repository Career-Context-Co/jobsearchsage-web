<script setup lang="ts">
import type { ContextStory, ResumeBullet } from '#shared/types/enhancement'

interface Props {
  storyNotes: ContextStory[]
  bulletPairs: ResumeBullet[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<{
  back: []
  save: [{ selectedBullets: string[] }]
  cancel: []
}>()

// Track selected bullet for each pair (index in bulletPairs)
const selectedBullets = ref<Map<number, 'primary' | 'secondary'>>(new Map())

// Initialize selections with primary as default
onMounted(() => {
  props.bulletPairs.forEach((_, index) => {
    selectedBullets.value.set(index, 'primary')
  })
})

function toggleBulletSelection(bulletIndex: number, option: 'primary' | 'secondary') {
  selectedBullets.value.set(bulletIndex, option)
}

function getSelectedBulletText(bulletIndex: number): string {
  const option = selectedBullets.value.get(bulletIndex) || 'primary'
  const bullet = props.bulletPairs[bulletIndex]
  if (!bullet) return ''
  return option === 'primary' ? bullet.primary : bullet.secondary
}

function handleBack() {
  emit('back')
}

function handleSave() {
  const selected: string[] = []
  props.bulletPairs.forEach((_, index) => {
    selected.push(getSelectedBulletText(index))
  })
  
  emit('save', {
    selectedBullets: selected
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
            <p class="font-medium mb-1">Select your preferred bullet options</p>
            <p class="text-muted text-xs">Choose the wording you prefer for each achievement. Both options are equally valid—pick the one that resonates most.</p>
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

      <!-- Generated Bullets Section with Selection UI -->
      <div class="space-y-3">
        <!-- Bullets Header -->
        <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
          <UIcon name="i-lucide-target" class="w-5 h-5 text-teal-500" />
          Your Enhanced Experience Bullets (Select Preferred Option)
        </h3>

        <!-- Bullets Display with Selection -->
        <div v-if="bulletPairs && bulletPairs.length > 0" class="space-y-4">
          <div
            v-for="(bullet, bulletIndex) in bulletPairs"
            :key="`bullet-${bulletIndex}`"
            class="border-2 border-default rounded-lg p-4 bg-base hover:border-primary/50 transition-colors space-y-3"
          >
            <!-- Bullet Index Badge -->
            <div class="text-xs text-muted font-medium">
              Bullet {{ bulletIndex + 1 }} of {{ bulletPairs.length }}
            </div>

            <!-- Primary Option -->
            <button
              @click="toggleBulletSelection(bulletIndex, 'primary')"
              class="w-full text-left px-3 py-2 rounded-lg border-2 cursor-pointer transition-all"
              :class="
                selectedBullets.get(bulletIndex) === 'primary'
                  ? 'border-primary bg-primary/10'
                  : 'border-default bg-base hover:border-default/50'
              "
            >
              <div class="flex gap-2 items-start">
                <div class="shrink-0 mt-1">
                  <UIcon
                    :name="
                      selectedBullets.get(bulletIndex) === 'primary'
                        ? 'i-lucide-radio-button-on'
                        : 'i-lucide-circle'
                    "
                    class="w-4 h-4 text-primary"
                  />
                </div>
                <div class="flex-1">
                  <p class="text-xs text-muted uppercase tracking-wide mb-1">Option A</p>
                  <p class="text-sm text-foreground leading-relaxed">{{ bullet.primary }}</p>
                </div>
              </div>
            </button>

            <!-- Secondary Option -->
            <button
              @click="toggleBulletSelection(bulletIndex, 'secondary')"
              class="w-full text-left px-3 py-2 rounded-lg border-2 cursor-pointer transition-all"
              :class="
                selectedBullets.get(bulletIndex) === 'secondary'
                  ? 'border-primary bg-primary/10'
                  : 'border-default bg-base hover:border-default/50'
              "
            >
              <div class="flex gap-2 items-start">
                <div class="shrink-0 mt-1">
                  <UIcon
                    :name="
                      selectedBullets.get(bulletIndex) === 'secondary'
                        ? 'i-lucide-radio-button-on'
                        : 'i-lucide-circle'
                    "
                    class="w-4 h-4 text-primary"
                  />
                </div>
                <div class="flex-1">
                  <p class="text-xs text-muted uppercase tracking-wide mb-1">Option B</p>
                  <p class="text-sm text-foreground leading-relaxed">{{ bullet.secondary }}</p>
                </div>
              </div>
            </button>

            <!-- Selection Indicator -->
            <div class="text-xs text-primary font-medium flex items-center gap-1">
              <UIcon name="i-lucide-check-circle" class="w-3 h-3" />
              Selected: {{ selectedBullets.get(bulletIndex) === 'primary' ? 'Option A' : 'Option B' }}
            </div>
          </div>
        </div>
        <div v-else class="flex items-start gap-3 border border-default bg-muted/10 p-4 rounded">
          <UIcon name="i-lucide-alert-circle" class="w-4 h-4 text-muted shrink-0 mt-0.5" />
          <div class="text-sm text-muted">
            <p class="font-medium mb-1">No bullets generated yet</p>
            <p class="text-xs">Go back and complete your context to generate your enhanced experience bullets.</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

