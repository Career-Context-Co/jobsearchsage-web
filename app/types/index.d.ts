import type { AvatarProps } from '@nuxt/ui'

export type UserStatus = 'subscribed' | 'unsubscribed' | 'bounced'
export type SaleStatus = 'paid' | 'failed' | 'refunded'

export interface User {
  id: number
  name: string
  email: string
  avatar?: AvatarProps
  status: UserStatus
  location: string
}

export interface Mail {
  id: number
  unread?: boolean
  from: User
  subject: string
  body: string
  date: string
}

export interface Member {
  name: string
  username: string
  role: 'member' | 'owner'
  avatar: AvatarProps
}

export interface Stat {
  title: string
  icon: string
  value: number | string
  variation: number
  formatter?: (value: number) => string
}

export interface Sale {
  id: string
  date: string
  status: SaleStatus
  email: string
  amount: number
}

export interface Notification {
  id: number
  unread?: boolean
  sender: User
  body: string
  date: string
}

export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}

// Profile Builder Types

export interface ContactInfo {
  firstName: string
  lastName: string
  jobTitle: string
  email: string
  phone: string
  linkedin: string
  websites: string[]
  summary: string
  city: string
  stateRegion: string
  country: string
  postalCode: string
  willingToRelocate: boolean
}

export interface WorkExperience {
  company: string
  title: string
  location?: string
  url?: string
  startDate: string
  endDate?: string
  currentPosition: boolean
  summary?: string
  highlights: string[]
  isEditing: boolean
}

export interface Education {
  degreeType: string
  areaOfStudy: string
  institution: string
  startDate: string
  endDate: string
  completed: boolean
  url?: string
  creditHours?: number
  coursework: string[]
  minors: string[]
  isEditing: boolean
}

export interface Certification {
  name: string
  issuer: string
  date: string
  url?: string
  isEditing: boolean
}

export interface SkillCategory {
  name: string
  description: string
  skills: string[]
  isEditing: boolean
}

export interface ProfileData {
  contactInfo: ContactInfo
  workExperiences: WorkExperience[]
  education: Education[]
  certifications: Certification[]
  skillCategories: SkillCategory[]
}
