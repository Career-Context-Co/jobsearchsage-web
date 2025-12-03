<script setup lang="ts">
import type { ContactInfo } from '~/shared/types/careerId'

interface SocialPlatform {
  id: number
  platform_name: string
  display_name: string
  icon?: string
  base_url?: string
}

interface SocialLink {
  platformId: number
  url: string
  platformName?: string
  icon?: string
}

// Form data type (without server-managed fields)
interface ContactInfoFormData {
  firstName: string
  lastName: string
  jobTitle: string
  email: string
  phone: string
  websites: string[]
  summary: string
  city: string
  stateRegion: string
  country: string
  postalCode: string
  willingToRelocate: boolean
}

// Props
interface Props {
  modelValue?: Partial<ContactInfoFormData>
  socialPlatforms?: SocialPlatform[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    firstName: '',
    lastName: '',
    jobTitle: '',
    email: '',
    phone: '',
    websites: [],
    summary: '',
    city: '',
    stateRegion: '',
    country: '',
    postalCode: '',
    willingToRelocate: false
  }),
  socialPlatforms: () => [
    // Default test data - parent will override this with real API data
    { id: 1, platform_name: 'linkedin', display_name: 'LinkedIn', base_url: 'https://linkedin.com/in/', icon: 'i-lucide-linkedin' },
    { id: 2, platform_name: 'github', display_name: 'GitHub', base_url: 'https://github.com/', icon: 'i-lucide-github' },
    { id: 3, platform_name: 'twitter', display_name: 'Twitter/X', base_url: 'https://twitter.com/', icon: 'i-lucide-twitter' },
    { id: 4, platform_name: 'instagram', display_name: 'Instagram', base_url: 'https://instagram.com/', icon: 'i-lucide-instagram' },
    { id: 5, platform_name: 'facebook', display_name: 'Facebook', base_url: 'https://facebook.com/', icon: 'i-lucide-facebook' }
  ]
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: Partial<ContactInfoFormData>]
  save: [data: ContactInfoFormData]
  addSocialLink: [link: SocialLink]
  updateSocialLink: [index: number, link: SocialLink]
  deleteSocialLink: [index: number]
}>()

// Local reactive copy for two-way binding
const contactInfo = ref<Partial<ContactInfoFormData>>({ ...props.modelValue })

// Watch for external prop changes
watch(() => props.modelValue, (newValue) => {
  contactInfo.value = { ...newValue }
}, { deep: true })

// Emit updates when local value changes
watch(contactInfo, (newValue) => {
  emit('update:modelValue', newValue)
}, { deep: true })

// Social links management
const socialLinks = ref<SocialLink[]>([])
const selectedSocialPlatform = ref<SocialPlatform | null>(props.socialPlatforms?.[0] || null)
const socialLinkUrl = ref(selectedSocialPlatform.value?.base_url || '')

// Watch for platform changes and auto-update URL
watch(selectedSocialPlatform, (newPlatform) => {
  if (newPlatform?.base_url) {
    socialLinkUrl.value = newPlatform.base_url
  }
})

function addWebsite() {
  if (!contactInfo.value.websites) {
    contactInfo.value.websites = []
  }
  contactInfo.value.websites.push('')
}

function removeWebsite(index: number) {
  if (contactInfo.value.websites) {
    contactInfo.value.websites.splice(index, 1)
  }
}

function addSocialLink() {
  if (!selectedSocialPlatform.value || !socialLinkUrl.value.trim()) {
    return
  }
  
  // Don't add if URL is just the base URL (not customized)
  if (socialLinkUrl.value === selectedSocialPlatform.value.base_url) {
    return
  }
  
  const link: SocialLink = {
    platformId: selectedSocialPlatform.value.id,
    url: socialLinkUrl.value,
    platformName: selectedSocialPlatform.value.display_name,
    icon: selectedSocialPlatform.value.icon
  }
  
  socialLinks.value.push(link)
  emit('addSocialLink', link)
  
  // Reset form - clear URL and reset platform to LinkedIn (first option)
  selectedSocialPlatform.value = props.socialPlatforms?.[0] || null
  socialLinkUrl.value = selectedSocialPlatform.value?.base_url || ''
}

function updateSocialLinkUrl(index: number, url: string) {
  socialLinks.value[index].url = url
  emit('updateSocialLink', index, socialLinks.value[index])
}

function removeSocialLink(index: number) {
  socialLinks.value.splice(index, 1)
  emit('deleteSocialLink', index)
}

function saveContactInfo() {
  emit('save', contactInfo.value as ContactInfoFormData)
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

      <!-- Social Links -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-foreground">Social Links</label>
        </div>
        
        <!-- Existing Social Links List -->
        <div v-if="socialLinks.length > 0" class="space-y-2">
          <div v-for="(link, linkIndex) in socialLinks" :key="linkIndex" class="flex gap-2 items-start">
            <div class="flex items-center flex-1/2">
              <div class="flex items-center gap-2 min-w-[120px] text-sm font-medium text-foreground">
                <UIcon v-if="link.icon" :name="link.icon" class="w-4 h-4 shrink-0" />
                <span class="truncate">{{ link.platformName }}</span>
              </div>
              <UInput 
                class="flex-2"
                :model-value="link.url"
                @update:model-value="(val: string) => updateSocialLinkUrl(linkIndex, val)"
                placeholder="https://..."
                size="lg"
              />
            </div>
            <UButton 
              class="cursor-pointer" 
              icon="i-lucide-trash-2" 
              color="error" 
              variant="ghost" 
              size="lg"
              @click="removeSocialLink(linkIndex)"
            />
          </div>
        </div>
        
        <!-- Add New Social Link Form -->
        <div class="flex gap-2 items-start">
          <div class="w-[200px]">
            <USelectMenu
              v-model="selectedSocialPlatform"
              :items="socialPlatforms"
              label-key="display_name"
              placeholder="Select platform"
              size="lg"
            >
              <template #leading>
                <UIcon name="i-lucide-share-2" class="w-4 h-4 text-muted" />
              </template>
            </USelectMenu>
          </div>
          
          <UInput 
            class="flex-2"
            v-model="socialLinkUrl"
            :placeholder="selectedSocialPlatform?.base_url ? `${selectedSocialPlatform.base_url}your-username` : 'Select a platform first'"
            size="lg"
          >
            <template #leading>
              <UIcon name="i-lucide-link" class="w-4 h-4 text-muted" />
            </template>
          </UInput>
        </div>
        <UButton
          class="cursor-pointer" 
          icon="i-lucide-plus" 
          color="primary" 
          variant="ghost" 
          size="sm"
          @click="addSocialLink"
        >
          Add Social
        </UButton>
      </div>

      <!-- Website Links -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-foreground">Website</label>
        </div>
        <div v-if="contactInfo.websites && contactInfo.websites.length > 0" class="space-y-2">
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
              class="cursor-pointer" 
              icon="i-lucide-trash-2" 
              color="error" 
              variant="ghost" 
              size="lg"
              @click="removeWebsite(websiteIndex)"
            />
          </div>
        </div>
        <UButton 
          class="cursor-pointer" 
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

