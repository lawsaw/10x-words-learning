import { NextRequest } from "next/server"
import { AuthService } from "@/lib/services/auth.service"
import { VocabularyOverviewService } from "@/lib/services/vocabulary-overview.service"
import { vocabularyOverviewQuerySchema } from "@/lib/validation"
import { okResponse, errorResponse } from "@/lib/response"
import type { VocabularyOverviewListDto } from "@/lib/types"

/**
 * GET /api/vocabulary-overview
 * Retrieves an aggregated view of user's vocabulary across all learning languages.
 * Supports filtering by learning language and category.
 * Read-only endpoint for analytics and reporting.
 * Requires authentication.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and get user ID
    const userId = await AuthService.getCurrentUserId()

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      learningLanguageId: searchParams.get("learningLanguageId") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      orderBy: searchParams.get("orderBy") || undefined,
      direction: searchParams.get("direction") || undefined,
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
    }

    const validatedQuery = vocabularyOverviewQuerySchema.parse(queryParams)

    // Fetch vocabulary overview
    const result: VocabularyOverviewListDto =
      await VocabularyOverviewService.getVocabularyOverview(userId, validatedQuery)

    return okResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
}

