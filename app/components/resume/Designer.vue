<script setup lang="ts">
interface Props {
  modelValue: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const presetColors = [
  { name: 'Teal', value: '#0d9488' },
  { name: 'Navy', value: '#1e3a5f' },
  { name: 'Slate', value: '#475569' },
  { name: 'Charcoal', value: '#374151' },
  { name: 'Forest', value: '#15803d' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Burgundy', value: '#881337' },
  { name: 'Purple', value: '#7c3aed' }
]

const selectedColor = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

function selectColor(color: string) {
  selectedColor.value = color
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-lg font-semibold mb-1">Design Customization</h2>
      <p class="text-sm text-muted">Customize the appearance of your resume</p>
    </div>

    <!-- Accent Color Section -->
    <div class="space-y-3">
      <div>
        <h3 class="text-sm font-medium mb-1">Accent Color</h3>
        <p class="text-xs text-muted">Choose a color for section headers and your name</p>
      </div>

      <!-- Color Swatches -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="color in presetColors"
          :key="color.value"
          type="button"
          class="w-8 h-8 rounded-full transition-all"
          :class="selectedColor === color.value ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'"
          :style="{ backgroundColor: color.value }"
          :title="color.name"
          @click="selectColor(color.value)"
        >
          <span class="sr-only">{{ color.name }}</span>
          <UIcon
            v-if="selectedColor === color.value"
            name="i-lucide-check"
            class="w-4 h-4 text-white mx-auto"
          />
        </button>
      </div>
    </div>

    <!-- Future Features Placeholder -->
    <div class="p-4 rounded-lg border border-default bg-muted/20">
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-sparkles" class="w-5 h-5 text-muted mt-0.5" />
        <div>
          <p class="text-sm font-medium text-muted">More Design Options Coming Soon</p>
          <p class="text-xs text-muted mt-1">
            Additional customization options like fonts, layouts, and spacing will be available in future updates.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
