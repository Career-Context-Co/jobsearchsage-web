<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const schema = z.object({
  name: z.string().min(2, 'Certification name is required'),
  issuingOrg: z.string().min(2, 'Issuing organization is required'),
  dateObtained: z.string().optional()
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: undefined,
  issuingOrg: undefined,
  dateObtained: undefined
})

// Sample certifications list
const certifications = ref<Schema[]>([])

const toast = useToast()

async function onSubmit(event: FormSubmitEvent<Schema>) {
  certifications.value.push({ ...event.data })
  toast.add({ 
    title: 'Certification added', 
    description: event.data.name, 
    color: 'success' 
  })
  
  // Reset form
  Object.assign(state, {
    name: undefined,
    issuingOrg: undefined,
    dateObtained: undefined
  })
}

function removeCertification(index: number) {
  certifications.value.splice(index, 1)
  toast.add({ title: 'Certification removed', color: 'neutral' })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Existing Certifications List -->
    <div v-if="certifications.length > 0" class="space-y-3">
      <div
        v-for="(cert, index) in certifications"
        :key="index"
        class="p-4 border border-border rounded-lg bg-elevated"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h3 class="font-semibold text-foreground">{{ cert.name }}</h3>
            <p class="text-sm text-muted">{{ cert.issuingOrg }}</p>
            <p v-if="cert.dateObtained" class="text-xs text-muted mt-1">
              Obtained: {{ cert.dateObtained }}
            </p>
          </div>
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="sm"
            @click="removeCertification(index)"
          />
        </div>
      </div>
    </div>

    <!-- Add New Certification Form -->
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField label="Certification Name" name="name" required>
        <UInput 
          v-model="state.name" 
          placeholder="e.g., AWS Certified Solutions Architect, PMP"
        />
      </UFormField>

      <UFormField label="Issuing Organization" name="issuingOrg" required>
        <UInput 
          v-model="state.issuingOrg" 
          placeholder="e.g., Amazon Web Services, Project Management Institute"
        />
      </UFormField>

      <UFormField 
        label="Date Obtained" 
        name="dateObtained"
        help="Optional: When did you earn this certification?"
      >
        <UInput 
          v-model="state.dateObtained" 
          type="month"
          placeholder="YYYY-MM"
        />
      </UFormField>

      <div class="flex gap-2 pt-4">
        <UButton
          type="submit"
          leading-icon="i-lucide-plus"
          label="Add Certification"
          color="primary"
        />
      </div>
    </UForm>
  </div>
</template>

