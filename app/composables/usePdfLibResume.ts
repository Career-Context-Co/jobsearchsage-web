import { PDFDocument, rgb, StandardFonts, PDFString, PDFName } from 'pdf-lib'
import {
  sortCertificationsForResumePreview,
  sortEducationForResumePreview,
  sortWorkExperienceForResumePreview
} from '#shared/utils/resumeDisplayOrder'

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

interface PdfLibResumeOptions {
  accentColor?: string
  headerStyle?: 'classic' | 'bold' | 'minimal'
  contactInfo?: ContactInfo
  jobTitle?: string
  selectedContent?: SelectedContent
  socialLinks?: SocialLink[]
}

// Font sizes in points
const FONT_SIZES = {
  name: 21,
  sectionHeader: 9,
  jobTitle: 10.5,
  body: 9.75
}

// Page layout constants (US Letter: 612 x 792 points)
const PAGE = {
  width: 612,
  height: 792,
  marginTop: 36,
  marginBottom: 36,
  marginLeft: 36,
  marginRight: 36
}

const CONTENT_WIDTH = PAGE.width - PAGE.marginLeft - PAGE.marginRight

/**
 * Extract LinkedIn username from full URL
 * e.g., "https://linkedin.com/in/johndoe" -> "johndoe"
 */
function extractLinkedInUsername(url: string): string {
  if (!url) return ''
  // Handle various LinkedIn URL formats
  const match = url.match(/linkedin\.com\/in\/([^/?]+)/i)
  return match ? match[1] : url
}

/**
 * Convert hex color to RGB values (0-1 range)
 */
function hexToRgb(hex: string): { r: number, g: number, b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    return {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    }
  }
  return { r: 0, g: 0, b: 0 }
}

/**
 * Format date from YYYY-MM-DD to display format (e.g., "01/2023")
 */
