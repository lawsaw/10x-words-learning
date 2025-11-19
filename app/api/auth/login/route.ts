import { NextRequest } from 'next/server'
import { AuthService } from '@/lib/services/auth.service'
import { loginCommandSchema } from '@/lib/validation'
import { okResponse, errorResponse } from '@/lib/response'
import type { LoginResponseDto } from '@/lib/types'

/**
 * POST /api/auth/login
 * Authenticates a user with email and password.
 * Public endpoint - no authentication required.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedCommand = loginCommandSchema.parse(body)

    // Authenticate user
    const result: LoginResponseDto = await AuthService.login(validatedCommand)

    return okResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
}
