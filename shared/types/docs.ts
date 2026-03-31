export interface ResumeDesignSettings {
  accentColor?: string
}

export interface ResumeContentSummary {
  text: string
  enabled: boolean
}

export interface ResumeContentHighlight {
  id: string
  text: string
  selected: boolean
}

export interface ResumeContentWorkExperienceItem {
  id: string | number
  employer: string
  jobTitle: string
  employmentType: string
  locationType: string
  startDate: string | null | undefined
  endDate: string | null | undefined
  currentPosition?: boolean
  highlights: ResumeContentHighlight[]
  selected: boolean
}

export interface ResumeContentEducationItem {
  id: string | number
  institution: string
  degree: string
  areaOfStudy: string
  startDate: string | null | undefined
  endDate: string | null | undefined
  selected: boolean
}

export interface ResumeContentSkillItem {
  id: string | number
  name: string
  group?: string
  selected: boolean
}

export interface ResumeContentCertificationItem {
  id: string | number
  name: string
  issuer: string
  issueDate: string
  selected: boolean
}

export interface ResumeContent {
  summary: ResumeContentSummary
  workExperience: ResumeContentWorkExperienceItem[]
  education: ResumeContentEducationItem[]
  skills: ResumeContentSkillItem[]
  certifications: ResumeContentCertificationItem[]
}

export interface ResumeListItem {
  id: string
  title: string
  createdAt?: string
  updatedAt: string
  content?: ResumeContent
  designSettings?: ResumeDesignSettings
}

