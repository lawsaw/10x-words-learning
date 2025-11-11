import { NextRequest } from "next/server"
import { AuthService } from "@/lib/services/auth.service"
import { CategoryService } from "@/lib/services/category.service"
import {
  categoryParamsSchema,
  updateCategoryCommandSchema,
} from "@/lib/validation"
import { okResponse, noContentResponse, errorResponse } from "@/lib/response"
import type { CategoryDto } from "@/lib/types"

/**
 * PATCH /api/categories/[categoryId]
 * Updates a category name.
 * Requires authentication and ownership.
 */
export async function PATCH(
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
    const validatedCommand = updateCategoryCommandSchema.parse(body)

    // Update category
    const result: CategoryDto = await CategoryService.updateCategory(
      userId,
      validatedParams.categoryId,
      validatedCommand
    )

    return okResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * DELETE /api/categories/[categoryId]
 * Deletes a category and all its words.
 * Requires authentication and ownership.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    // Verify authentication and get user ID
    const userId = await AuthService.getCurrentUserId()

    // Validate path parameters
    const resolvedParams = await params
    const validatedParams = categoryParamsSchema.parse(resolvedParams)

    // Delete category
    await CategoryService.deleteCategory(userId, validatedParams.categoryId)

    return noContentResponse()
  } catch (error) {
    return errorResponse(error)
  }
}

