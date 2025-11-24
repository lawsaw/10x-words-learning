import { LanguageService } from '@/lib/services/language.service'
import { okResponse, errorResponse } from '@/lib/response'
import type { LanguagesListDto } from '@/lib/types'

/**
 * GET /api/languages
 * Retrieves the list of available languages, optionally filtered by scope.
 * Public endpoint - no authentication required.
 */
export async function GET() {
  try {
    // Fetch languages from service
    const result: LanguagesListDto = await LanguageService.getLanguages()

    return okResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
}
