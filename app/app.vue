<script setup lang="ts">
const careerIDStore = useCareerIDStore()

// Fetch the profile for whoever is logged in. The /me endpoint resolves
// by jss_user_id server-side so we never need a client-supplied profileId here.
// 401 = not logged in yet, 404 = new user with no profile — both are silent.
if (!careerIDStore.isProfileLoaded) {
  try {
    await careerIDStore.fetchProfileByUser()
  } catch (error: any) {
    const status = error?.status ?? error?.statusCode ?? error?.data?.statusCode
    if (status !== 401 && status !== 404) {
      console.error('Failed to load profile:', error)
    }
    careerIDStore.error = null
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
