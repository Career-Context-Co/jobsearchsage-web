<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

// Editor pages have their own full panel + toolbar — render them without the wrapper
const isEditorPage = computed(() =>
  /^\/docs\/resumes\/.+/.test(route.path)
)

const links = [[{
  label: 'Resumes',
  icon: 'i-lucide-file-text',
  to: '/docs/resumes',
  exact: true
}, {
  label: 'Cover Letters',
  icon: 'i-lucide-mail',
  to: '/docs/cover-letters'
}]] satisfies NavigationMenuItem[][]
</script>

<template>
  <!-- Editor pages render with their own full panel + specialized toolbar -->
  <NuxtPage v-if="isEditorPage" />

  <!-- List and utility pages get the shared Docs navbar + sub-nav -->
  <UDashboardPanel v-else id="docs" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar title="Docs">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
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
