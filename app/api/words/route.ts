import { NextRequest } from "next/server"
import { AuthService } from "@/lib/services/auth.service"
import { WordService } from "@/lib/services/word.service"
import { searchWordsQuerySchema } from "@/lib/validation"
import { okResponse, errorResponse } from "@/lib/response"
import type { WordsListDto } from "@/lib/types"

/**
 * GET /api/words
 * Global search for words across learning languages and categories.
 * Supports filtering by learning language, category, and search text.
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
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
      orderBy: searchParams.get("orderBy") || undefined,
      direction: searchParams.get("direction") || undefined,
      cursor: searchParams.get("cursor") || undefined,
    }

    const validatedQuery = searchWordsQuerySchema.parse(queryParams)

    // Search words
    const result: WordsListDto = await WordService.searchWords(
      userId,
      validatedQuery
    )

    return okResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
}

