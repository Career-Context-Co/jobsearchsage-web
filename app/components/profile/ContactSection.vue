<script setup lang="ts">
interface ContactInfo {
  firstName: string
  lastName: string
  jobTitle: string
  email: string
  phone: string
  linkedin: string
  websites: string[]
  summary: string
  city: string
  stateRegion: string
  country: string
  postalCode: string
  willingToRelocate: boolean
}

const contactInfo = ref<ContactInfo>({
  firstName: '',
  lastName: '',
  jobTitle: '',
  email: '',
  phone: '',
  linkedin: '',
  websites: [],
  summary: '',
  city: '',
  stateRegion: '',
  country: '',
  postalCode: '',
  willingToRelocate: false
})

const isSaved = ref(false)

function addWebsite() {
  contactInfo.value.websites.push('')
}

function removeWebsite(index: number) {
  contactInfo.value.websites.splice(index, 1)
}

function saveContactInfo() {
  isSaved.value = true
  console.log('Saved contact info:', contactInfo.value)
  
  setTimeout(() => {
    isSaved.value = false
  }, 2000)
}
</script>

<template>
  <div class="max-w-xl mx-auto space-y-4">
    <!-- Section Title and Description -->
    <div class="mb-8 space-y-2">
      <h1 class="text-2xl sm:text-3xl font-semibold text-foreground">Let employers know who you are</h1>
      <p class="text-sm text-muted">
        Include your full name and an email for employers to contact you.
      </p>
    </div>

    <UForm :state="contactInfo" class="space-y-4">
      <!-- First Name and Last Name -->
      <div class="flex items-center justify-center gap-2 w-full">
        <UFormField class="flex-1" size="xl" label="First Name" name="firstName">
          <UInput 
            class="w-full"
            v-model="contactInfo.firstName" 
            placeholder="John"
          />
        </UFormField>

        <UFormField class="flex-1" size="xl" label="Last Name" name="lastName">
          <UInput 
            class="w-full"
            v-model="contactInfo.lastName" 
            placeholder="Doe"
          />
        </UFormField>
      </div>

      <!-- Current Job Title -->
      <UFormField size="xl" label="Current Title" name="jobTitle">
        <UInput 
          class="w-full"
          v-model="contactInfo.jobTitle" 
          placeholder="e.g., Software Engineer, Product Manager"
        />
      </UFormField>

      <!-- Email -->
      <UFormField size="xl" label="Email Address" name="email">
        <UInput 
          class="w-full"
          v-model="contactInfo.email" 
          type="email"
          placeholder="john.doe@example.com"
        />
      </UFormField>

      <!-- Phone -->
      <UFormField size="xl" label="Phone" name="phone">
        <UInput 
          class="w-full"
          v-model="contactInfo.phone" 
          type="tel"
          placeholder="(555) 123-4567"
        />
      </UFormField>

      <!-- LinkedIn -->
      <UFormField size="xl" label="LinkedIn" name="linkedin">
        <UInput 
          class="w-full"
          v-model="contactInfo.linkedin" 
          placeholder="linkedin.com/in/your-name"
        >
          <template #leading>
            <UIcon name="i-lucide-linkedin" class="w-5 h-5 text-muted" />
          </template>
        </UInput>
      </UFormField>

      <!-- Website Links -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-foreground">Website</label>
        </div>
        <div v-if="contactInfo.websites.length > 0" class="space-y-2">
          <div v-for="(website, websiteIndex) in contactInfo.websites" :key="websiteIndex" class="flex gap-2 items-start">
            <div class="flex items-center gap-2 flex-1">
              <UIcon name="i-lucide-link" class="w-4 h-4 text-muted shrink-0" />
              <UInput 
                class="flex-1"
                v-model="contactInfo.websites[websiteIndex]" 
                placeholder="e.g. online-profile.com"
                size="lg"
              />
            </div>
            <UButton 
              icon="i-lucide-trash-2" 
              color="error" 
              variant="ghost" 
              size="lg"
              @click="removeWebsite(websiteIndex)"
            />
          </div>
        </div>
        <UButton 
          icon="i-lucide-plus" 
          color="primary" 
          variant="ghost" 
          size="sm"
          @click="addWebsite"
        >
          Add Link
        </UButton>
      </div>

      <!-- Summary -->
      <UFormField size="xl" label="Summary" name="summary">
        <UTextarea 
          class="w-full"
          v-model="contactInfo.summary" 
          :rows="6"
          autoresize
          placeholder="Brief professional summary..."
        />
      </UFormField>

      <!-- Address Section -->
      <div class="pt-4 ">
        <h3 class="text-lg font-semibold text-foreground mb-4">Location</h3>
        
        <!-- City and State/Region -->
        <div class="flex gap-2 w-full mb-4">
          <UFormField class="flex-1" size="xl" label="City" name="city">
            <UInput 
              class="w-full"
              v-model="contactInfo.city" 
              placeholder="e.g., San Francisco"
            />
          </UFormField>

          <UFormField class="flex-1" size="xl" label="State/Region" name="stateRegion">
            <UInput 
              class="w-full"
              v-model="contactInfo.stateRegion" 
              placeholder="e.g., CA"
            />
          </UFormField>
        </div>

        <!-- Postal Code and Country -->
        <div class="flex gap-2 w-full">
          <UFormField class="flex-1" size="xl" label="Postal Code" name="postalCode">
            <UInput 
              class="w-full"
              v-model="contactInfo.postalCode" 
              placeholder="e.g., 94102"
            />
          </UFormField>

          <UFormField class="flex-1" size="xl" label="Country" name="country">
            <UInput 
              class="w-full"
              v-model="contactInfo.country" 
              placeholder="e.g., United States"
            />
          </UFormField>
        </div>
      </div>

      <!-- Willing to Relocate -->
      <UFormField size="xl" label="Willing to Relocate?" name="willingToRelocate">
        <USwitch v-model="contactInfo.willingToRelocate" />
      </UFormField>

      <!-- Action Button -->
      <div class="flex gap-2 pt-4">
        <UButton class="cursor-pointer" size="xl" @click="saveContactInfo">
          Save Contact Information
        </UButton>
      </div>
    </UForm>
  </div>
</template>

