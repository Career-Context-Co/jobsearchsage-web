import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  ExternalHyperlink,
  TabStopPosition,
  TabStopType,
  convertInchesToTwip
} from 'docx'

interface ContactInfo {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  phone?: string | null
  city?: string | null
  state?: string | null
}

interface SocialLink {
  platformId: number
  url: string
  platformNameCache?: string
}

interface Highlight {
  id: string
  text: string
  selected: boolean
}

interface WorkExperience {
  id: string | number
  employer: string
  jobTitle: string
  employmentType: string
  locationType: string
  startDate: string | null | undefined
  endDate: string | null | undefined
  currentPosition?: boolean
  highlights: Highlight[]
  selected: boolean
}

interface Education {
  id: string | number
  institution: string
  degree: string
  areaOfStudy: string
  startDate: string | null | undefined
  endDate: string | null | undefined
  selected: boolean
}

interface Skill {
  id: string | number
  name: string
  group?: string
  selected: boolean
}

interface Certification {
  id: string | number
  name: string
  issuer: string
  issueDate: string
  selected: boolean
}

interface SelectedContent {
  summary?: { text: string, enabled: boolean }
  workExperience?: WorkExperience[]
  education?: Education[]
  skills?: Skill[]
  certifications?: Certification[]
}

interface DocxResumeOptions {
  accentColor?: string
  contactInfo?: ContactInfo
  jobTitle?: string
  selectedContent?: SelectedContent
  socialLinks?: SocialLink[]
}

// Font sizes in half-points (docx uses half-points, so 21pt = 42 half-points)
const FONT_SIZES = {
  name: 42, // 21pt
  sectionHeader: 18, // 9pt
  jobTitle: 21, // 10.5pt
  body: 20 // 10pt (slightly larger than PDF's 9.75pt for better readability)
}

// Colors (hex without #)
const COLORS = {
  dark: '111827',
  gray: '374151',
  lightGray: '4b5563',
  ruleGray: 'd1d5db'
}

/**
 * Extract LinkedIn username from full URL
 */
function extractLinkedInUsername(url: string): string {
  if (!url) return ''
  const match = url.match(/linkedin\.com\/in\/([^/?]+)/i)
  return match?.[1] ?? url
}

/**
 * Convert hex color to docx format (remove # if present)
 */
function hexToDocxColor(hex: string): string {
  return hex.replace('#', '')
}

/**
 * Format date from YYYY-MM-DD to display format (e.g., "Jan 2023")
 */
function formatDateForDisplay(dateString: string | null | undefined): string {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function formatDateRange(startDate: string | null | undefined, endDate: string | null | undefined, currentPosition?: boolean): string {
  const startFormatted = formatDateForDisplay(startDate) || 'Unknown'
  
  if (currentPosition || !endDate) {
    return `${startFormatted} - Present`
  }
  
  const endFormatted = formatDateForDisplay(endDate)
  return `${startFormatted} - ${endFormatted}`
}

/**
 * Group skills by their category
 */
function groupSkills(skills: Skill[]): Array<{ group: string, skills: string[] }> {
  const groups: Record<string, string[]> = {}
  
  skills.forEach(skill => {
    const groupName = skill.group || 'Skills'
    if (!groups[groupName]) {
      groups[groupName] = []
    }
    groups[groupName].push(skill.name)
  })
  
  return Object.entries(groups).map(([group, skillNames]) => ({
    group,
    skills: skillNames
  }))
}

/**
 * Create a section header paragraph with accent color and bottom border
 */
function createSectionHeader(title: string, accentColor: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        size: FONT_SIZES.sectionHeader,
        color: hexToDocxColor(accentColor)
      })
    ],
    alignment: AlignmentType.CENTER,
    border: {
      bottom: {
        color: COLORS.ruleGray,
        style: BorderStyle.SINGLE,
        size: 4 // 0.5pt in eighths of a point
      }
    },
    spacing: {
      before: 240, // 12pt
      after: 160 // 8pt
    }
  })
}

/**
 * Create a two-column row with left and right aligned text
 */
