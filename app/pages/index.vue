<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { isNotificationsSlideoverOpen } = useDashboard()
const accountStore = useAccountStore()
const careerIDStore = useCareerIDStore()

const displayName = computed(() =>
  accountStore.user?.preferredName || accountStore.user?.firstName || 'there'
)

const hasProfile = computed(() => !!accountStore.profileId)
const profileIncomplete = computed(() =>
  careerIDStore.profile?.completionStatus === 'incomplete'
)

const nextSteps = computed(() => {
  const steps: Array<{
    title: string
    description: string
    to: string
    icon: string
    label: string
  }> = []

  if (!hasProfile.value || profileIncomplete.value) {
    steps.push({
      title: 'Create or complete your profile',
      description: 'Your profile is the foundation for your resume and applications. Add your experience, education, and skills so JobSearchSage can tailor content for you.',
      to: '/profile/onboarding',
      icon: 'i-lucide-user-plus',
      label: hasProfile.value ? 'Continue profile' : 'Start profile'
    })
  }

  if (hasProfile.value) {
    steps.push({
      title: 'Build your resume',
      description: 'Turn your profile into a polished resume. Customize content and design, then export to PDF or Word for applications.',
      to: '/docs/resumes',
      icon: 'i-lucide-file-text',
      label: 'Go to resumes'
    })

    steps.push({
      title: 'Review experience & skills',
      description: 'Keep your experience and skills up to date so your resume and applications stay strong and relevant.',
      to: '/profile/experience',
      icon: 'i-lucide-briefcase',
      label: 'Edit profile'
    })
  }

  return steps
})

const quotes = [
  'The only way to do great work is to love what you do.',
  'Your career is a journey, not a destination. Enjoy the steps.',
  'Every application is a chance to learn. Keep going.',
  'The right role is out there. Stay curious and keep applying.',
  'Small steps every day add up to big career moves.',
  'You are one yes away from a completely different path.',
  'Progress over perfection. Your next draft is your best draft.',
  'Your experience matters. Tell your story with confidence.'
]

const quoteOfTheDay = computed(() => {
  const start = new Date(new Date().getFullYear(), 0, 0)
  const now = new Date()
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return quotes[dayOfYear % quotes.length]
})

const items = [[{
  label: 'New mail',
  icon: 'i-lucide-send',
  to: '/inbox'
}, {
  label: 'New customer',
  icon: 'i-lucide-user-plus',
  to: '/customers'
}]] satisfies DropdownMenuItem[][]
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Home" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>

        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-6 lg:gap-8 w-full max-w-3xl mx-auto">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome, {{ displayName }}!
          </h1>
          <p class="mt-1 text-gray-600 dark:text-gray-400">
            Here are some next steps to get the most out of your job search.
          </p>
        </div>

        <UCard variant="subtle" class="border-l-4 border-l-primary">
          <div class="flex gap-3">
            <UIcon name="i-lucide-quote" class="size-6 shrink-0 text-primary/70" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Quote of the day
              </p>
              <p class="text-gray-900 dark:text-white italic">
                "{{ quoteOfTheDay }}"
              </p>
            </div>
          </div>
        </UCard>

        <section>
          <h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Next steps
          </h2>
          <ul class="flex flex-col gap-4">
            <li v-for="(step, i) in nextSteps" :key="i">
              <UCard variant="subtle" class="overflow-hidden">
                <div class="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div class="flex shrink-0 w-10 h-10 rounded-lg bg-primary/10 items-center justify-center">
                    <UIcon :name="step.icon" class="size-5 text-primary" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <h3 class="font-semibold text-gray-900 dark:text-white">
                      {{ step.title }}
                    </h3>
                    <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {{ step.description }}
                    </p>
                    <UButton
                      :to="step.to"
                      variant="soft"
                      color="primary"
                      size="sm"
                      class="mt-3 w-fit"
                      :trailing-icon="'i-lucide-arrow-right'"
                    >
                      {{ step.label }}
                    </UButton>
                  </div>
                </div>
              </UCard>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </UDashboardPanel>
</template>
