<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const toast = useToast()
const accountStore = useAccountStore()

const open = ref(false)

const profileChildren = computed(() => {
  const baseChildren = [{
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
  }]

  if (accountStore.isHeroEnabled) {
    baseChildren.push({
      label: 'HERO',
      to: '/profile/hero',
      onSelect: () => {
        open.value = false
      }
    })
  }

  return baseChildren
})

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

onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }

  toast.add({
    title: 'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Accept',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        cookie.value = 'accepted'
      }
    }, {
      label: 'Opt out',
      color: 'neutral',
      variant: 'ghost'
    }]
  })
})
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
          <UIcon name="i-lucide-briefcase-business" class="size-5 shrink-0 text-primary" />
          <span v-if="!collapsed" class="font-semibold text-md truncate">JobSearchSage</span>
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
