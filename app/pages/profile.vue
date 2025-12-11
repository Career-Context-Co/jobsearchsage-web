<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

// Check if we're on the onboarding page
const isOnboarding = computed(() => route.path === '/profile/onboarding')

const links = [[{
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
}], [{
  label: 'Redo Onboarding',
  icon: 'i-lucide-rocket',
  to: '/profile/onboarding'
}]] satisfies NavigationMenuItem[][]
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
