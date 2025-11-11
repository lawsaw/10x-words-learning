import { NextRequest } from "next/server"
import { AuthService } from "@/lib/services/auth.service"
import { AiGenerationService } from "@/lib/services/ai-generation.service"
import {
  categoryParamsSchema,
  generateWordsCommandSchema,
} from "@/lib/validation"
import { okResponse, errorResponse } from "@/lib/response"
import type { AiGeneratedWordsDto } from "@/lib/types"

/**
 * POST /api/categories/[categoryId]/words/ai-generate
 * Generates word suggestions using AI for a specific category.
 * Does not persist words - returns suggestions for user review.
 * Requires authentication.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    // Verify authentication and get user ID
    const userId = await AuthService.getCurrentUserId()

    // Validate path parameters
    const resolvedParams = await params
    const validatedParams = categoryParamsSchema.parse(resolvedParams)

    // Parse and validate request body
    const body = await request.json()
    const validatedCommand = generateWordsCommandSchema.parse(body)

    // Note: We don't verify category ownership here for AI generation
    // as it's just generating suggestions, not persisting data.
    // The category context is used only for prompt composition.

    // Generate word suggestions
    const result: AiGeneratedWordsDto =
      await AiGenerationService.generateWords(validatedCommand)

    return okResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
}

