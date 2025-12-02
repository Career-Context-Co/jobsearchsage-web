/**
 * DELETE /api/profile/contact
 * 
 * Mock endpoint that deletes/clears contact information for the user's profile.
 * In production, this will delete from the database.
 */

export default eventHandler(async () => {
  // Mock: Simulate database delete delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // TODO: In production, delete contact info from database
  // await db.deleteContactInfo(userId)
  
  return {
    success: true,
    message: 'Contact information deleted successfully'
  }
})

