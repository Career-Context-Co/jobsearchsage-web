/**
 * GET /api/profile/education
 * 
 * Mock endpoint that returns all education entries for the user's profile.
 * In production, this will fetch from the database.
 */

const mockEducation = [
  {
    id: 'edu-001',
    profile_id: 'profile-uuid-001',
    degree_type: 'Bachelor of Science',
    area_of_study: 'Computer Science',
    institution: 'Stanford University',
    start_date: '2012-09-01',
    end_date: '2016-06-15',
    completed: true,
    url: 'https://www.stanford.edu',
    credit_hours: 180,
    coursework: [
      'Data Structures and Algorithms',
      'Machine Learning',
      'Database Systems',
      'Computer Networks'
    ],
    minors: ['Mathematics', 'Business Administration'],
    display_order: 0,
    created_at: '2025-01-15T10:38:00.000Z',
    updated_at: '2025-01-15T10:38:00.000Z'
  },
  {
    id: 'edu-002',
    profile_id: 'profile-uuid-001',
    degree_type: 'Master of Science',
    area_of_study: 'Software Engineering',
    institution: 'MIT',
    start_date: '2019-09-01',
    end_date: '2021-05-15',
    completed: true,
    url: 'https://www.mit.edu',
    credit_hours: 60,
    coursework: [
      'Advanced Algorithms',
      'Distributed Systems',
      'Cloud Computing Architecture'
    ],
    minors: [],
    display_order: 1,
    created_at: '2025-01-15T10:39:00.000Z',
    updated_at: '2025-01-15T10:39:00.000Z'
  }
]

export default eventHandler(async () => {
  return {
    success: true,
    data: mockEducation
  }
})

