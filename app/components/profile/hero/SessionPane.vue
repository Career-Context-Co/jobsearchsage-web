<script setup lang="ts">
import HeroStorySession from './HeroStorySession.vue'

interface Props {
  storyId: string
  profileId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  accept: [suggestions: Record<string, Record<string, string>>]
}>()

// Handle accept suggestions from HeroStorySession
function handleAcceptSuggestions(section: string, suggestions: Record<string, string>) {
  // Format as section-based suggestions for parent
  const formattedSuggestions: Record<string, Record<string, string>> = {
    [section]: suggestions
  }
  emit('accept', formattedSuggestions)
}
</script>

<template>
  <div class="h-full flex flex-col">
    <HeroStorySession
      :story-id="props.storyId"
      :profile-id="props.profileId"
      @accept-suggestions="handleAcceptSuggestions"
      @close="emit('close')"
    />
  </div>
</template>
