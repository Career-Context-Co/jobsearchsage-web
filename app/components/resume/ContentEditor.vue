<script setup lang="ts">
// Mock data for prototyping
const mockData = {
  professionalSummary: {
    text: 'Experienced software engineer with 5+ years of building scalable web applications and leading cross-functional teams.'
  },
  workExperience: [
    {
      id: 'exp1',
      employer: 'Tech Corp',
      jobTitle: 'Senior Software Engineer',
      employmentType: 'Full-time',
      locationType: 'Remote',
      startDate: '2021-01',
      endDate: '2023-12',
      highlights: [
        { id: 'h1', text: 'Led migration of monolithic application to microservices architecture, reducing deployment time by 60%' },
        { id: 'h2', text: 'Mentored team of 5 junior developers, improving code quality and review processes' },
        { id: 'h3', text: 'Implemented CI/CD pipeline using GitHub Actions, reducing time-to-production by 40%' }
      ]
    },
    {
      id: 'exp2',
      employer: 'StartupXYZ',
      jobTitle: 'Full Stack Developer',
      employmentType: 'Full-time',
      locationType: 'On-site',
      startDate: '2019-06',
      endDate: '2021-01',
      highlights: [
        { id: 'h4', text: 'Built RESTful APIs serving 1M+ requests daily using Node.js and PostgreSQL' },
        { id: 'h5', text: 'Developed responsive web application using Vue.js and TypeScript' }
      ]
    }
  ],
  education: [
    {
      id: 'edu1',
      institution: 'University of Technology',
      degree: 'Bachelor of Science',
      areaOfStudy: 'Computer Science',
      startDate: '2015-09',
      endDate: '2019-05'
    }
  ],
  skills: [
    { id: 's1', name: 'JavaScript' },
    { id: 's2', name: 'TypeScript' },
    { id: 's3', name: 'Vue.js' },
    { id: 's4', name: 'Node.js' },
    { id: 's5', name: 'PostgreSQL' },
    { id: 's6', name: 'Docker' },
    { id: 's7', name: 'AWS' },
    { id: 's8', name: 'CI/CD' }
  ],
  certifications: [
    {
      id: 'cert1',
      name: 'AWS Certified Solutions Architect',
      issuer: 'Amazon Web Services',
      issueDate: '2022-03'
    },
    {
      id: 'cert2',
      name: 'Professional Scrum Master I',
      issuer: 'Scrum.org',
      issueDate: '2020-11'
    }
  ]
}

// Section checkboxes
const summaryEnabled = ref(true)
const workExperienceEnabled = ref(true)
const educationEnabled = ref(true)
const skillsEnabled = ref(true)
const certificationsEnabled = ref(true)

// Individual item selections (all start checked)
const selectedExperiences = ref<Set<string>>(new Set(mockData.workExperience.map(exp => exp.id)))
const selectedHighlights = ref<Set<string>>(
  new Set(mockData.workExperience.flatMap(exp => exp.highlights.map(h => h.id)))
)
const selectedEducation = ref<Set<string>>(new Set(mockData.education.map(edu => edu.id)))
const selectedSkills = ref<Set<string>>(new Set(mockData.skills.map(skill => skill.id)))
const selectedCertifications = ref<Set<string>>(new Set(mockData.certifications.map(cert => cert.id)))

// Accordion state
const openSections = ref([0]) // Professional Summary open by default

// Section toggle handlers
function toggleSection(section: 'summary' | 'workExperience' | 'education' | 'skills' | 'certifications') {
  switch (section) {
    case 'summary':
      summaryEnabled.value = !summaryEnabled.value
      break
    case 'workExperience':
      workExperienceEnabled.value = !workExperienceEnabled.value
      if (workExperienceEnabled.value) {
        // Check all
        mockData.workExperience.forEach(exp => selectedExperiences.value.add(exp.id))
        mockData.workExperience.forEach(exp => 
          exp.highlights.forEach(h => selectedHighlights.value.add(h.id))
        )
      } else {
        // Uncheck all
        selectedExperiences.value.clear()
        selectedHighlights.value.clear()
      }
      break
    case 'education':
      educationEnabled.value = !educationEnabled.value
      if (educationEnabled.value) {
        mockData.education.forEach(edu => selectedEducation.value.add(edu.id))
      } else {
        selectedEducation.value.clear()
      }
      break
    case 'skills':
      skillsEnabled.value = !skillsEnabled.value
      if (skillsEnabled.value) {
        mockData.skills.forEach(skill => selectedSkills.value.add(skill.id))
      } else {
        selectedSkills.value.clear()
      }
      break
    case 'certifications':
      certificationsEnabled.value = !certificationsEnabled.value
      if (certificationsEnabled.value) {
        mockData.certifications.forEach(cert => selectedCertifications.value.add(cert.id))
      } else {
        selectedCertifications.value.clear()
      }
      break
  }
}

// Format date range
function formatDateRange(startDate: string, endDate: string | null) {
  const start = new Date(startDate + '-01')
  const startFormatted = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  
  if (!endDate) return `${startFormatted} - Present`
  
  const end = new Date(endDate + '-01')
  const endFormatted = end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  return `${startFormatted} - ${endFormatted}`
}

const accordionItems = computed(() => [
  {
    label: 'Professional Summary',
    icon: 'i-lucide-text-cursor-input',
    defaultOpen: false,
    content: 'summary'
  },
  {
    label: 'Work Experience',
    icon: 'i-lucide-briefcase',
    defaultOpen: false,
    content: 'workExperience'
  },
  {
    label: 'Education',
    icon: 'i-lucide-graduation-cap',
    defaultOpen: false,
    content: 'education'
  },
  {
    label: 'Skills',
    icon: 'i-lucide-lightbulb',
    defaultOpen: false,
    content: 'skills'
  },
  {
    label: 'Certifications',
    icon: 'i-lucide-award',
    defaultOpen: false,
    content: 'certifications'
  }
])
</script>

