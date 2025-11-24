import { AuthService } from '@/lib/services/auth.service'
import { okResponse, errorResponse } from '@/lib/response'
import type { AuthSessionStatusDto } from '@/lib/types'

/**
 * GET /api/auth/session
 * Retrieves the current session status for the authenticated user.
 * Requires authentication.
 */
export async function GET() {
  try {
    // Verify user is authenticated
    await AuthService.getCurrentUserId()

    // Get session status
    const result: AuthSessionStatusDto = await AuthService.getSessionStatus()

    return okResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
}
