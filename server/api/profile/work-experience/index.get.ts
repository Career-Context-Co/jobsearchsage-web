/**
 * GET /api/profile/work-experience
 * 
 * Mock endpoint that returns all work experience entries for the user's profile.
 * In production, this will fetch from the database.
 */

const mockWorkExperiences = [
  {
    id: 'work-exp-001',
    profile_id: 'profile-uuid-001',
    company: 'TechCorp Inc.',
    title: 'Senior Software Engineer',
    location: 'San Francisco, CA',
    url: 'https://techcorp.com',
    start_date: '2020-06-01',
    end_date: null,
    current_position: true,
    summary: 'Leading development of cloud-native applications and microservices architecture. Managing a team of 5 engineers and driving technical strategy for the platform team.',
    highlights: [
      'Architected and implemented a microservices platform serving 2M+ daily active users',
      'Reduced API response times by 60% through caching and query optimization',
      'Mentored 5 junior engineers and conducted technical training sessions',
      'Led migration from monolith to microservices, improving deployment frequency by 10x'
    ],
    display_order: 0,
    created_at: '2025-01-15T10:35:00.000Z',
    updated_at: '2025-01-15T11:20:00.000Z'
  },
  {
    id: 'work-exp-002',
    profile_id: 'profile-uuid-001',
    company: 'StartupXYZ',
    title: 'Full Stack Developer',
    location: 'Remote',
    url: 'https://startupxyz.com',
    start_date: '2018-03-15',
    end_date: '2020-05-31',
    current_position: false,
    summary: 'Built core features for a B2B SaaS platform using React, Node.js, and PostgreSQL.',
    highlights: [
      'Developed customer-facing dashboard used by 500+ businesses',
      'Implemented real-time collaboration features using WebSockets',
      'Reduced bug count by 40% through comprehensive testing strategy'
    ],
    display_order: 1,
    created_at: '2025-01-15T10:36:00.000Z',
    updated_at: '2025-01-15T10:36:00.000Z'
  }
]

export default eventHandler(async () => {
  return {
    success: true,
    data: mockWorkExperiences
  }
})

