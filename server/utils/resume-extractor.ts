/**
 * Resume AI Extraction Utility
 * 
 * Uses Vercel AI SDK with AI Gateway (GPT-4o Vision) to extract structured
 * career data from resume files (PDF, DOCX, DOC, JPG, PNG).
 * 
 * Features:
 * - Type-safe structured output with Zod schemas
 * - Support for both text-based and image-based resumes
 * - Comprehensive error handling
 * - Transform extraction to existing profile schema
 */

import { createGateway, generateText } from 'ai'
import { PDFParse } from 'pdf-parse'
import type { ContactInfo, Experience, Education, ProfileSkill, Certification } from '@@/shared/types/careerId'

const apiKey = useRuntimeConfig().aiGatewayApiKey
if (!apiKey) {
  throw new Error('API Key is not set')
}

const gateway = createGateway({
  apiKey: apiKey,
});

/**
 * Type for the extraction result from AI
 * Uses existing shared types, omitting database-specific fields
 */
export interface ExtractionResult {
  contactInfo: Omit<ContactInfo, 'id' | 'internalId' | 'profileId' | 'createdAt' | 'updatedAt'>
  experience: Array<Omit<Experience, 'id' | 'profileId' | 'createdAt' | 'updatedAt' | 'displayOrder'>>
  education: Array<Omit<Education, 'id' | 'profileId' | 'createdAt' | 'updatedAt' | 'displayOrder'>>
  skills: string[]  // Just an array of skill names
  certifications: Array<Omit<Certification, 'id' | 'profileId' | 'createdAt' | 'updatedAt' | 'displayOrder'>>
}

/**
 * Extraction error types
 */
export class ExtractionError extends Error {
  constructor(
    message: string,
    public code: 'OPENAI_ERROR' | 'TIMEOUT' | 'INVALID_RESPONSE' | 'API_KEY_MISSING' | 'CONVERSION_ERROR' | 'JSON_PARSE_ERROR',
    public details?: any
  ) {
    super(message)
    this.name = 'ExtractionError'
  }
}

/**
 * Extract text from PDF file using pdf-parse v2/v3 API
 */
async function extractPdfText(buffer: Buffer | Uint8Array): Promise<string> {
  const parser = new PDFParse({ data: Buffer.from(buffer) })
  try {
    const result = await parser.getText()
    return result.text
  } finally {
    // Always destroy to free memory
    await parser.destroy()
  }
}

/**
 * Extract metadata from PDF headers (useful if contact info is missing from body)
 */
async function extractPdfMetadata(buffer: Buffer | Uint8Array): Promise<Record<string, any>> {
  const parser = new PDFParse({ data: Buffer.from(buffer) })
  try {
    const info = await parser.getInfo()
    // The info object contains metadata directly
    return {
      title: info.info?.Title,
      author: info.info?.Author,
      creator: info.info?.Creator,
      producer: info.info?.Producer,
      creationDate: info.info?.CreationDate,
      modDate: info.info?.ModDate,
    }
  } finally {
    await parser.destroy()
  }
}

/**
 * Determine file type based on filename
 */
function getFileType(filename: string): 'pdf' | 'txt' | 'md' {
  const ext = filename.toLowerCase()
  if (ext.endsWith('.pdf')) return 'pdf'
  if (ext.endsWith('.txt')) return 'txt'
  if (ext.endsWith('.md')) return 'md'
  throw new Error('Unsupported file type')
}

/**
 * Extract structured career data from a resume file using AI Gateway
 * 
 * @param fileBuffer - Resume file buffer (from multipart form data)
 * @param filename - Original filename (used to determine file type)
 * @returns Structured extraction result
 * @throws ExtractionError if extraction fails
 */
