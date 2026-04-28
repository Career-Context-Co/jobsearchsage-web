<script setup lang="ts">
const props = defineProps<{
  accentColor: string
  headerStyle?: 'classic' | 'bold' | 'minimal'
}>()

const emit = defineEmits<{
  'update:accentColor': [value: string]
  'update:headerStyle': [value: 'classic' | 'bold' | 'minimal']
}>()

const presetColors = [
  { name: 'Teal', value: '#0d9488' },
  { name: 'Navy', value: '#1e3a5f' },
  { name: 'Charcoal', value: '#374151' },
  { name: 'Forest', value: '#15803d' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Burgundy', value: '#881337' },
  { name: 'Purple', value: '#7c3aed' }
]

const headerStyleOptions: { label: string; value: 'classic' | 'bold' | 'minimal'; description: string }[] = [
  { label: 'Classic', value: 'classic', description: 'Colored underline on section headers' },
  { label: 'Bold', value: 'bold', description: 'Filled color block background' },
  { label: 'Minimal', value: 'minimal', description: 'Thin neutral separator line' }
]
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-lg font-semibold mb-1">Design</h2>
      <p class="text-sm text-muted">Customize the appearance of your resume</p>
    </div>

    <!-- Accent Color -->
    <div class="space-y-3">
      <div>
        <h3 class="text-sm font-medium mb-1">Accent Color</h3>
        <p class="text-xs text-muted">Used for section headers and your name</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="color in presetColors"
          :key="color.value"
          type="button"
          class="w-8 h-8 rounded-full transition-all"
          :class="accentColor === color.value ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'"
          :style="{ backgroundColor: color.value }"
          :title="color.name"
          @click="emit('update:accentColor', color.value)"
        >
          <span class="sr-only">{{ color.name }}</span>
          <UIcon v-if="accentColor === color.value" name="i-lucide-check" class="w-4 h-4 text-white mx-auto" />
        </button>
      </div>
    </div>

    <USeparator />

    <!-- Header Style -->
    <div class="space-y-3">
      <div>
        <h3 class="text-sm font-medium mb-1">Header Style</h3>
        <p class="text-xs text-muted">Controls how section headers are displayed</p>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="option in headerStyleOptions"
          :key="option.value"
          type="button"
          class="flex flex-col items-center gap-2 p-3 rounded-lg border transition-all text-center"
          :class="headerStyle === option.value
            ? 'border-primary ring-1 ring-primary bg-primary/5'
            : 'border-default hover:border-muted'"
          @click="emit('update:headerStyle', option.value)"
        >
          <!-- Mini preview of each style -->
          <div class="w-full space-y-1">
            <div
              class="h-2 w-full rounded-sm"
              :class="{
                'border-b-2': option.value === 'classic',
                'rounded': option.value === 'bold',
                'border-b': option.value === 'minimal'
              }"
              :style="option.value === 'classic' ? `border-color: ${accentColor}` :
                      option.value === 'bold' ? `background-color: ${accentColor}` :
                      'border-color: #d1d5db'"
            />
            <div class="h-1.5 w-3/4 bg-muted/30 rounded-sm" />
            <div class="h-1.5 w-1/2 bg-muted/20 rounded-sm" />
          </div>
          <span class="text-xs font-medium">{{ option.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
