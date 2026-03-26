<script setup lang="ts">
const colorMode = useColorMode()
const color = computed(() => colorMode.value === 'dark' ? '#1b1718' : 'white')

const config = useRuntimeConfig()
const ogImageUrl = computed(() => {
  const base = config.public.appUrl || 'https://jobsearchsage.com'
  const normalized = String(base).replace(/\/$/, '')
  return `${normalized}/og.jpg`
})

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
    { rel: 'manifest', href: '/site.webmanifest' }
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
  ogImage: ogImageUrl,
  twitterImage: ogImageUrl,
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
