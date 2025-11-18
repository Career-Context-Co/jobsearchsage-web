/**
 * DELETE /api/profile/work-experience/:id
 * 
 * Mock endpoint that deletes a specific work experience entry.
 * In production, this will delete from the database.
 */

export default eventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  // Mock: Simulate database delete delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // TODO: In production, verify the work experience belongs to the user
  // const workExp = await db.getWorkExperienceById(id)
  // if (!workExp || workExp.profile.user_id !== userId) {
  //   throw createError({
  //     statusCode: 404,
  //     statusMessage: 'Not Found',
  //     data: {
  //       success: false,
  //       error: {
  //         code: 'NOT_FOUND',
  //         message: 'Work experience entry not found'
  //       }
  //     }
  //   })
  // }
  
  // TODO: In production, delete from database
  // await db.deleteWorkExperience(id)
  
  return {
    success: true,
    message: 'Work experience deleted successfully'
  }
})

