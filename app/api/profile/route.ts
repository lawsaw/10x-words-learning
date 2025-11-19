import { NextRequest } from 'next/server'
import { AuthService } from '@/lib/services/auth.service'
import { ProfileService } from '@/lib/services/profile.service'
import { updateProfileCommandSchema } from '@/lib/validation'
import { okResponse, errorResponse } from '@/lib/response'
import type { ProfileDto } from '@/lib/types'

/**
 * GET /api/profile
 * Retrieves the profile for the authenticated user.
 * Requires authentication.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and get user ID
    const userId = await AuthService.getCurrentUserId()

    // Fetch profile
    const result: ProfileDto = await ProfileService.getProfile(userId)

    return okResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * PATCH /api/profile
 * Updates the profile for the authenticated user.
 * Note: userLanguage field is immutable and cannot be changed.
 * Requires authentication.
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication and get user ID
    const userId = await AuthService.getCurrentUserId()

    // Parse and validate request body
    const body = await request.json()
    const validatedCommand = updateProfileCommandSchema.parse(body)

    // Update profile
    const result: ProfileDto = await ProfileService.updateProfile(userId, validatedCommand)

    return okResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
}
