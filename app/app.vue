<script setup lang="ts">
const careerIDStore = useCareerIDStore()
const accountStore = useAccountStore()

// Only fetch profile when authenticated AND profileId is a real value (not null/undefined/"null")
const hasProfile = accountStore.isAuthenticated && 
                   accountStore.profileId != null && 
                   accountStore.profileId !== 'null' &&
                   accountStore.profileId !== ''

if (hasProfile && !careerIDStore.isProfileLoaded) {
  try {
    await careerIDStore.fetchProfile(accountStore.profileId!)
    console.log('Profile loaded successfully')
  } catch (error: any) {
    console.error('Failed to load profile:', error)
    careerIDStore.error = null // Clear error to allow app to function
  }
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
