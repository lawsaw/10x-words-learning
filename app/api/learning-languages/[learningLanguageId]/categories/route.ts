import { NextRequest } from "next/server"
import { AuthService } from "@/lib/services/auth.service"
import { CategoryService } from "@/lib/services/category.service"
import {
  learningLanguageParamsSchema,
  categoriesQuerySchema,
  createCategoryCommandSchema,
} from "@/lib/validation"
import { okResponse, createdResponse, errorResponse } from "@/lib/response"
import type { CategoriesListDto, CategoryDto } from "@/lib/types"

/**
 * GET /api/learning-languages/[learningLanguageId]/categories
 * Retrieves the list of categories for a learning language.
 * Supports search, pagination, and sorting.
 * Requires authentication.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ learningLanguageId: string }> }
) {
  try {
    // Verify authentication and get user ID
    const userId = await AuthService.getCurrentUserId()

    // Validate path parameters
    const resolvedParams = await params
    const validatedParams = learningLanguageParamsSchema.parse(resolvedParams)

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
      orderBy: searchParams.get("orderBy") || undefined,
      direction: searchParams.get("direction") || undefined,
    }

    const validatedQuery = categoriesQuerySchema.parse(queryParams)

    // Fetch categories
    const result: CategoriesListDto = await CategoryService.getCategories(
      userId,
      validatedParams.learningLanguageId,
      validatedQuery
    )

    return okResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * POST /api/learning-languages/[learningLanguageId]/categories
 * Creates a new category for a learning language.
 * Requires authentication.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ learningLanguageId: string }> }
) {
  try {
    // Verify authentication and get user ID
    const userId = await AuthService.getCurrentUserId()

    // Validate path parameters
    const resolvedParams = await params
    const validatedParams = learningLanguageParamsSchema.parse(resolvedParams)

    // Parse and validate request body
    const body = await request.json()
    const validatedCommand = createCategoryCommandSchema.parse(body)

    // Create category
    const result: CategoryDto = await CategoryService.createCategory(
      userId,
      validatedParams.learningLanguageId,
      validatedCommand
    )

    return createdResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
}

