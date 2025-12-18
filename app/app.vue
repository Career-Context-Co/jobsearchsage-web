<script setup lang="ts">
const careerIDStore = useCareerIDStore()

// Attempt to fetch profile if profileId exists, but don't crash the app if it fails
// Individual pages (like /profile) will handle empty states and guide users to onboarding
if (!careerIDStore.isProfileLoaded && careerIDStore.profileId) {
  try {
    await careerIDStore.fetchProfile(careerIDStore.profileId)
    console.log('Profile loaded successfully')
  } catch (error: any) {
    // Silently handle 404 - user doesn't have a profile yet
    const is404 = error?.status === 404 || error?.statusCode === 404 || 
                  error?.message?.includes('not found') ||
                  error?.message?.includes('No profile')
    
    if (is404) {
      console.log('No profile found - user can create one via onboarding')
      // Clear error from store so it doesn't show in UI
      careerIDStore.error = null
    } else {
      // Log other errors but don't crash the app
      console.error('Failed to load profile:', error)
      careerIDStore.error = null // Clear error to allow app to function
    }
  }
} else if (!careerIDStore.profileId) {
  console.log('No profileId set - new user flow')
}

const colorMode = useColorMode()
const color = computed(() => colorMode.value === 'dark' ? '#1b1718' : 'white')

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'JobSearchSage - AI Job Search Coach & Interview Prep'
const description = 'Master your job search with AI coaching, application tracking, interview prep, and proven career frameworks. Transform your job search from chaos to clarity and confidence.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: 'https://ui.nuxt.com/assets/templates/nuxt/dashboard-light.png',
  twitterImage: 'https://ui.nuxt.com/assets/templates/nuxt/dashboard-light.png',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
