import { NextRequest } from 'next/server'
import { LanguageService } from '@/lib/services/language.service'
import { languagesQuerySchema } from '@/lib/validation'
import { okResponse, errorResponse } from '@/lib/response'
import type { LanguagesListDto } from '@/lib/types'

/**
 * GET /api/languages
 * Retrieves the list of available languages, optionally filtered by scope.
 * Public endpoint - no authentication required.
 */
export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      scope: searchParams.get('scope') || undefined,
    }

    const validatedQuery = languagesQuerySchema.parse(queryParams)

    // Fetch languages from service
    const result: LanguagesListDto = await LanguageService.getLanguages(validatedQuery)

    return okResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
}
