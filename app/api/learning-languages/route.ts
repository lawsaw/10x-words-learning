import { NextRequest } from 'next/server'
import { AuthService } from '@/lib/services/auth.service'
import { LearningLanguageService } from '@/lib/services/learning-language.service'
import { learningLanguagesQuerySchema, createLearningLanguageCommandSchema } from '@/lib/validation'
import { okResponse, createdResponse, errorResponse } from '@/lib/response'
import type { LearningLanguagesListDto, LearningLanguageDto } from '@/lib/types'

/**
 * GET /api/learning-languages
 * Retrieves the list of learning languages for the authenticated user.
 * Supports pagination and optional stats.
 * Requires authentication.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and get user ID
    const userId = await AuthService.getCurrentUserId()

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
      cursor: searchParams.get('cursor') || undefined,
      includeStats: searchParams.get('includeStats') || undefined,
    }

    const validatedQuery = learningLanguagesQuerySchema.parse(queryParams)

    // Fetch learning languages
    const result: LearningLanguagesListDto = await LearningLanguageService.getLearningLanguages(
      userId,
      validatedQuery
    )

    return okResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * POST /api/learning-languages
 * Creates a new learning language for the authenticated user.
 * Requires authentication.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication and get user ID
    const userId = await AuthService.getCurrentUserId()

    // Parse and validate request body
    const body = await request.json()
    const validatedCommand = createLearningLanguageCommandSchema.parse(body)

    // Create learning language
    const result: LearningLanguageDto = await LearningLanguageService.createLearningLanguage(
      userId,
      validatedCommand
    )

    return createdResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
}
