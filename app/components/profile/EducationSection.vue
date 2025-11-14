<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const schema = z.object({
  degree: z.string().min(2, 'Degree is required'),
  institution: z.string().min(2, 'Institution name is required'),
  graduationYear: z.string().min(4, 'Graduation year is required'),
  coursework: z.string().optional()
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  degree: undefined,
  institution: undefined,
  graduationYear: undefined,
  coursework: undefined
})

// Sample education list
const educationList = ref<Schema[]>([])

const toast = useToast()

async function onSubmit(event: FormSubmitEvent<Schema>) {
  educationList.value.push({ ...event.data })
  toast.add({ 
    title: 'Education added', 
    description: `${event.data.degree} from ${event.data.institution}`, 
    color: 'success' 
  })
  
  // Reset form
  Object.assign(state, {
    degree: undefined,
    institution: undefined,
    graduationYear: undefined,
    coursework: undefined
  })
}

function removeEducation(index: number) {
  educationList.value.splice(index, 1)
  toast.add({ title: 'Education removed', color: 'neutral' })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Existing Education List -->
    <div v-if="educationList.length > 0" class="space-y-3">
      <div
        v-for="(edu, index) in educationList"
        :key="index"
        class="p-4 border border-border rounded-lg bg-elevated"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h3 class="font-semibold text-foreground">{{ edu.degree }}</h3>
            <p class="text-sm text-muted">{{ edu.institution }}</p>
            <p class="text-xs text-muted mt-1">Class of {{ edu.graduationYear }}</p>
            <p v-if="edu.coursework" class="text-xs text-muted mt-2">
              <span class="font-medium">Relevant Coursework:</span> {{ edu.coursework }}
            </p>
          </div>
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="sm"
            @click="removeEducation(index)"
          />
        </div>
      </div>
    </div>

    <!-- Add New Education Form -->
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField label="Degree" name="degree" required>
        <UInput 
          v-model="state.degree" 
          placeholder="e.g., Bachelor of Science in Computer Science, MBA"
        />
      </UFormField>

      <UFormField label="Institution" name="institution" required>
        <UInput 
          v-model="state.institution" 
          placeholder="e.g., Stanford University, MIT"
        />
      </UFormField>

      <UFormField label="Graduation Year" name="graduationYear" required>
        <UInput 
          v-model="state.graduationYear" 
          type="number"
          placeholder="e.g., 2020"
          min="1950"
          :max="new Date().getFullYear() + 10"
        />
      </UFormField>

      <UFormField 
        label="Relevant Coursework" 
        name="coursework"
        help="Optional: List key courses that are relevant to your career"
      >
        <UTextarea 
          v-model="state.coursework" 
          placeholder="e.g., Data Structures, Algorithms, Machine Learning, Database Systems"
          :rows="3"
        />
      </UFormField>

      <div class="flex gap-2 pt-4">
        <UButton
          type="submit"
          leading-icon="i-lucide-plus"
          label="Add Education"
          color="primary"
        />
      </div>
    </UForm>
  </div>
</template>

