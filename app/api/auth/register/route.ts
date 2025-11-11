import { NextRequest } from "next/server"
import { AuthService } from "@/lib/services/auth.service"
import { registerCommandSchema } from "@/lib/validation"
import { createdResponse, errorResponse } from "@/lib/response"
import type { RegisterResponseDto } from "@/lib/types"

/**
 * POST /api/auth/register
 * Registers a new user with email, password, and preferred language.
 * Public endpoint - no authentication required.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedCommand = registerCommandSchema.parse(body)

    // Register user and create profile
    const result: RegisterResponseDto =
      await AuthService.register(validatedCommand)

    return createdResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
}

