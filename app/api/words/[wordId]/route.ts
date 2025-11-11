import { NextRequest } from "next/server"
import { AuthService } from "@/lib/services/auth.service"
import { WordService } from "@/lib/services/word.service"
import { wordParamsSchema, updateWordCommandSchema } from "@/lib/validation"
import { okResponse, noContentResponse, errorResponse } from "@/lib/response"
import type { WordDetailDto, WordDto } from "@/lib/types"

/**
 * GET /api/words/[wordId]
 * Retrieves a single word with full details.
 * Requires authentication and ownership.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wordId: string }> }
) {
  try {
    // Verify authentication and get user ID
    const userId = await AuthService.getCurrentUserId()

    // Validate path parameters
    const resolvedParams = await params
    const validatedParams = wordParamsSchema.parse(resolvedParams)

    // Fetch word detail
    const result: WordDetailDto = await WordService.getWordDetail(
      userId,
      validatedParams.wordId
    )

    return okResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * PATCH /api/words/[wordId]
 * Updates a word (term, translation, or examples).
 * Requires authentication and ownership.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ wordId: string }> }
) {
  try {
    // Verify authentication and get user ID
    const userId = await AuthService.getCurrentUserId()

    // Validate path parameters
    const resolvedParams = await params
    const validatedParams = wordParamsSchema.parse(resolvedParams)

    // Parse and validate request body
    const body = await request.json()
    const validatedCommand = updateWordCommandSchema.parse(body)

    // Update word
    const result: WordDto = await WordService.updateWord(
      userId,
      validatedParams.wordId,
      validatedCommand
    )

    return okResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * DELETE /api/words/[wordId]
 * Deletes a word.
 * Requires authentication and ownership.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ wordId: string }> }
) {
  try {
    // Verify authentication and get user ID
    const userId = await AuthService.getCurrentUserId()

    // Validate path parameters
    const resolvedParams = await params
    const validatedParams = wordParamsSchema.parse(resolvedParams)

    // Delete word
    await WordService.deleteWord(userId, validatedParams.wordId)

    return noContentResponse()
  } catch (error) {
    return errorResponse(error)
  }
}

