import { NextRequest } from 'next/server'
import { AuthService } from '@/lib/services/auth.service'
import { noContentResponse, errorResponse } from '@/lib/response'

/**
 * POST /api/auth/logout
 * Logs out the current user by ending their session.
 * Requires authentication.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated before attempting logout
    await AuthService.getCurrentUserId()

    // Logout user
    await AuthService.logout()

    return noContentResponse()
  } catch (error) {
    return errorResponse(error)
  }
}
