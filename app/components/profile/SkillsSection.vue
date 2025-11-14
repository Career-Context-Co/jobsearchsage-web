<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const schema = z.object({
  skillName: z.string().min(2, 'Skill name is required')
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  skillName: undefined
})

// Sample skills list
const skills = ref<string[]>([])

// Mock skills autocomplete data (will be replaced with API call later)
const availableSkills = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'Rust', 'PHP',
  'React', 'Vue.js', 'Angular', 'Svelte', 'Next.js', 'Nuxt', 'Express.js', 'Node.js',
  'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap', 'Material UI', 'Sass', 'Less',
  'Git', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud', 'CI/CD', 'Jenkins',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Firebase', 'DynamoDB',
  'REST API', 'GraphQL', 'WebSockets', 'Microservices', 'Serverless',
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'NLP',
  'Agile', 'Scrum', 'Jira', 'Project Management', 'Team Leadership'
]

const toast = useToast()

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const skillName = event.data.skillName.trim()
  
  // Check for duplicates
  if (skills.value.includes(skillName)) {
    toast.add({ 
      title: 'Duplicate skill', 
      description: 'This skill has already been added', 
      color: 'warning' 
    })
    return
  }
  
  skills.value.push(skillName)
  toast.add({ 
    title: 'Skill added', 
    description: skillName, 
    color: 'success' 
  })
  
  // Reset form
  state.skillName = undefined
}

function removeSkill(index: number) {
  const removed = skills.value.splice(index, 1)
  toast.add({ title: 'Skill removed', description: removed[0], color: 'neutral' })
}

// Simple autocomplete filter (will be replaced with API call)
const filteredSkills = computed(() => {
  if (!state.skillName || state.skillName.length < 2) return []
  const query = state.skillName.toLowerCase()
  return availableSkills
    .filter(skill => skill.toLowerCase().includes(query) && !skills.value.includes(skill))
    .slice(0, 8)
})

function selectSkill(skill: string) {
  state.skillName = skill
}
</script>

<template>
  <div class="space-y-6">
    <!-- Skills Tags Display -->
    <div v-if="skills.length > 0" class="flex flex-wrap gap-2">
      <UBadge
        v-for="(skill, index) in skills"
        :key="index"
        color="primary"
        variant="subtle"
        size="lg"
        class="group"
      >
        <span>{{ skill }}</span>
        <button
          type="button"
          class="ml-2 hover:text-error transition-colors"
          @click="removeSkill(index)"
        >
          <UIcon name="i-lucide-x" class="w-3 h-3" />
        </button>
      </UBadge>
    </div>

    <div v-else class="text-center py-8 border border-dashed border-border rounded-lg">
      <UIcon name="i-lucide-wrench" class="w-12 h-12 mx-auto text-muted mb-2" />
      <p class="text-sm text-muted">No skills added yet. Start adding your skills below.</p>
    </div>

    <!-- Add New Skill Form -->
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField 
        label="Add Skills" 
        name="skillName" 
        help="Start typing to see suggestions, or add your own"
        required
      >
        <div class="relative">
          <UInput 
            v-model="state.skillName" 
            placeholder="e.g., JavaScript, Python, React, AWS"
            autocomplete="off"
          />
          
          <!-- Autocomplete Suggestions -->
          <div
            v-if="filteredSkills.length > 0"
            class="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-auto"
          >
            <button
              v-for="skill in filteredSkills"
              :key="skill"
              type="button"
              class="w-full text-left px-3 py-2 text-sm hover:bg-elevated transition-colors cursor-pointer"
              @click="selectSkill(skill)"
            >
              {{ skill }}
            </button>
          </div>
        </div>
      </UFormField>

      <div class="flex gap-2 pt-2">
        <UButton
          type="submit"
          leading-icon="i-lucide-plus"
          label="Add Skill"
          color="primary"
        />
      </div>
    </UForm>

    <!-- Helper Text -->
    <div class="bg-info/10 border border-info/20 rounded-lg p-4">
      <div class="flex gap-3">
        <UIcon name="i-lucide-lightbulb" class="w-5 h-5 text-info shrink-0 mt-0.5" />
        <div class="text-sm text-muted">
          <p class="font-medium text-foreground mb-1">Tips for adding skills:</p>
          <ul class="list-disc list-inside space-y-1">
            <li>Include programming languages, frameworks, and tools you're proficient in</li>
            <li>Add both technical skills (e.g., Python, Docker) and soft skills (e.g., Team Leadership)</li>
            <li>Focus on skills that are relevant to your target roles</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

