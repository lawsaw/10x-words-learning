import { createClient } from '@/lib/supabase/server'
import type {
  CategoryDto,
  CategoriesListDto,
  CategoriesQueryDto,
  CreateCategoryCommand,
  UpdateCategoryCommand,
} from '@/lib/types'
import { mapSupabaseError, NotFoundError, ForbiddenError } from '@/lib/errors'
import { calculatePaginationMeta, trimToPageSize, mapOrderByToColumn } from '@/lib/pagination'

/**
 * Service for managing vocabulary categories.
 */
export class CategoryService {
  /**
   * Retrieves the list of categories for a learning language.
   */
  static async getCategories(
    userId: string,
    learningLanguageId: string,
    query: CategoriesQueryDto
  ): Promise<CategoriesListDto> {
    const supabase = await createClient()

    // Verify user owns the learning language
    await this.verifyLearningLanguageOwnership(userId, learningLanguageId)

    const page = query.page || 1
    const pageSize = query.pageSize || 10
    const orderBy = query.orderBy || 'createdAt'
    const direction = query.direction || 'desc'

    // Build base query with word count
    let selectQuery = supabase
      .schema('app')
      .from('categories')
      .select('*, words(count)')
      .eq('user_learning_language_id', learningLanguageId)
      .eq('user_id', userId)

    // Apply search filter if provided
    if (query.search) {
      selectQuery = selectQuery.ilike('name', `%${query.search}%`)
    }

    // Apply sorting
    const column = mapOrderByToColumn(orderBy)
    selectQuery = selectQuery.order(column, { ascending: direction === 'asc' })

    // Apply pagination (fetch one extra to check for more results)
    const offset = (page - 1) * pageSize
    selectQuery = selectQuery.range(offset, offset + pageSize)

    const { data, error } = await selectQuery

    if (error) {
      throw mapSupabaseError(error)
    }

    const items = data || []
    const trimmedItems = trimToPageSize(items, pageSize)

    // Build DTOs with word count
    const categories: CategoryDto[] = trimmedItems.map(item => ({
      id: item.id,
      learningLanguageId: item.user_learning_language_id,
      name: item.name,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      wordCount: Array.isArray(item.words) ? item.words.length : 0,
    }))

    const meta = calculatePaginationMeta(page, pageSize, items.length)

    return {
      data: categories,
      meta,
    }
  }

  /**
   * Creates a new category for a learning language.
   */
  static async createCategory(
    userId: string,
    learningLanguageId: string,
    command: CreateCategoryCommand
  ): Promise<CategoryDto> {
    const supabase = await createClient()

    // Verify user owns the learning language
    await this.verifyLearningLanguageOwnership(userId, learningLanguageId)

    // Insert the category
    const { data, error } = await supabase
      .schema('app')
      .from('categories')
      .insert({
        user_learning_language_id: learningLanguageId,
        name: command.name,
      })
      .select()
      .single()

    if (error) {
      throw mapSupabaseError(error)
    }

    return {
      id: data.id,
      learningLanguageId: data.user_learning_language_id,
      name: data.name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  /**
   * Updates a category name.
   */
  static async updateCategory(
    userId: string,
    categoryId: string,
    command: UpdateCategoryCommand
  ): Promise<CategoryDto> {
    const supabase = await createClient()

    // Update the category (RLS ensures user ownership)
    const { data, error } = await supabase
      .schema('app')
      .from('categories')
      .update({
        name: command.name,
      })
      .eq('id', categoryId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw mapSupabaseError(error)
    }

    if (!data) {
      throw new NotFoundError('Category')
    }

    return {
      id: data.id,
      learningLanguageId: data.user_learning_language_id,
      name: data.name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  /**
   * Deletes a category.
   */
  static async deleteCategory(userId: string, categoryId: string): Promise<void> {
    const supabase = await createClient()

    // Delete the category (RLS ensures user ownership, cascade deletes words)
    const { error } = await supabase
      .schema('app')
      .from('categories')
      .delete()
      .eq('id', categoryId)
      .eq('user_id', userId)

    if (error) {
      throw mapSupabaseError(error)
    }
  }

  /**
   * Helper to verify that a user owns a learning language.
   */
  private static async verifyLearningLanguageOwnership(
    userId: string,
    learningLanguageId: string
  ): Promise<void> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .schema('app')
      .from('user_learning_languages')
      .select('id')
      .eq('id', learningLanguageId)
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      throw new ForbiddenError('Learning language not found or access denied')
    }
  }
}
