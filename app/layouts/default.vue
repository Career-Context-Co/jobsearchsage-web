<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const open = ref(false)

const profileChildren = computed(() => [{
  label: 'Overview',
  to: '/profile',
  exact: true,
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Experience',
  to: '/profile/experience',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Education',
  to: '/profile/education',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Certifications',
  to: '/profile/certifications',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Skills',
  to: '/profile/skills',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'HERO',
  to: '/profile/hero',
  onSelect: () => {
    open.value = false
  }
}]
)

const links = computed(() => [[
  {
    label: 'Home',
    icon: 'i-lucide-house',
    to: '/',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Profile',
    icon: 'i-lucide-user',
    to: '/profile',
    type: 'trigger',
    defaultOpen: true,
    children: profileChildren.value
  },
  {
    label: 'Docs',
    icon: 'i-lucide-file-text',
    to: '/docs/resumes',
    type: 'trigger',
    defaultOpen: false,
    children: [{
      label: 'Resumes',
      to: '/docs/resumes',
      onSelect: () => {
        open.value = false
      }
    }, {
      label: 'Cover Letters',
      to: '/docs/cover-letters',
      onSelect: () => {
        open.value = false
      }
    }]
  }],
[
// {
//   label: 'Feedback',
//   icon: 'i-lucide-message-circle',
//   to: 'https://github.com/nuxt-ui-templates/dashboard',
//   target: '_blank'
// },
  {
    label: 'Help & Support',
    icon: 'i-lucide-info',
    to: 'mailto:hello@jobsearchsage.com',
    target: '_blank'
  }]] satisfies NavigationMenuItem[][])

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.value.flat()
}, {
  id: 'code',
  label: 'Code',
  items: [{
    id: 'source',
    label: 'View page source',
    icon: 'i-simple-icons-github',
    to: `https://github.com/nuxt-ui-templates/dashboard/blob/main/app/pages${route.path === '/' ? '/index' : route.path}.vue`,
    target: '_blank'
  }]
}])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ header: 'lg:border-b lg:border-default mb-1', footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <div class="flex items-center gap-2 px-1 min-w-0">
          <img
            v-if="collapsed"
            src="/brand/icon.svg"
            class="size-6 shrink-0"
            alt="JobSearchSage"
          >
          <img
            v-else
            src="/brand/wordmark.svg"
            class="h-7 w-auto max-w-full"
            alt="JobSearchSage"
          >
        </div>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
