import { NextRequest } from 'next/server'
import { AuthService } from '@/lib/services/auth.service'
import { LearningLanguageService } from '@/lib/services/learning-language.service'
import { deleteLearningLanguageParamsSchema } from '@/lib/validation'
import { noContentResponse, errorResponse } from '@/lib/response'

/**
 * DELETE /api/learning-languages/[learningLanguageId]
 * Deletes a learning language for the authenticated user.
 * Requires authentication and ownership.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ learningLanguageId: string }> }
) {
  try {
    // Verify authentication and get user ID
    const userId = await AuthService.getCurrentUserId()

    // Validate path parameters
    const resolvedParams = await params
    const validatedParams = deleteLearningLanguageParamsSchema.parse(resolvedParams)

    // Delete learning language
    await LearningLanguageService.deleteLearningLanguage(userId, validatedParams.learningLanguageId)

    return noContentResponse()
  } catch (error) {
    return errorResponse(error)
  }
}
