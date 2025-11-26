/**
 * PUT /api/profile/skill-categories
 * 
 * Mock endpoint that updates all skill categories for the user's profile.
 * Replaces the entire skill categories section.
 * In production, this will update the database.
 */

export default eventHandler(async (event) => {
  const body = await readBody(event)
  
  // Mock: Simulate database update delay
  await new Promise(resolve => setTimeout(resolve, 150))
  
  // Mock: Map incoming data to database format
  const updatedSkillCategories = (body || []).map((cat: any, index: number) => ({
    id: cat.id || 'skill-cat-' + Math.random().toString(36).substr(2, 9),
    profile_id: 'profile-uuid-001',
    name: cat.name,
    description: cat.description || null,
    skills: cat.skills || [],
    display_order: cat.display_order ?? index,
    created_at: cat.id ? (cat.created_at || new Date().toISOString()) : new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))
  
  return {
    success: true,
    message: 'Skill categories updated successfully',
    data: updatedSkillCategories
  }
})

