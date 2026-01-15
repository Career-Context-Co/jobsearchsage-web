<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  sessionId?: string
  profileId?: string
}

interface CapturedMoment {
  id: string
  title: string
  rawNotes: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface UIMessage {
  id: string
  role: 'user' | 'assistant'
  parts: Array<{ type: 'text'; text: string }>
}

withDefaults(defineProps<Props>(), {
  sessionId: '',
  profileId: ''
})

const emit = defineEmits<{
  close: []
  momentCaptured: [moment: CapturedMoment]
  sessionEnded: []
}>()

// Mock chat state
const userMessage = ref('')
const isLoading = ref(false)

// Mock captured moments (dummy data)
const capturedMoments = ref<CapturedMoment[]>([
  {
    id: '1',
    title: 'Led successful product launch',
    rawNotes: 'Coordinated cross-functional team to deliver new feature ahead of schedule.'
  },
  {
    id: '2',
    title: 'Mentored junior developer',
    rawNotes: 'Provided guidance and code reviews for new team member.'
  }
])

// Mock conversation history (dummy data)
const conversationHistory = ref<ChatMessage[]>([
  {
    role: 'assistant',
    content: 'Hi there! I\'m here to help you discover and capture your achievement moments. Let\'s start by talking about a time when you successfully led a project or initiative. What was the challenge and how did you overcome it?'
  },
  {
    role: 'user',
    content: 'Well, I led a product launch last year. We had a tight deadline and a small team. I coordinated everyone\'s efforts and we shipped on time.'
  },
  {
    role: 'assistant',
    content: 'That sounds great! Tell me more about the impact. What was the result of shipping on time? Did it have any business or user impact?'
  }
])

// Convert messages to UI format for Nuxt UI chat components
const messages = computed<UIMessage[]>(() =>
  conversationHistory.value.map((msg, index) => ({
    id: `msg-${index}`,
    role: msg.role,
    parts: [{ type: 'text', text: msg.content }]
  }))
)

// Chat status for Nuxt UI components
const chatStatus = computed<'ready' | 'submitted' | 'streaming' | 'error'>(() => {
  if (isLoading.value) return 'streaming'
  return 'ready'
})

function handleSendMessage(event?: Event) {
  if (event) {
    event.preventDefault()
  }
  
  if (!userMessage.value.trim()) return

  // Add user message
  conversationHistory.value.push({
    role: 'user',
    content: userMessage.value
  })

  const tempMessage = userMessage.value
  userMessage.value = ''
  isLoading.value = true

  // Simulate API delay
  setTimeout(() => {
    // Add AI response (mock)
    conversationHistory.value.push({
      role: 'assistant',
      content: 'That\'s excellent! I can see how that demonstrates strong leadership. Based on what you\'ve shared, I\'ve captured this achievement. Would you like to tell me about another achievement?'
    })

    // Simulate moment capture
    if (tempMessage.includes('led') || tempMessage.includes('team')) {
      const newMoment: CapturedMoment = {
        id: Date.now().toString(),
        title: 'Achievement from conversation',
        rawNotes: tempMessage
      }
      capturedMoments.value.push(newMoment)
      emit('momentCaptured', newMoment)
    }

    isLoading.value = false
  }, 800)
}

function handleEndSession() {
  emit('sessionEnded')
  emit('close')
}
</script>

<template>
  <div class="h-full w-full flex flex-col">
    <!-- Header: Title + Close Button -->
    <div class="flex items-start justify-between pb-4">
      <div class="flex-1">
        <h2 class="text-lg font-semibold mb-2">Discovery Session</h2>
        <p class="text-sm text-muted">Share your achievement stories and capture key moments</p>
      </div>
      <UButton
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        size="sm"
        class="cursor-pointer shrink-0 ml-4"
        @click="emit('close')"
      />
    </div>

    <!-- Body: Scrollable Content -->
    <div class="flex-1 overflow-y-auto space-y-6">
      <!-- Info Banner -->
      <div class="bg-base border border-default rounded-lg p-4">
        <div class="flex gap-3">
          <UIcon name="i-lucide-sparkles" class="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
          <div class="text-sm text-foreground">
            <p class="font-medium mb-1">Discovery Session in Progress</p>
            <p class="text-muted text-xs">Share your achievement stories and we'll capture key moments. You can refine them later or develop them into full HERO stories.</p>
          </div>
        </div>
      </div>

      <!-- Captured Moments Section -->
      <div class="space-y-3">
        <!-- Moments Header -->
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
            <UIcon name="i-lucide-sparkles" class="w-5 h-5 text-teal-500" />
            Captured Moments
          </h3>
          <span class="text-xs text-muted">{{ capturedMoments.length }} captured</span>
        </div>

        <!-- Moments Display -->
        <div v-if="capturedMoments.length > 0" class="border-2 border-teal-500 bg-teal-500/10 p-4 rounded-lg">
          <ul class="space-y-2">
            <li
              v-for="(moment, index) in capturedMoments"
              :key="moment.id"
              class="flex gap-2 text-sm text-foreground items-start"
            >
              <span class="text-teal-500 text-2xl">•</span>
              <div>  
                <p class="font-medium">{{ moment.title }}</p>
                <p class="text-xs text-muted mt-1">{{ moment.rawNotes }}</p>
              </div>
            </li>
          </ul>
        </div>
        <div v-else class="flex items-start gap-3 border-2 border-teal-500 bg-teal-500/10 p-4 rounded-lg">
          <UIcon name="i-lucide-lightbulb" class="w-4 h-4 text-muted shrink-0 mt-0.5" />
          <div class="text-sm text-muted">
            <p class="font-medium mb-1">No moments captured yet</p>
            <p class="text-xs">Share your achievements in the chat below and we'll capture them.</p>
          </div>
        </div>
      </div>

      <!-- Chat Section -->
      <div class="flex-1 flex flex-col min-h-[400px]">
        <UChatMessages
          :messages="messages"
          :status="chatStatus"
          :should-auto-scroll="true"
          :assistant="{
            icon: 'i-lucide-sparkles',
            variant: 'naked',
            side: 'left'
          }"
          :user="{
            variant: 'soft',
            side: 'right'
          }"
          class="flex-1 min-h-0"
        >
          <template #content="{ message }">
            <p class="text-sm whitespace-pre-wrap">{{ message.parts[0]?.text }}</p>
          </template>
        </UChatMessages>
      </div>
    </div>

    <!-- Footer: Chat Input -->
    <div class=" flex items-center justify-between">
      <UChatPrompt
        v-model="userMessage"
        placeholder="Share more about your achievement here..."
        variant="subtle"
        :disabled="isLoading"
        @submit="handleSendMessage"
      >
        <UChatPromptSubmit 
          :status="chatStatus" 
          icon="i-lucide-send"
          color="primary"
          variant="ghost"
          @click="handleSendMessage"
        />
      </UChatPrompt>
    </div>
  </div>
</template>