function createTwoColumnRow(
  leftText: string,
  rightText: string,
  options: {
    leftBold?: boolean
    leftSize?: number
    rightSize?: number
    leftColor?: string
    rightColor?: string
  } = {}
): Paragraph {
  const {
    leftBold = false,
    leftSize = FONT_SIZES.body,
    rightSize = FONT_SIZES.body,
    leftColor = COLORS.dark,
    rightColor = COLORS.gray
  } = options

  return new Paragraph({
    children: [
      new TextRun({
        text: leftText,
        bold: leftBold,
        size: leftSize,
        color: leftColor
      }),
      new TextRun({
        text: '\t'
      }),
      new TextRun({
        text: rightText,
        size: rightSize,
        color: rightColor
      })
    ],
    tabStops: [
      {
        type: TabStopType.RIGHT,
        position: TabStopPosition.MAX
      }
    ],
    spacing: {
      after: 40 // 2pt
    }
  })
}

/**
 * Create a bullet point paragraph
 */
function createBulletPoint(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        size: FONT_SIZES.body,
        color: COLORS.gray
      })
    ],
    bullet: {
      level: 0
    },
    spacing: {
      after: 60 // 3pt
    },
    indent: {
      left: convertInchesToTwip(0.25),
      hanging: convertInchesToTwip(0.15)
    }
  })
}

