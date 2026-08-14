<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { useCareerIDStore } from '~/stores/careerIDStore'

const route = useRoute()
const careerIDStore = useCareerIDStore()

const FULLSCREEN_CHILD_ROUTES = ['/profile/onboarding', '/profile/hero-wizard']
const isFullscreenChild = computed(() => FULLSCREEN_CHILD_ROUTES.includes(route.path))

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
  }, {
    label: 'HERO',
    icon: 'i-lucide-zap',
    to: '/profile/hero'
  }]

  return [
    baseLinks,
    ...(showContinueOnboarding.value ? [[{
      label: 'Continue Onboarding',
      icon: 'i-lucide-arrow-right',
      color: 'primary' as const,
      to: '/profile/onboarding',
      class: 'bg-gradient-to-r from-indigo-500 to-primary-500 cursor-pointer rounded text-white hover:text-white font-semibold'
    }]] : [])
  ] satisfies NavigationMenuItem[][]
})
</script>

<style scoped>
.nav-scroll-container {
  scrollbar-width: none;
}
.nav-scroll-container::-webkit-scrollbar {
  display: none;
}
</style>

<template>
  <!-- Render fullscreen child routes without the profile toolbar -->
  <NuxtPage v-if="isFullscreenChild" />
  
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
      <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full min-w-0 lg:max-w-2xl mx-auto">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
