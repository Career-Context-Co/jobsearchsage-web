<script setup lang="ts">
const { isNotificationsSlideoverOpen: _isNotificationsSlideoverOpen } = useDashboard()

const careerIDStore = useCareerIDStore()

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
