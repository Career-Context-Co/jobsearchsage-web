/**
 * GET /api/profile/certifications
 * 
 * Mock endpoint that returns all certifications for the user's profile.
 * In production, this will fetch from the database.
 */

const mockCertifications = [
  {
    id: 'cert-001',
    profile_id: 'profile-uuid-001',
    name: 'AWS Solutions Architect - Professional',
    issuer: 'Amazon Web Services',
    date: '2023-06-15',
    url: 'https://aws.amazon.com/certification/certified-solutions-architect-professional/',
    display_order: 0,
    created_at: '2025-01-15T10:40:00.000Z',
    updated_at: '2025-01-15T10:40:00.000Z'
  },
  {
    id: 'cert-002',
    profile_id: 'profile-uuid-001',
    name: 'Certified Kubernetes Administrator (CKA)',
    issuer: 'Cloud Native Computing Foundation',
    date: '2022-11-20',
    url: 'https://www.cncf.io/certification/cka/',
    display_order: 1,
    created_at: '2025-01-15T10:41:00.000Z',
    updated_at: '2025-01-15T10:41:00.000Z'
  },
  {
    id: 'cert-003',
    profile_id: 'profile-uuid-001',
    name: 'Professional Scrum Master I (PSM I)',
    issuer: 'Scrum.org',
    date: '2021-03-10',
    url: 'https://www.scrum.org/professional-scrum-master-i-certification',
    display_order: 2,
    created_at: '2025-01-15T10:42:00.000Z',
    updated_at: '2025-01-15T10:42:00.000Z'
  }
]

export default eventHandler(async () => {
  return {
    success: true,
    data: mockCertifications
  }
})

