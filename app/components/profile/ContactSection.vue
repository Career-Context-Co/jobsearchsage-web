<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number is required (minimum 10 digits)'),
  location: z.string().min(3, 'Location is required (city, state)'),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().or(z.literal(''))
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  email: undefined,
  phone: undefined,
  location: undefined,
  linkedinUrl: undefined
})

const toast = useToast()
const isSaved = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  // In a real app, this would save to the backend
  toast.add({ 
    title: 'Contact information saved', 
    description: 'Your contact details have been updated', 
    color: 'success' 
  })
  isSaved.value = true
  
  // Simulate API call delay
  setTimeout(() => {
    isSaved.value = false
  }, 3000)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Contact Info Preview -->
    <div v-if="state.email || state.phone" class="p-4 border border-border rounded-lg bg-elevated space-y-2">
      <div v-if="state.email" class="flex items-center gap-2">
        <UIcon name="i-lucide-mail" class="w-4 h-4 text-muted" />
        <span class="text-sm text-foreground">{{ state.email }}</span>
      </div>
      <div v-if="state.phone" class="flex items-center gap-2">
        <UIcon name="i-lucide-phone" class="w-4 h-4 text-muted" />
        <span class="text-sm text-foreground">{{ state.phone }}</span>
      </div>
      <div v-if="state.location" class="flex items-center gap-2">
        <UIcon name="i-lucide-map-pin" class="w-4 h-4 text-muted" />
        <span class="text-sm text-foreground">{{ state.location }}</span>
      </div>
      <div v-if="state.linkedinUrl" class="flex items-center gap-2">
        <UIcon name="i-lucide-linkedin" class="w-4 h-4 text-muted" />
        <a 
          :href="state.linkedinUrl" 
          target="_blank" 
          rel="noopener noreferrer"
          class="text-sm text-primary hover:underline"
        >
          LinkedIn Profile
        </a>
      </div>
    </div>

    <!-- Contact Form -->
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField label="Email Address" name="email" required>
        <UInput 
          v-model="state.email" 
          type="email"
          placeholder="john.doe@example.com"
          leading-icon="i-lucide-mail"
        />
      </UFormField>

      <UFormField label="Phone Number" name="phone" required>
        <UInput 
          v-model="state.phone" 
          type="tel"
          placeholder="(555) 123-4567"
          leading-icon="i-lucide-phone"
        />
      </UFormField>

      <UFormField 
        label="Location" 
        name="location" 
        help="City and State (e.g., San Francisco, CA)"
        required
      >
        <UInput 
          v-model="state.location" 
          placeholder="San Francisco, CA"
          leading-icon="i-lucide-map-pin"
        />
      </UFormField>

      <UFormField 
        label="LinkedIn Profile" 
        name="linkedinUrl"
        help="Optional: Your LinkedIn profile URL"
      >
        <UInput 
          v-model="state.linkedinUrl" 
          type="url"
          placeholder="https://www.linkedin.com/in/your-profile"
          leading-icon="i-lucide-linkedin"
        />
      </UFormField>

      <div class="flex gap-2 pt-4">
        <UButton
          type="submit"
          label="Save Contact Information"
          color="primary"
          :loading="isSaved"
        >
          <template #leading>
            <UIcon :name="isSaved ? 'i-lucide-check' : 'i-lucide-save'" />
          </template>
        </UButton>
      </div>
    </UForm>

    <!-- Privacy Notice -->
    <div class="bg-neutral-100 dark:bg-neutral-900 border border-border rounded-lg p-4">
      <div class="flex gap-3">
        <UIcon name="i-lucide-shield-check" class="w-5 h-5 text-muted shrink-0 mt-0.5" />
        <div class="text-sm text-muted">
          <p class="font-medium text-foreground mb-1">Your privacy matters</p>
          <p>
            Your contact information is securely stored and will only be shared with employers 
            when you apply to jobs. You have full control over your data.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

