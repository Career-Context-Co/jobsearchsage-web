/**
 * PUT /api/profile/contact
 * 
 * Mock endpoint that updates contact information for the user's profile.
 * In production, this will update the database.
 */

export default eventHandler(async (event) => {
  const body = await readBody(event)
  
  // Mock: Simulate database update delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Mock: Return updated contact info
  const updatedContactInfo = {
    id: 'contact-001',
    profile_id: 'profile-uuid-001',
    first_name: body.firstName,
    last_name: body.lastName,
    job_title: body.jobTitle,
    email: body.email,
    phone: body.phone,
    linkedin: body.linkedin,
    websites: body.websites || [],
    summary: body.summary,
    city: body.city,
    state_region: body.stateRegion,
    country: body.country,
    postal_code: body.postalCode,
    willing_to_relocate: body.willingToRelocate,
    created_at: '2025-01-15T10:32:00.000Z',
    updated_at: new Date().toISOString()
  }
  
  return {
    success: true,
    message: 'Contact information updated successfully',
    data: updatedContactInfo
  }
})

