import { serverSupabaseClient } from '#supabase/server'
import { generatePrefixedId } from '../../../utils/id-generator'


export default eventHandler(async (event) => {
  // Get Supabase service role client (RLS not enabled yet)
  const supabase = await serverSupabaseClient(event)
  
  // Read request body
  const body = await readBody(event)
  
  // Validate required fields
  if (!body.userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [
            {
              field: 'userId',
              message: 'userId is required',
              code: 'REQUIRED'
            }
          ]
        }
      }
    })
  }
  
  // Generate prefixed ID for the profile
  const profileId = generatePrefixedId('prof')
  console.log('Generated profile ID:', profileId)

  // Insert profile into database (profiles table only - entities saved separately)
 const { data, error } = await supabase
 .schema('career_id')
 .from('profiles')
 .insert({
  id: profileId,
  user_id: body.userId,
  completion_status: 'incomplete'
 }).select();
  
  // Handle database errors
  if (error) {
    console.error('Database error creating profile:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create profile'
        }
      }
    })
  }
  
  // Set response status to 201 Created
  setResponseStatus(event, 201)
  
  // Return created profile with structure matching API spec
  return {
    success: true,
    message: 'Profile created successfully',
    data: {
      profile: {
        id: data.id,
        user_id: data.user_id,
        completion_status: data.completion_status
      }
    }
  }
})

