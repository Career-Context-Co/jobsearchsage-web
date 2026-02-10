<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { useCareerIDStore } from '~/stores/careerIDStore'

const route = useRoute()
const careerIDStore = useCareerIDStore()
const accountStore = useAccountStore()

// Check if we're on the onboarding page
const isOnboarding = computed(() => route.path === '/profile/onboarding')

// Check if user has partial completion (took a break during onboarding)
const showContinueOnboarding = computed(() => 
  careerIDStore.profile?.completionStatus === 'incomplete'
)

const links = computed(() => {
  const baseLinks: NavigationMenuItem[] = [{
    label: 'Overview',
    icon: 'i-lucide-user',
    to: '/profile',
    exact: true
  }, {
    label: 'Experience',
    icon: 'i-lucide-briefcase',
    to: '/profile/experience'
  }, {
    label: 'Education',
    icon: 'i-lucide-graduation-cap',
    to: '/profile/education'
  }, {
    label: 'Certifications',
    icon: 'i-lucide-award',
    to: '/profile/certifications'
  }, {
    label: 'Skills',
    icon: 'i-lucide-wrench',
    to: '/profile/skills'
  }]

  if (accountStore.isHeroEnabled) {
    baseLinks.push({
      label: 'HERO',
      icon: 'i-lucide-zap',
      to: '/profile/hero'
    })
  }

  return [
    baseLinks,
    ...(showContinueOnboarding.value ? [[{
      label: 'Continue Onboarding',
      icon: 'i-lucide-arrow-right',
      color: 'primary' as const,
      to: '/profile/onboarding',
      class: 'bg-gradient-to-r from-indigo-500 to-green-500 cursor-pointer rounded text-white hover:text-white font-semibold'
    }]] : [])
  ] satisfies NavigationMenuItem[][]
})
</script>

<template>
  <!-- Render onboarding without wrapper -->
  <NuxtPage v-if="isOnboarding" />
  
  <!-- Render other profile pages with navigation wrapper -->
  <UDashboardPanel v-else id="profile" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar title="Profile">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <!-- NOTE: The `-mx-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
        <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-2xl mx-auto">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