export function useDocxResume() {
  const isGenerating = ref(false)

  async function generateDocx(options: DocxResumeOptions): Promise<void> {
    isGenerating.value = true

    try {
      const {
        accentColor = '#0d9488',
        contactInfo = {},
        selectedContent = {},
        socialLinks = []
      } = options

      // Extract LinkedIn username from social links
      const linkedInLink = socialLinks.find(link => link.platformId === 1)
      const linkedInUsername = linkedInLink ? extractLinkedInUsername(linkedInLink.url) : null

      // Filter selected items
      const selectedExperiences = selectedContent.workExperience?.filter(exp => exp.selected) || []
      const selectedEducation = selectedContent.education?.filter(edu => edu.selected) || []
      const selectedSkills = selectedContent.skills?.filter(skill => skill.selected) || []
      const selectedCertifications = selectedContent.certifications?.filter(cert => cert.selected) || []
      const hasSummary = selectedContent.summary?.enabled && selectedContent.summary?.text

      // Build document children (paragraphs)
      const children: Paragraph[] = []

      // === HEADER: Name ===
      const displayFirstName = contactInfo.firstName || 'First'
      const displayLastName = contactInfo.lastName || 'Last'
      const displayEmail = contactInfo.email || 'email@example.com'
      const displayPhone = contactInfo.phone || '(555) 123-4567'

      // Name (centered, bold)
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${displayFirstName} ${displayLastName}`,
              bold: true,
              size: FONT_SIZES.name,
              color: COLORS.dark
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 80 // 4pt
          }
        })
      )

      // Contact info line with clickable links
      const contactChildren: (TextRun | ExternalHyperlink)[] = []
      
      if (displayPhone) {
        const cleanPhone = displayPhone.replace(/[^0-9+]/g, '')
        contactChildren.push(
          new ExternalHyperlink({
            children: [
              new TextRun({
                text: `Phone: ${displayPhone}`,
                size: FONT_SIZES.body,
                color: COLORS.lightGray
              })
            ],
            link: `tel:${cleanPhone}`
          })
        )
      }
      
      if (displayEmail) {
        if (contactChildren.length > 0) {
          contactChildren.push(new TextRun({ text: ' | ', size: FONT_SIZES.body, color: COLORS.lightGray }))
        }
        contactChildren.push(
          new ExternalHyperlink({
            children: [
              new TextRun({
                text: `Email: ${displayEmail}`,
                size: FONT_SIZES.body,
                color: COLORS.lightGray
              })
            ],
            link: `mailto:${displayEmail}`
          })
        )
      }
      
      if (linkedInUsername) {
        if (contactChildren.length > 0) {
          contactChildren.push(new TextRun({ text: ' | ', size: FONT_SIZES.body, color: COLORS.lightGray }))
        }
        contactChildren.push(
          new ExternalHyperlink({
            children: [
              new TextRun({
                text: `LinkedIn: ${linkedInUsername}`,
                size: FONT_SIZES.body,
                color: COLORS.lightGray
              })
            ],
            link: `https://linkedin.com/in/${linkedInUsername}`
          })
        )
      }

      children.push(
        new Paragraph({
          children: contactChildren,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 240 // 12pt
          }
        })
      )

      // === PROFESSIONAL SUMMARY ===
      if (hasSummary) {
        children.push(createSectionHeader('Summary', accentColor))
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: selectedContent.summary!.text,
                size: FONT_SIZES.body,
                color: COLORS.gray
              })
            ],
            spacing: {
              after: 160 // 8pt
            }
          })
        )
      }

      // === WORK EXPERIENCE ===
      if (selectedExperiences.length > 0) {
        children.push(createSectionHeader('Professional Experience', accentColor))

        for (let i = 0; i < selectedExperiences.length; i++) {
          const exp = selectedExperiences[i]

          // Job title and date range
          children.push(
            createTwoColumnRow(
              exp?.jobTitle || '',
              formatDateRange(exp?.startDate, exp?.endDate, exp?.currentPosition),
              { leftBold: true, leftSize: FONT_SIZES.jobTitle }
            )
          )

          // Employer and location type
          children.push(
            createTwoColumnRow(
              exp?.employer || '',
              exp?.locationType || '',
              { leftColor: COLORS.gray }
            )
          )

          // Highlights (bullet points)
          const selectedHighlights = exp?.highlights.filter(h => h.selected) || []
          for (const highlight of selectedHighlights) {
            children.push(createBulletPoint(highlight.text))
          }

          // Spacing between experiences
          if (i < selectedExperiences.length - 1) {
            children.push(
              new Paragraph({
                children: [],
                spacing: { after: 120 } // 6pt
              })
            )
          }
        }
      }

      // === EDUCATION ===
      if (selectedEducation.length > 0) {
        children.push(createSectionHeader('Education', accentColor))

        for (let i = 0; i < selectedEducation.length; i++) {
          const edu = selectedEducation[i]

          // Institution and date range
          children.push(
            createTwoColumnRow(
              edu?.institution || '',
              formatDateRange(edu?.startDate, edu?.endDate),
              { leftBold: true, leftSize: FONT_SIZES.jobTitle }
            )
          )

          // Degree
          let degreeText = edu?.degree || ''
          if (edu?.areaOfStudy) {
            degreeText += ` in ${edu.areaOfStudy}`
          }

          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: degreeText,
                  size: FONT_SIZES.body,
                  color: COLORS.gray
                })
              ],
              spacing: {
                after: i < selectedEducation.length - 1 ? 120 : 80 // 6pt or 4pt
              }
            })
          )
        }
      }

      // === SKILLS ===
      if (selectedSkills.length > 0) {
        children.push(createSectionHeader('Skills', accentColor))

        const groupedSkillsList = groupSkills(selectedSkills)

        for (let i = 0; i < groupedSkillsList.length; i++) {
          const skillGroup = groupedSkillsList[i]

          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${skillGroup?.group}: `,
                  bold: true,
                  size: FONT_SIZES.body,
                  color: COLORS.gray
                }),
                new TextRun({
                  text: skillGroup?.skills.join(', ') || '',
                  size: FONT_SIZES.body,
                  color: COLORS.gray
                })
              ],
              spacing: {
                after: 80 // 4pt
              }
            })
          )
        }
      }

      // === CERTIFICATIONS ===
      if (selectedCertifications.length > 0) {
        children.push(createSectionHeader('Certifications', accentColor))

        for (let i = 0; i < selectedCertifications.length; i++) {
          const cert = selectedCertifications[i]

          // Cert name and date
          const issueDate = formatDateForDisplay(cert?.issueDate)
          children.push(
            createTwoColumnRow(
              cert?.name || '',
              issueDate,
              { leftBold: true, leftSize: FONT_SIZES.jobTitle }
            )
          )

          // Issuer
          if (cert?.issuer) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: cert.issuer,
                    size: FONT_SIZES.body,
                    color: COLORS.gray
                  })
                ],
                spacing: {
                  after: i < selectedCertifications.length - 1 ? 120 : 80 // 6pt or 4pt
                }
              })
            )
          }
        }
      }

      // Create document
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: convertInchesToTwip(0.5),
                  bottom: convertInchesToTwip(0.5),
                  left: convertInchesToTwip(0.5),
                  right: convertInchesToTwip(0.5)
                }
              }
            },
            children
          }
        ]
      })

      // Generate and download
      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = 'resume.docx'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)
    } finally {
      isGenerating.value = false
    }
  }

  return {
    generateDocx,
    isGenerating
  }
}