function formatDateForDisplay(dateString: string | null | undefined): string {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${month}/${year}`
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
 * Simple text wrapping - splits text into lines that fit within maxWidth
 */
function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const testWidth = font.widthOfTextAtSize(testLine, fontSize)
    
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  
  if (currentLine) {
    lines.push(currentLine)
  }
  
  return lines
}

export function usePdfLibResume() {
  const isGenerating = ref(false)

  async function generatePdf(options: PdfLibResumeOptions): Promise<void> {
    isGenerating.value = true

    try {
      const {
        accentColor = '#0d9488',
        headerStyle = 'classic',
        contactInfo = {},
        selectedContent = {},
        socialLinks = []
      } = options

      // Extract LinkedIn username from social links
      const linkedInLink = socialLinks.find(link => link.platformId === 1)
      const linkedInUsername = linkedInLink ? extractLinkedInUsername(linkedInLink.url) : null

      // Filter selected items (order matches ResumePreview / DOCX)
      const selectedExperiences = sortWorkExperienceForResumePreview(
        selectedContent.workExperience?.filter(exp => exp.selected) || []
      )
      const selectedEducation = sortEducationForResumePreview(
        selectedContent.education?.filter(edu => edu.selected) || []
      )
      const selectedSkills = selectedContent.skills?.filter(skill => skill.selected) || []
      const selectedCertifications = sortCertificationsForResumePreview(
        selectedContent.certifications?.filter(cert => cert.selected) || []
      )
      const hasSummary = selectedContent.summary?.enabled && selectedContent.summary?.text

      // Create PDF document
      const pdfDoc = await PDFDocument.create()
      
      // Embed fonts
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      
      // Add first page
      let page = pdfDoc.addPage([PAGE.width, PAGE.height])
      
      // Colors
      const accentRgb = hexToRgb(accentColor)
      const darkColor = rgb(0.067, 0.094, 0.153) // #111827
      const grayColor = rgb(0.216, 0.255, 0.318) // #374151
      const employerColor = rgb(0.302, 0.302, 0.302) // #4D4D4D - lighter grey for hierarchy
      const lightGrayColor = rgb(0.294, 0.333, 0.388) // #4b5563
      const ruleColor = rgb(0.82, 0.835, 0.855) // #d1d5db

      // Track Y position (PDF coordinates start from bottom)
      let y = PAGE.height - PAGE.marginTop

      // Helper to check if we need a new page
      const checkNewPage = (neededHeight: number) => {
        if (y - neededHeight < PAGE.marginBottom) {
          page = pdfDoc.addPage([PAGE.width, PAGE.height])
          y = PAGE.height - PAGE.marginTop
        }
      }

      // Helper to draw section header — appearance varies by headerStyle
      const drawSectionHeader = (title: string) => {
        checkNewPage(40)
        y -= 12

        const headerText = title.toUpperCase()
        const accentRgbColor = rgb(accentRgb.r, accentRgb.g, accentRgb.b)

        if (headerStyle === 'bold') {
          // Filled accent-color bar with white text — vertically centered
          // capHeight ≈ 72% of font size for Helvetica uppercase letters
          const capHeight = FONT_SIZES.sectionHeader * 0.80
          const vertPad = 5  // equal padding above caps and below baseline
          const barHeight = Math.ceil(capHeight + vertPad * 2)
          // rect bottom = y - vertPad; rect top = y + capHeight + vertPad (centered around baseline)
          page.drawRectangle({
            x: PAGE.marginLeft,
            y: y - vertPad,
            width: CONTENT_WIDTH,
            height: barHeight,
            color: accentRgbColor
          })
          page.drawText(headerText, {
            x: PAGE.marginLeft + 6,
            y,
            size: FONT_SIZES.sectionHeader,
            font: helveticaBold,
            color: rgb(1, 1, 1)
          })
          y -= barHeight + 8
        } else if (headerStyle === 'minimal') {
          // Left-aligned neutral gray text + thin rule below
          page.drawText(headerText, {
            x: PAGE.marginLeft,
            y,
            size: FONT_SIZES.sectionHeader,
            font: helvetica,
            color: rgb(0.216, 0.255, 0.318) // #374151
          })
          y -= 6
          page.drawLine({
            start: { x: PAGE.marginLeft, y },
            end: { x: PAGE.width - PAGE.marginRight, y },
            thickness: 0.5,
            color: ruleColor
          })
          y -= 20
        } else {
          // classic: centered, accent color, rule below
          const headerWidth = helvetica.widthOfTextAtSize(headerText, FONT_SIZES.sectionHeader)
          const centerX = PAGE.marginLeft + (CONTENT_WIDTH - headerWidth) / 2
          page.drawText(headerText, {
            x: centerX,
            y,
            size: FONT_SIZES.sectionHeader,
            font: helvetica,
            color: accentRgbColor
          })
          y -= 6
          page.drawLine({
            start: { x: PAGE.marginLeft, y },
            end: { x: PAGE.width - PAGE.marginRight, y },
            thickness: 0.5,
            color: ruleColor
          })
          y -= 20
        }
      }

      // === HEADER: Name and Contact ===
      const displayFirstName = contactInfo.firstName || 'First'
      const displayLastName = contactInfo.lastName || 'Last'
      const displayEmail = contactInfo.email || 'email@example.com'
      const displayPhone = contactInfo.phone || '(555) 123-4567'

      // Name (centered, bold)
      const fullName = `${displayFirstName} ${displayLastName}`
      const nameWidth = helveticaBold.widthOfTextAtSize(fullName, FONT_SIZES.name)
      
      page.drawText(fullName, {
        x: PAGE.marginLeft + (CONTENT_WIDTH - nameWidth) / 2,
        y,
        size: FONT_SIZES.name,
        font: helveticaBold,
        color: darkColor
      })
      
      y -= FONT_SIZES.name + 6

      // Contact info line (centered) with clickable links
      // Build contact parts with their URLs for linking
      const contactItems: Array<{ text: string, url?: string }> = []
      if (displayPhone) {
        const cleanPhone = displayPhone.replace(/[^0-9+]/g, '')
        contactItems.push({ text: `Phone: ${displayPhone}`, url: `tel:${cleanPhone}` })
      }
      if (displayEmail) {
        contactItems.push({ text: `Email: ${displayEmail}`, url: `mailto:${displayEmail}` })
      }
      if (linkedInUsername) {
        contactItems.push({ text: `LinkedIn: ${linkedInUsername}`, url: `https://linkedin.com/in/${linkedInUsername}` })
      }
      
      // Calculate total width including separators
      const separator = ' | '
      const separatorWidth = helvetica.widthOfTextAtSize(separator, FONT_SIZES.body)
      let totalWidth = 0
      contactItems.forEach((item, i) => {
        totalWidth += helvetica.widthOfTextAtSize(item.text, FONT_SIZES.body)
        if (i < contactItems.length - 1) totalWidth += separatorWidth
      })
      
      // Draw each part and collect link annotations
      let currentX = PAGE.marginLeft + (CONTENT_WIDTH - totalWidth) / 2
      const linkHeight = FONT_SIZES.body + 2
      
      // Helper to create link annotation (matching pdf-lib docs pattern)
      const createLinkAnnotation = (uri: string, rect: number[]) =>
        page.doc.context.register(
          page.doc.context.obj({
            Type: 'Annot',
            Subtype: 'Link',
            Rect: rect,
            Border: [0, 0, 0],
            A: {
              Type: 'Action',
              S: 'URI',
              URI: PDFString.of(uri)
            }
          })
        )
      
      // Collect all link annotations
      const linkAnnotations: ReturnType<typeof createLinkAnnotation>[] = []
      
      for (let i = 0; i < contactItems.length; i++) {
        const item = contactItems[i]
        const itemWidth = helvetica.widthOfTextAtSize(item.text, FONT_SIZES.body)
        
        // Draw the text
        page.drawText(item.text, {
          x: currentX,
          y,
          size: FONT_SIZES.body,
          font: helvetica,
          color: lightGrayColor
        })
        
        // Create link annotation if URL exists
        if (item.url) {
          const link = createLinkAnnotation(item.url, [currentX, y - 2, currentX + itemWidth, y + linkHeight])
          linkAnnotations.push(link)
        }
        
        currentX += itemWidth
        
        // Draw separator if not last item
        if (i < contactItems.length - 1) {
          page.drawText(separator, {
            x: currentX,
            y,
            size: FONT_SIZES.body,
            font: helvetica,
            color: lightGrayColor
          })
          currentX += separatorWidth
        }
      }
      
      // Add all link annotations to the page at once
      if (linkAnnotations.length > 0) {
        page.node.set(PDFName.of('Annots'), pdfDoc.context.obj(linkAnnotations))
      }
      
      y -= FONT_SIZES.body + 16

      // === PROFESSIONAL SUMMARY ===
      if (hasSummary) {
        drawSectionHeader('Summary')
        
        const summaryLines = wrapText(selectedContent.summary!.text, helvetica, FONT_SIZES.body, CONTENT_WIDTH)
        const lineHeight = FONT_SIZES.body + 3
        
        checkNewPage(summaryLines.length * lineHeight)
        
        for (const line of summaryLines) {
          page.drawText(line, {
            x: PAGE.marginLeft,
            y,
            size: FONT_SIZES.body,
            font: helvetica,
            color: grayColor
          })
          y -= lineHeight
        }
        
        y -= 8
      }

      // === WORK EXPERIENCE ===
      if (selectedExperiences.length > 0) {
        drawSectionHeader('Professional Experience')
        
        for (let i = 0; i < selectedExperiences.length; i++) {
          const exp = selectedExperiences[i]
          const lineHeight = FONT_SIZES.body + 3
          
          checkNewPage(60)
          
          // Job title on left
          page.drawText(exp.jobTitle, {
            x: PAGE.marginLeft,
            y,
            size: FONT_SIZES.jobTitle,
            font: helveticaBold,
            color: darkColor
          })
          
          // Date range on right
          const dateRange = formatDateRange(exp.startDate, exp.endDate, exp.currentPosition)
          const dateWidth = helvetica.widthOfTextAtSize(dateRange, FONT_SIZES.body)
          
          page.drawText(dateRange, {
            x: PAGE.width - PAGE.marginRight - dateWidth,
            y,
            size: FONT_SIZES.body,
            font: helvetica,
            color: grayColor
          })
          
          y -= FONT_SIZES.jobTitle + 2
          
          // Employer on left (bold, lighter grey for hierarchy)
          page.drawText(exp.employer, {
            x: PAGE.marginLeft,
            y,
            size: FONT_SIZES.body,
            font: helveticaBold,
            color: employerColor
          })
          
          // Location type on right
          const locWidth = helvetica.widthOfTextAtSize(exp.locationType, FONT_SIZES.body)
          page.drawText(exp.locationType, {
            x: PAGE.width - PAGE.marginRight - locWidth,
            y,
            size: FONT_SIZES.body,
            font: helvetica,
            color: grayColor
          })
          
          y -= FONT_SIZES.body + 4
          
          // Highlights (bullet points)
          const selectedHighlights = exp.highlights.filter(h => h.selected)
          for (const highlight of selectedHighlights) {
            const bulletX = PAGE.marginLeft + 10
            const textX = PAGE.marginLeft + 20
            const textWidth = CONTENT_WIDTH - 20
            
            const highlightLines = wrapText(highlight.text, helvetica, FONT_SIZES.body, textWidth)
            
            checkNewPage(highlightLines.length * lineHeight + 4)
            
            // Draw bullet
            page.drawText('•', {
              x: bulletX,
              y,
              size: FONT_SIZES.body,
              font: helvetica,
              color: grayColor
            })
            
            // Draw text lines
            for (let j = 0; j < highlightLines.length; j++) {
              page.drawText(highlightLines[j], {
                x: textX,
                y,
                size: FONT_SIZES.body,
                font: helvetica,
                color: grayColor
              })
              y -= lineHeight
            }
          }
          
          // Spacing between experiences
          if (i < selectedExperiences.length - 1) {
            y -= 8
          }
        }
        
        y -= 8
      }

      // === EDUCATION ===
      if (selectedEducation.length > 0) {
        drawSectionHeader('Education')
        
        for (let i = 0; i < selectedEducation.length; i++) {
          const edu = selectedEducation[i]
          
          checkNewPage(40)
          
          // Degree (with area of study) on left
          let degreeText = edu.degree
          if (edu.areaOfStudy) {
            degreeText += ` in ${edu.areaOfStudy}`
          }
          
          page.drawText(degreeText, {
            x: PAGE.marginLeft,
            y,
            size: FONT_SIZES.jobTitle,
            font: helveticaBold,
            color: darkColor
          })
          
          // Graduation date (endDate only) on right
          if (edu.endDate) {
            const graduationDate = formatDateForDisplay(edu.endDate)
            const dateWidth = helvetica.widthOfTextAtSize(graduationDate, FONT_SIZES.body)
            
            page.drawText(graduationDate, {
              x: PAGE.width - PAGE.marginRight - dateWidth,
              y,
              size: FONT_SIZES.body,
              font: helvetica,
              color: grayColor
            })
          }
          
          y -= FONT_SIZES.jobTitle + 2
          
          // Institution
          page.drawText(edu.institution, {
            x: PAGE.marginLeft,
            y,
            size: FONT_SIZES.body,
            font: helvetica,
            color: grayColor
          })
          
          y -= FONT_SIZES.body + 6
          
          if (i < selectedEducation.length - 1) {
            y -= 4
          }
        }
        
        y -= 8
      }

      // === SKILLS ===
      if (selectedSkills.length > 0) {
        drawSectionHeader('Skills')
        
        const groupedSkillsList = groupSkills(selectedSkills)
        const lineHeight = FONT_SIZES.body + 4
        
        const showGroupLabels = groupedSkillsList.length > 1

        for (let i = 0; i < groupedSkillsList.length; i++) {
          const skillGroup = groupedSkillsList[i]
          const skillsText = skillGroup.skills.join(', ')

          if (showGroupLabels) {
            const skillText = `${skillGroup.group}: ${skillsText}`
            const skillLines = wrapText(skillText, helvetica, FONT_SIZES.body, CONTENT_WIDTH)
            checkNewPage(skillLines.length * lineHeight)

            // Draw group name in bold, rest in regular
            const groupLabel = `${skillGroup.group}: `
            const groupLabelWidth = helveticaBold.widthOfTextAtSize(groupLabel, FONT_SIZES.body)

            page.drawText(groupLabel, {
              x: PAGE.marginLeft,
              y,
              size: FONT_SIZES.body,
              font: helveticaBold,
              color: grayColor
            })

            const firstLineSkillsWidth = CONTENT_WIDTH - groupLabelWidth
            const firstLineSkills = wrapText(skillsText, helvetica, FONT_SIZES.body, firstLineSkillsWidth)

            if (firstLineSkills.length > 0) {
              page.drawText(firstLineSkills[0], {
                x: PAGE.marginLeft + groupLabelWidth,
                y,
                size: FONT_SIZES.body,
                font: helvetica,
                color: grayColor
              })
              y -= lineHeight

              for (let j = 1; j < firstLineSkills.length; j++) {
                page.drawText(firstLineSkills[j], {
                  x: PAGE.marginLeft,
                  y,
                  size: FONT_SIZES.body,
                  font: helvetica,
                  color: grayColor
                })
                y -= lineHeight
              }
            }
          }
          else {
            const skillLines = wrapText(skillsText, helvetica, FONT_SIZES.body, CONTENT_WIDTH)
            checkNewPage(skillLines.length * lineHeight)

            for (let j = 0; j < skillLines.length; j++) {
              page.drawText(skillLines[j], {
                x: PAGE.marginLeft,
                y,
                size: FONT_SIZES.body,
                font: helvetica,
                color: grayColor
              })
              y -= lineHeight
            }
          }

          if (i < groupedSkillsList.length - 1) {
            y -= 2
          }
        }
        
        y -= 8
      }

      // === CERTIFICATIONS ===
      if (selectedCertifications.length > 0) {
        drawSectionHeader('Certifications')
        
        for (let i = 0; i < selectedCertifications.length; i++) {
          const cert = selectedCertifications[i]
          
          checkNewPage(35)
          
          // Cert name on left
          page.drawText(cert.name, {
            x: PAGE.marginLeft,
            y,
            size: FONT_SIZES.jobTitle,
            font: helveticaBold,
            color: darkColor
          })
          
          // Date on right
          const issueDate = formatDateForDisplay(cert.issueDate)
          if (issueDate) {
            const dateWidth = helvetica.widthOfTextAtSize(issueDate, FONT_SIZES.body)
            page.drawText(issueDate, {
              x: PAGE.width - PAGE.marginRight - dateWidth,
              y,
              size: FONT_SIZES.body,
              font: helvetica,
              color: grayColor
            })
          }
          
          y -= FONT_SIZES.jobTitle + 2
          
          // Issuer
          if (cert.issuer) {
            page.drawText(cert.issuer, {
              x: PAGE.marginLeft,
              y,
              size: FONT_SIZES.body,
              font: helvetica,
              color: grayColor
            })
            y -= FONT_SIZES.body + 4
          }
          
          if (i < selectedCertifications.length - 1) {
            y -= 4
          }
        }
      }

      // Set PDF metadata
      const firstName = contactInfo.firstName || ''
      const lastName = contactInfo.lastName || ''
      const titleName = firstName && lastName 
        ? `${firstName}_${lastName}_Resume`
        : firstName 
          ? `${firstName}_Resume`
          : 'JobSearchSage_Resume'

      pdfDoc.setTitle(titleName)
      pdfDoc.setAuthor(`${contactInfo.firstName || ''} ${contactInfo.lastName || ''}`.trim() || 'JobSearchSage User')
      pdfDoc.setProducer('JobSearchSage')
      pdfDoc.setCreator('JobSearchSage')
      const now = new Date()
      pdfDoc.setCreationDate(now)
      pdfDoc.setModificationDate(now)

      // Save and download PDF
      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `${titleName}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
    } finally {
      isGenerating.value = false
    }
  }

  return {
    generatePdf,
    isGenerating
  }
}
