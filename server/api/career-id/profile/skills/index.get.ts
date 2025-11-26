/**
 * GET /api/profile/skill-categories
 * 
 * Mock endpoint that returns all skill categories for the user's profile.
 * In production, this will fetch from the database.
 */

const mockSkillCategories = [
  {
    id: 'skill-cat-001',
    profile_id: 'profile-uuid-001',
    name: 'Programming Languages',
    description: 'Languages I use daily in production',
    skills: ['TypeScript', 'Python', 'Go', 'JavaScript', 'SQL'],
    display_order: 0,
    created_at: '2025-01-15T10:43:00.000Z',
    updated_at: '2025-01-15T10:43:00.000Z'
  },
  {
    id: 'skill-cat-002',
    profile_id: 'profile-uuid-001',
    name: 'Frameworks & Libraries',
    description: 'Frontend and backend frameworks',
    skills: ['React', 'Vue.js', 'Nuxt', 'Node.js', 'Express'],
    display_order: 1,
    created_at: '2025-01-15T10:44:00.000Z',
    updated_at: '2025-01-15T10:44:00.000Z'
  },
  {
    id: 'skill-cat-003',
    profile_id: 'profile-uuid-001',
    name: 'Cloud & DevOps',
    description: 'Cloud platforms and infrastructure',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD'],
    display_order: 2,
    created_at: '2025-01-15T10:45:00.000Z',
    updated_at: '2025-01-15T10:45:00.000Z'
  }
]

export default eventHandler(async () => {
  return {
    success: true,
    data: mockSkillCategories
  }
})

