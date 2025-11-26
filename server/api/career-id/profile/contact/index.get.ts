/**
 * GET /api/profile/contact
 * 
 * Mock endpoint that returns contact information for the user's profile.
 * In production, this will fetch from the database.
 */

const mockContactInfo = {
  id: 'contact-001',
  profile_id: 'profile-uuid-001',
  first_name: 'Jane',
  last_name: 'Doe',
  job_title: 'Senior Software Engineer',
  email: 'jane.doe@example.com',
  phone: '+14155552671',
  linkedin: 'https://linkedin.com/in/janedoe',
  websites: ['https://janedoe.dev', 'https://github.com/janedoe'],
  summary: 'Experienced software engineer with 8+ years building scalable web applications and cloud infrastructure. Passionate about clean code, system design, and mentoring junior developers.',
  city: 'San Francisco',
  state_region: 'California',
  country: 'United States',
  postal_code: '94102',
  willing_to_relocate: false,
  created_at: '2025-01-15T10:32:00.000Z',
  updated_at: '2025-01-15T14:45:00.000Z'
}

export default eventHandler(async () => {
  return {
    success: true,
    data: mockContactInfo
  }
})

