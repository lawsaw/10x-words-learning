import { NextRequest } from "next/server"
import { AuthService } from "@/lib/services/auth.service"
import { WordService } from "@/lib/services/word.service"
import {
  categoryParamsSchema,
  categoryWordsQuerySchema,
  createWordCommandSchema,
} from "@/lib/validation"
import { okResponse, createdResponse, errorResponse } from "@/lib/response"
import type { CategoryWordsListDto, WordDto } from "@/lib/types"

/**
 * GET /api/categories/[categoryId]/words
 * Retrieves words for a category with view mode support (table/slider).
 * Supports pagination, sorting, and random ordering.
 * Requires authentication.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    // Verify authentication and get user ID
    const userId = await AuthService.getCurrentUserId()

    // Validate path parameters
    const resolvedParams = await params
    const validatedParams = categoryParamsSchema.parse(resolvedParams)

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      view: searchParams.get("view") || undefined,
      orderBy: searchParams.get("orderBy") || undefined,
      direction: searchParams.get("direction") || undefined,
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
      cursor: searchParams.get("cursor") || undefined,
    }

    const validatedQuery = categoryWordsQuerySchema.parse(queryParams)

    // Fetch words
    const result: CategoryWordsListDto = await WordService.getCategoryWords(
      userId,
      validatedParams.categoryId,
      validatedQuery
    )

    return okResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * POST /api/categories/[categoryId]/words
 * Creates a new word in a category.
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
    const validatedCommand = createWordCommandSchema.parse(body)

    // Create word
    const result: WordDto = await WordService.createWord(
      userId,
      validatedParams.categoryId,
      validatedCommand
    )

    return createdResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
}