<template>
  <div class="space-y-4">
    <div>
      <h2 class="text-lg font-semibold mb-1">Content Selection</h2>
      <p class="text-sm text-muted">Choose what to include in your resume</p>
    </div>

    <UAccordion
      :items="accordionItems"
      multiple
    >
      <!-- Professional Summary Section -->
      <template #summary>
        <div class="flex items-start gap-3 py-2">
          <UCheckbox
            v-model="summaryEnabled"
            @click.stop
            @change="toggleSection('summary')"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm text-muted whitespace-pre-wrap">{{ mockData.professionalSummary.text }}</p>
          </div>
        </div>
      </template>

      <!-- Work Experience Section -->
      <template #workExperience>
        <div class="space-y-4">
          <div class="flex items-center gap-2 mb-3">
            <UCheckbox
              v-model="workExperienceEnabled"
              @click.stop
              @change="toggleSection('workExperience')"
            />
            <span class="text-sm font-medium">Include all work experience</span>
          </div>

          <div
            v-for="exp in mockData.workExperience"
            :key="exp.id"
            class="pl-6 border-l-2 border-default space-y-2"
          >
            <div class="flex items-start gap-3">
              <UCheckbox
                :model-value="selectedExperiences.has(exp.id)"
                @update:model-value="(val) => {
                  if (val) {
                    selectedExperiences.add(exp.id)
                    exp.highlights.forEach(h => selectedHighlights.add(h.id))
                  } else {
                    selectedExperiences.delete(exp.id)
                    exp.highlights.forEach(h => selectedHighlights.delete(h.id))
                  }
                }"
                @click.stop
              />
              <div class="flex-1 min-w-0">
                <p class="font-medium">{{ exp.jobTitle }}</p>
                <p class="text-sm text-muted">{{ exp.employer }}</p>
                <p class="text-xs text-muted mt-1">
                  {{ exp.employmentType }} • {{ exp.locationType }} • {{ formatDateRange(exp.startDate, exp.endDate) }}
                </p>
              </div>
            </div>

            <!-- Highlights/Bullets -->
            <div class="pl-6 space-y-2">
              <div
                v-for="highlight in exp.highlights"
                :key="highlight.id"
                class="flex items-start gap-3"
              >
                <UCheckbox
                  :model-value="selectedHighlights.has(highlight.id)"
                  @update:model-value="(val) => {
                    if (val) {
                      selectedHighlights.add(highlight.id)
                    } else {
                      selectedHighlights.delete(highlight.id)
                    }
                  }"
                  @click.stop
                />
                <p class="text-sm flex-1">{{ highlight.text }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Education Section -->
      <template #education>
        <div class="space-y-3">
          <div class="flex items-center gap-2 mb-3">
            <UCheckbox
              v-model="educationEnabled"
              @click.stop
              @change="toggleSection('education')"
            />
            <span class="text-sm font-medium">Include all education</span>
          </div>

          <div
            v-for="edu in mockData.education"
            :key="edu.id"
            class="pl-6 flex items-start gap-3"
          >
            <UCheckbox
              :model-value="selectedEducation.has(edu.id)"
              @update:model-value="(val) => {
                if (val) selectedEducation.add(edu.id)
                else selectedEducation.delete(edu.id)
              }"
              @click.stop
            />
            <div class="flex-1 min-w-0">
              <p class="font-medium">{{ edu.institution }}</p>
              <p class="text-sm text-muted">{{ edu.degree }} in {{ edu.areaOfStudy }}</p>
              <p class="text-xs text-muted mt-1">{{ formatDateRange(edu.startDate, edu.endDate) }}</p>
            </div>
          </div>
        </div>
      </template>

      <!-- Skills Section -->
      <template #skills>
        <div class="space-y-3">
          <div class="flex items-center gap-2 mb-3">
            <UCheckbox
              v-model="skillsEnabled"
              @click.stop
              @change="toggleSection('skills')"
            />
            <span class="text-sm font-medium">Include all skills</span>
          </div>

          <div class="pl-6 grid grid-cols-2 gap-2">
            <div
              v-for="skill in mockData.skills"
              :key="skill.id"
              class="flex items-center gap-2"
            >
              <UCheckbox
                :model-value="selectedSkills.has(skill.id)"
                @update:model-value="(val) => {
                  if (val) selectedSkills.add(skill.id)
                  else selectedSkills.delete(skill.id)
                }"
                @click.stop
              />
              <span class="text-sm">{{ skill.name }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- Certifications Section -->
      <template #certifications>
        <div class="space-y-3">
          <div class="flex items-center gap-2 mb-3">
            <UCheckbox
              v-model="certificationsEnabled"
              @click.stop
              @change="toggleSection('certifications')"
            />
            <span class="text-sm font-medium">Include all certifications</span>
          </div>

          <div
            v-for="cert in mockData.certifications"
            :key="cert.id"
            class="pl-6 flex items-start gap-3"
          >
            <UCheckbox
              :model-value="selectedCertifications.has(cert.id)"
              @update:model-value="(val) => {
                if (val) selectedCertifications.add(cert.id)
                else selectedCertifications.delete(cert.id)
              }"
              @click.stop
            />
            <div class="flex-1 min-w-0">
              <p class="font-medium">{{ cert.name }}</p>
              <p class="text-sm text-muted">{{ cert.issuer }}</p>
              <p class="text-xs text-muted mt-1">Issued {{ new Date(cert.issueDate + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) }}</p>
            </div>
          </div>
        </div>
      </template>
    </UAccordion>
  </div>
</template>
