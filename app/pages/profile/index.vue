<script setup lang="ts">
const { isNotificationsSlideoverOpen } = useDashboard()
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
          Profile content will be added here.
        </p>
      </div>
    </template>
  </UDashboardPanel>
</template>
