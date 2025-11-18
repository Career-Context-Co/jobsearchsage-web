/**
 * PUT /api/profile/work-experience
 * 
 * Mock endpoint that updates all work experience entries for the user's profile.
 * Replaces the entire work experience section.
 * In production, this will update the database.
 */

export default eventHandler(async (event) => {
  const body = await readBody(event)
  
  // Mock: Simulate database update delay
  await new Promise(resolve => setTimeout(resolve, 150))
  
  // Mock: Map incoming data to database format
  const updatedWorkExperiences = (body || []).map((exp: any, index: number) => ({
    id: exp.id || 'work-exp-' + Math.random().toString(36).substr(2, 9),
    profile_id: 'profile-uuid-001',
    company: exp.company,
    title: exp.title,
    location: exp.location || null,
    url: exp.url || null,
    start_date: exp.startDate,
    end_date: exp.endDate || null,
    current_position: exp.currentPosition,
    summary: exp.summary || null,
    highlights: exp.highlights || [],
    display_order: exp.display_order ?? index,
    created_at: exp.id ? (exp.created_at || new Date().toISOString()) : new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))
  
  return {
    success: true,
    message: 'Work experience updated successfully',
    data: updatedWorkExperiences
  }
})