export async function extractResumeData(
  fileBuffer: Buffer | Uint8Array,
  filename: string
): Promise<ExtractionResult> {
  try {
    const fileType = getFileType(filename)
    let resumeText: string
    let pdfMetadata: Record<string, any> | null = null
    
    // Extract text based on file type
    if (fileType === 'pdf') {
      resumeText = await extractPdfText(fileBuffer)
      // Also extract PDF metadata in case contact info is in headers
      try {
        pdfMetadata = await extractPdfMetadata(fileBuffer)
      } catch (error) {
        // Metadata extraction is optional, continue without it
        console.warn('Failed to extract PDF metadata:', error)
      }
    } else {
      // For TXT and MD files, just decode as UTF-8
      resumeText = Buffer.from(fileBuffer).toString('utf-8')
    }
    
    // Add PDF metadata to help with contact info extraction if available
    let additionalContext = ''
    if (pdfMetadata && (pdfMetadata.author || pdfMetadata.title)) {
      additionalContext = `\n\nPDF Metadata (use if contact info is missing from body):\n`
      if (pdfMetadata.author) additionalContext += `Author: ${pdfMetadata.author}\n`
      if (pdfMetadata.title) additionalContext += `Title: ${pdfMetadata.title}\n`
    }
    
    // Generate text extraction using Vercel AI SDK with AI Gateway
    const { text } = await generateText({
      model: gateway('google/gemini-2.5-flash-lite'),
      system: `You are an expert resume parser. Extract career information from resumes and return ONLY valid JSON.

EXTRACTION RULES:
1. Extract contact information (name, email, phone, location, summary/objective)
2. Extract all work experience with dates, employers, titles, and bullet points
3. Extract all education with degrees, institutions, dates, and coursework
4. Extract all skills (technical and soft skills) as a simple array of skill names
5. Extract all certifications with issuers and dates

FORMATTING GUIDELINES:
- Dates: Use YYYY-MM format when month is available, otherwise YYYY format
- Current positions: Set currentPosition=true and omit or null endDate
- Highlights: Extract bullet points as an array of strings
- Location type: Infer from job location or description (on_site/remote/hybrid)
- Employment type: Infer from job description (full_time/part_time/contract/freelance/internship)

JSON STRUCTURE:
{
  "contactInfo": {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string (optional)",
    "jobTitle": "string (optional)",
    "city": "string (optional)",
    "stateRegion": "string (optional)",
    "country": "string (optional)",
    "postalCode": "string (optional)",
    "summary": "string (optional)",
    "websites": ["string (optional)"],
    "willingToRelocate": "boolean (optional)"
  },
  "experience": [{
    "employer": "string",
    "title": "string",
    "location": "string (optional)",
    "locationType": "on_site|remote|hybrid (optional)",
    "employmentType": "full_time|part_time|contract|freelance|internship (optional)",
    "startDate": "string",
    "endDate": "string (optional, null for current)",
    "currentPosition": "boolean",
    "summary": "string (optional)",
    "highlights": ["string"],
    "url": "string (optional)"
  }],
  "education": [{
    "degreeType": "string",
    "areaOfStudy": "string",
    "institution": "string",
    "startDate": "string",
    "endDate": "string",
    "completed": "boolean",
    "coursework": ["string (optional)"],
    "minors": ["string (optional)"],
    "creditHours": "number (optional)",
    "url": "string (optional)"
  }],
  "skills": ["string array of skill names"],
  "certifications": [{
    "name": "string",
    "issuer": "string",
    "issueDate": "string",
    "url": "string (optional)"
  }]
}

IMPORTANT:
- Return ONLY the JSON object, no other text or markdown
- Extract ALL information present in the resume including full urls for any links
- Do not fabricate information that is not present
- Preserve original wording from the resume
- If a field is not present, use null`,
      prompt: `Extract all career information from this resume and return as JSON:\n\n${resumeText}${additionalContext}`,
      maxRetries: 2
    })
    
    // Parse the JSON response
    let parsedResult: ExtractionResult
    try {
      // Try to parse as-is first
      parsedResult = JSON.parse(text)
    } catch (parseError) {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[1])
      } else {
        // Try to find JSON object in the text
        const jsonObjectMatch = text.match(/\{[\s\S]*\}/)
        if (jsonObjectMatch) {
          parsedResult = JSON.parse(jsonObjectMatch[0])
        } else {
          throw new ExtractionError(
            'Failed to parse JSON from AI response',
            'JSON_PARSE_ERROR',
            { responseText: text, parseError }
          )
        }
      }
    }
    
    return parsedResult
    
  } catch (error: any) {
    // Handle specific error types
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new ExtractionError(
        'Resume extraction timed out. The file may be too large or complex.',
        'TIMEOUT',
        { originalError: error.message }
      )
    }
    
    if (error.message?.includes('API key') || error.message?.includes('gateway')) {
      throw new ExtractionError(
        'AI Gateway API key is not configured or invalid',
        'API_KEY_MISSING',
        { originalError: error.message }
      )
    }
    
    if (error.code === 'JSON_PARSE_ERROR' || error instanceof SyntaxError) {
      throw new ExtractionError(
        'Failed to parse AI response. The extracted data did not match the expected format.',
        'INVALID_RESPONSE',
        { parseError: error.message }
      )
    }
    
    // Generic AI Gateway API error
    throw new ExtractionError(
      'Failed to extract data from resume. Please try again or use a different file format.',
      'OPENAI_ERROR',
      { 
        originalError: error.message,
        stack: error.stack
      }
    )
  }
}

