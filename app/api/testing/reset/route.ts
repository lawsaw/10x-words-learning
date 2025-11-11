import { NextRequest } from "next/server"
import { TestingResetService } from "@/lib/services/testing-reset.service"
import { testResetCommandSchema } from "@/lib/validation"
import { noContentResponse, errorResponse } from "@/lib/response"

/**
 * POST /api/testing/reset
 * Resets the database to a clean state for automated testing.
 * ONLY available when NODE_ENV=test and with valid admin token.
 * DO NOT enable in production.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedCommand = testResetCommandSchema.parse(body)

    // Reset database
    await TestingResetService.resetDatabase(validatedCommand)

    return noContentResponse()
  } catch (error) {
    return errorResponse(error)
  }
}

