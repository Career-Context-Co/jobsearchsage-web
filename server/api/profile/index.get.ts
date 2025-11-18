/**
 * GET /api/profile
 * 
 * Mock endpoint that returns a complete profile with sample data.
 * In production, this will fetch the authenticated user's profile from the database.
 */

const mockProfileData = {
  profile: {
    id: 'profile-uuid-001',
    user_id: 'user-uuid-001',
    created_at: '2025-01-15T10:30:00.000Z',
    updated_at: '2025-01-15T14:45:00.000Z',
    completion_status: 'complete'
  },
  work_experiences: [
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
      summary: 'Built core features for a B2B SaaS platform using React, Node.js, and PostgreSQL. Worked directly with founders to define product roadmap.',
      highlights: [
        'Developed customer-facing dashboard used by 500+ businesses',
        'Implemented real-time collaboration features using WebSockets',
        'Reduced bug count by 40% through comprehensive testing strategy',
        'Contributed to growth from 50 to 500 customers during tenure'
      ],
      display_order: 1,
      created_at: '2025-01-15T10:36:00.000Z',
      updated_at: '2025-01-15T10:36:00.000Z'
    },
    {
      id: 'work-exp-003',
      profile_id: 'profile-uuid-001',
      company: 'Digital Agency Co.',
      title: 'Junior Developer',
      location: 'New York, NY',
      url: null,
      start_date: '2016-07-01',
      end_date: '2018-02-28',
      current_position: false,
      summary: 'Developed client websites and web applications. Collaborated with designers and project managers to deliver high-quality solutions.',
      highlights: [
        'Built 20+ responsive websites for clients in various industries',
        'Improved site performance scores from 60 to 95+ on Google PageSpeed',
        'Implemented custom WordPress themes and plugins'
      ],
      display_order: 2,
      created_at: '2025-01-15T10:37:00.000Z',
      updated_at: '2025-01-15T10:37:00.000Z'
    }
  ],
  education: [
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
        'Computer Networks',
        'Software Engineering',
        'Artificial Intelligence'
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
        'Cloud Computing Architecture',
        'System Design and Scalability'
      ],
      minors: [],
      display_order: 1,
      created_at: '2025-01-15T10:39:00.000Z',
      updated_at: '2025-01-15T10:39:00.000Z'
    }
  ],
  certifications: [
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
  ],
  skill_categories: [
    {
      id: 'skill-cat-001',
      profile_id: 'profile-uuid-001',
      name: 'Programming Languages',
      description: 'Languages I use daily in production',
      skills: ['TypeScript', 'Python', 'Go', 'JavaScript', 'SQL'],
      display_order: 0,
      created_at: '2025-01-15T10:43:00.000Z',
      updated_at: '2025-01-15T10:43:00.000Z'
    }
  ],
  contact_info: {
    id: 'contact-001',
    profile_id: 'profile-uuid-001',
    first_name: 'Jane',
    last_name: 'Doe',
    job_title: 'Senior Software Engineer',
    email: 'jane.doe@example.com',
    phone: '+14155552671',
    linkedin: 'https://linkedin.com/in/janedoe',
    websites: ['https://janedoe.dev', 'https://github.com/janedoe', 'https://twitter.com/janedoe'],
    summary: 'Experienced software engineer with 8+ years building scalable web applications and cloud infrastructure. Passionate about clean code, system design, and mentoring junior developers. Strong background in full-stack development, microservices architecture, and DevOps practices. Seeking opportunities to lead technical teams and drive innovation in fast-paced environments.',
    city: 'San Francisco',
    state_region: 'California',
    country: 'United States',
    postal_code: '94102',
    willing_to_relocate: false,
    created_at: '2025-01-15T10:32:00.000Z',
    updated_at: '2025-01-15T14:45:00.000Z'
  }
}

export default eventHandler(async () => {
  return {
    success: true,
    data: mockProfileData
  }
})