/**
 * Transform AI extraction result to existing profile schema format
 * 
 * Maps the AI extraction result to the format expected by the frontend
 * and existing API endpoints.
 * 
 * @param extraction - Extraction result from AI
 * @returns Profile data in existing schema format
 */
export function transformExtractionToProfile(extraction: ExtractionResult) {
  return {
    contactInfo: {
      firstName: extraction.contactInfo.firstName,
      lastName: extraction.contactInfo.lastName,
      email: extraction.contactInfo.email,
      phone: extraction.contactInfo.phone || null,
      jobTitle: extraction.contactInfo.jobTitle || null,
      city: extraction.contactInfo.city || null,
      stateRegion: extraction.contactInfo.stateRegion || null,
      country: extraction.contactInfo.country || null,
      postalCode: extraction.contactInfo.postalCode || null,
      summary: extraction.contactInfo.summary || null,
      websites: extraction.contactInfo.websites || [],
      willingToRelocate: extraction.contactInfo.willingToRelocate ?? false
    },
    
    experience: extraction.experience.map((exp, index) => ({
      employmentType: exp.employmentType || 'full_time',
      employer: exp.employer,
      title: exp.title,
      location: exp.location || undefined,
      locationType: exp.locationType || 'on_site',
      url: exp.url || null,
      startDate: exp.startDate,
      endDate: exp.endDate || null,
      currentPosition: exp.currentPosition,
      summary: exp.summary || null,
      highlights: exp.highlights || [],
      displayOrder: index
    })),
    
    education: extraction.education.map((edu, index) => ({
      degreeType: edu.degreeType,
      areaOfStudy: edu.areaOfStudy,
      institution: edu.institution,
      startDate: edu.startDate,
      endDate: edu.endDate,
      completed: edu.completed,
      url: edu.url || null,
      creditHours: edu.creditHours || null,
      coursework: edu.coursework || [],
      minors: edu.minors || [],
      displayOrder: index
    })),
    
    profileSkills: extraction.skills,  // Return as simple string array to save bandwidth
    
    certifications: extraction.certifications.map((cert, index) => ({
      name: cert.name,
      issuer: cert.issuer,
      issueDate: cert.issueDate,
      url: cert.url || null,
      displayOrder: index
    }))
  }
}

/**
 * Merge extracted data with existing profile data
 * 
 * Deduplicates entries and keeps the most complete version.
 * Used when users upload multiple resumes or want to supplement existing data.
 * 
 * @param existing - Existing profile data
 * @param extracted - Newly extracted data
 * @returns Merged profile data with duplicates removed
 */
