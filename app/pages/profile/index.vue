<script setup lang="ts">
const { isNotificationsSlideoverOpen: _isNotificationsSlideoverOpen } = useDashboard()

const careerIDStore = useCareerIDStore()

const profile = careerIDStore.profile

onMounted(async () => {
  if (!careerIDStore.isProfileLoaded) {
    await careerIDStore.fetchProfile('prof_myf2i85se9xri4e4wgsxxim7')
  } else {
    console.log('Profile already loaded')
  }
})
</script>

<template>
  <UDashboardPanel id="profile">
    <template #header>
      <UDashboardNavbar title="Profile">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="p-4">
        <p class="text-muted">
          {{ careerIDStore.profile }}
        </p>
      </div>
    </template>
  </UDashboardPanel>
</template>
