<script setup lang="ts">
const careerIDStore = useCareerIDStore()
const toast = useToast()
const router = useRouter()

// Get current user - this would typically come from Supabase auth
// For now, we'll use a mock user ID
const user = ref({ id: 'mock-user-id' }) // TODO: Replace with real Supabase user

// Loading state from store
const isLoading = computed(() => careerIDStore.isLoading)
const error = computed(() => careerIDStore.error)

// Contact info from store
const contactInfo = computed(() => careerIDStore.contactInfo)
const socialLinks = computed(() => careerIDStore.profileSocialLinks)

// Fetch profile data on mount
onMounted(async () => {
  if (!user.value?.id) {
    toast.add({
      title: 'Error',
      description: 'You must be logged in to view your profile',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    router.push('/login')
    return
  }

  try {
    // Only fetch if not already loaded
    if (!careerIDStore.isProfileLoaded) {
      await careerIDStore.fetchProfile(user.value.id)
    }

    // If no profile found, redirect to onboarding
    if (!careerIDStore.profile) {
      toast.add({
        title: 'No profile found',
        description: 'Please complete onboarding to create your profile',
        icon: 'i-lucide-info',
        color: 'primary'
      })
      router.push('/profile/onboarding')
    }
  } catch (err) {
    // Error is already set in store
    console.error('Failed to load profile:', err)
  }
})
</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="space-y-4">
    <USkeleton class="h-32 w-full" />
    <USkeleton class="h-64 w-full" />
    <USkeleton class="h-48 w-full" />
  </div>

  <!-- Error State -->
  <div v-else-if="error">
    <UPageCard
      title="Error Loading Profile"
      variant="subtle"
    >
      <div class="flex flex-col items-center justify-center py-8 gap-4">
        <UIcon name="i-lucide-alert-circle" class="w-12 h-12 text-error" />
        <p class="text-muted">{{ error }}</p>
        <UButton
          label="Retry"
          color="primary"
          @click="careerIDStore.fetchProfile(user?.id)"
        />
      </div>
    </UPageCard>
  </div>

  <!-- Profile Content -->
  <div v-else-if="contactInfo" class="space-y-4">
    <!-- Contact Information Section -->
    <UPageCard
      title="Contact Information"
      description="Your personal and professional contact details"
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        label="Edit"
        color="neutral"
        variant="outline"
        icon="i-lucide-pencil"
        class="w-fit lg:ms-auto"
        disabled
      />
    </UPageCard>

    <UPageCard variant="subtle">
      <!-- Name -->
      <div class="flex max-sm:flex-col justify-between items-start gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium mb-1">Name</label>
          <p class="text-base">{{ contactInfo.firstName }} {{ contactInfo.lastName }}</p>
        </div>
      </div>
      
      <USeparator />

      <!-- Job Title -->
      <div class="flex max-sm:flex-col justify-between items-start gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium mb-1">Job Title</label>
          <p class="text-base">{{ contactInfo.jobTitle || 'Not specified' }}</p>
        </div>
      </div>

      <USeparator />

      <!-- Email -->
      <div class="flex max-sm:flex-col justify-between items-start gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium mb-1">Email</label>
          <p class="text-base">{{ contactInfo.email }}</p>
        </div>
      </div>

      <USeparator />

      <!-- Phone -->
      <div class="flex max-sm:flex-col justify-between items-start gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium mb-1">Phone</label>
          <p class="text-base">{{ contactInfo.phone || 'Not specified' }}</p>
        </div>
      </div>

      <USeparator />

      <!-- Location -->
      <div class="flex max-sm:flex-col justify-between items-start gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium mb-1">Location</label>
          <p class="text-base">
            <template v-if="contactInfo.city || contactInfo.stateRegion || contactInfo.country">
              {{ [contactInfo.city, contactInfo.stateRegion, contactInfo.country].filter(Boolean).join(', ') }}
            </template>
            <template v-else>
              Not specified
            </template>
          </p>
        </div>
      </div>

      <USeparator />

      <!-- Websites -->
      <div v-if="contactInfo.websites?.length" class="flex max-sm:flex-col justify-between items-start gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium mb-1">Websites</label>
          <ul class="space-y-1">
            <li v-for="(website, index) in contactInfo.websites" :key="index">
              <a :href="website" target="_blank" rel="noopener" class="text-primary hover:underline">
                {{ website }}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <USeparator v-if="contactInfo.websites?.length" />

      <!-- Willing to Relocate -->
      <div class="flex max-sm:flex-col justify-between items-start gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium mb-1">Willing to Relocate</label>
          <p class="text-base">{{ contactInfo.willingToRelocate ? 'Yes' : 'No' }}</p>
        </div>
      </div>
    </UPageCard>

    <!-- Professional Summary Section -->
    <UPageCard
      title="Professional Summary"
      description="Brief overview of your professional experience and goals"
      variant="naked"
      orientation="horizontal"
      class="mt-8 mb-4"
    >
      <UButton
        label="Edit"
        color="neutral"
        variant="outline"
        icon="i-lucide-pencil"
        class="w-fit lg:ms-auto"
        disabled
      />
    </UPageCard>

    <UPageCard variant="subtle">
      <div class="prose prose-sm max-w-none">
        <p v-if="contactInfo.summary" class="whitespace-pre-wrap">{{ contactInfo.summary }}</p>
        <p v-else class="text-muted italic">No professional summary added yet.</p>
      </div>
    </UPageCard>

    <!-- Social Links Section -->
    <UPageCard
      title="Social Links"
      description="Your professional social media profiles"
      variant="naked"
      orientation="horizontal"
      class="mt-8 mb-4"
    >
      <UButton
        label="Add Link"
        color="neutral"
        variant="outline"
        icon="i-lucide-plus"
        class="w-fit lg:ms-auto"
        disabled
      />
    </UPageCard>

    <UPageCard variant="subtle">
      <div v-if="socialLinks?.length" class="space-y-3">
        <div
          v-for="link in socialLinks"
          :key="link.id"
          class="flex items-center justify-between gap-4 p-3 rounded-lg border border-default hover:bg-muted/50 transition-colors"
        >
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-link" class="w-5 h-5 text-muted" />
            <div>
              <p class="font-medium">{{ link.platformNameCache }}</p>
              <a :href="link.url" target="_blank" rel="noopener" class="text-sm text-primary hover:underline">
                {{ link.url }}
              </a>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-8">
        <UIcon name="i-lucide-link" class="w-12 h-12 text-muted mx-auto mb-3" />
        <p class="text-muted">No social links added yet.</p>
      </div>
    </UPageCard>
  </div>

  <!-- No Profile State -->
  <div v-else>
    <UPageCard variant="subtle">
      <div class="flex flex-col items-center justify-center py-12 gap-4">
        <UIcon name="i-lucide-user" class="w-16 h-16 text-muted" />
        <h3 class="text-lg font-semibold">No Profile Found</h3>
        <p class="text-muted text-center max-w-md">
          It looks like you haven't created your profile yet. Complete onboarding to get started.
        </p>
        <UButton
          label="Redo Onboarding"
          color="primary"
          icon="i-lucide-arrow-right"
          trailing
          to="/profile/onboarding"
        />
      </div>
    </UPageCard>
  </div>
</template>