export function mergeProfileData(
  existing: ReturnType<typeof transformExtractionToProfile>,
  extracted: ReturnType<typeof transformExtractionToProfile>
): ReturnType<typeof transformExtractionToProfile> {
  return {
    // Contact info: prefer extracted (newer) data, but keep existing if extracted is incomplete
    contactInfo: {
      ...existing.contactInfo,
      ...extracted.contactInfo,
      // Merge websites arrays
      websites: Array.from(new Set([
        ...(existing.contactInfo?.websites || []),
        ...(extracted.contactInfo?.websites || [])
      ]))
    },
    
    // Experience: merge and deduplicate by employer + title + startDate
    experience: deduplicateExperience([
      ...existing.experience,
      ...extracted.experience
    ]),
    
    // Education: merge and deduplicate by institution + degree + areaOfStudy
    education: deduplicateEducation([
      ...existing.education,
      ...extracted.education
    ]),
    
    // Skills: merge and deduplicate by name (case-insensitive)
    profileSkills: deduplicateSkills([
      ...existing.profileSkills,
      ...extracted.profileSkills
    ]),
    
    // Certifications: merge and deduplicate by name + issuer
    certifications: deduplicateCertifications([
      ...existing.certifications,
      ...extracted.certifications
    ])
  }
}

/**
 * Deduplicate experience entries
 * Identifies duplicates by employer + title + startDate
 * Keeps the entry with more complete data (more highlights, longer summary)
 */
function deduplicateExperience(experiences: ReturnType<typeof transformExtractionToProfile>['experience']) {
  const seen = new Map<string, typeof experiences[0]>()
  
  for (const exp of experiences) {
    const key = `${exp.employer.toLowerCase()}_${exp.title.toLowerCase()}_${exp.startDate}`
    const existing = seen.get(key)
    
    if (!existing) {
      seen.set(key, exp)
    } else {
      // Keep the more complete entry
      const existingScore = (existing.highlights?.length || 0) + (existing.summary?.length || 0)
      const newScore = (exp.highlights?.length || 0) + (exp.summary?.length || 0)
      
      if (newScore > existingScore) {
        seen.set(key, exp)
      }
    }
  }
  
  // Re-sort by most recent and reassign display order
  return Array.from(seen.values())
    .sort((a, b) => {
      // Sort by start date descending (most recent first)
      return b.startDate.localeCompare(a.startDate)
    })
    .map((exp, index) => ({ ...exp, displayOrder: index }))
}

/**
 * Deduplicate education entries
 * Identifies duplicates by institution + degreeType + areaOfStudy
 * Keeps the entry with more complete data
 */
function deduplicateEducation(educations: ReturnType<typeof transformExtractionToProfile>['education']) {
  const seen = new Map<string, typeof educations[0]>()
  
  for (const edu of educations) {
    const key = `${edu.institution.toLowerCase()}_${edu.degreeType.toLowerCase()}_${edu.areaOfStudy.toLowerCase()}`
    const existing = seen.get(key)
    
    if (!existing) {
      seen.set(key, edu)
    } else {
      // Keep the more complete entry
      const existingScore = (existing.coursework?.length || 0) + (existing.minors?.length || 0)
      const newScore = (edu.coursework?.length || 0) + (edu.minors?.length || 0)
      
      if (newScore > existingScore) {
        seen.set(key, edu)
      }
    }
  }
  
  // Re-sort by most recent and reassign display order
  return Array.from(seen.values())
    .sort((a, b) => b.endDate.localeCompare(a.endDate))
    .map((edu, index) => ({ ...edu, displayOrder: index }))
}

/**
 * Deduplicate skills
 * Identifies duplicates by name (case-insensitive)
 * Returns unique skill names
 */
function deduplicateSkills(skills: string[]) {
  const seen = new Set<string>()
  const result: string[] = []
  
  for (const skill of skills) {
    const key = skill.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      result.push(skill)
    }
  }
  
  return result
}

/**
 * Deduplicate certifications
 * Identifies duplicates by name + issuer (case-insensitive)
 * Keeps the more recent certification
 */
function deduplicateCertifications(certifications: ReturnType<typeof transformExtractionToProfile>['certifications']) {
  const seen = new Map<string, typeof certifications[0]>()
  
  for (const cert of certifications) {
    const key = `${cert.name.toLowerCase()}_${cert.issuer.toLowerCase()}`
    const existing = seen.get(key)
    
    if (!existing) {
      seen.set(key, cert)
    } else {
      // Keep the more recent certification
      if (cert.issueDate > existing.issueDate) {
        seen.set(key, cert)
      }
    }
  }
  
  // Sort by issue date descending and reassign display order
  return Array.from(seen.values())
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate))
    .map((cert, index) => ({ ...cert, displayOrder: index }))
}

