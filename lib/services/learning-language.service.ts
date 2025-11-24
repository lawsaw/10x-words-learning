import { createClient } from '@/lib/supabase/server'
import type {
  LearningLanguageDto,
  LearningLanguagesListDto,
  LearningLanguagesQueryDto,
  CreateLearningLanguageCommand,
} from '@/lib/types'
import { mapSupabaseError, ValidationError } from '@/lib/errors'
import { calculateCursorPaginationMeta, trimToPageSize } from '@/lib/pagination'

/**
 * Service for managing user learning languages.
 */
export class LearningLanguageService {
  /**
   * Retrieves the list of learning languages for the authenticated user.
   */
  static async getLearningLanguages(
    userId: string,
    query: LearningLanguagesQueryDto
  ): Promise<LearningLanguagesListDto> {
    const supabase = await createClient()

    const page = query.page || 1
    const pageSize = query.pageSize || 10
    const includeStats = query.includeStats || false

    // Build base query
    let selectQuery = supabase
      .schema('app')
      .from('user_learning_languages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Apply pagination (fetch one extra to check for more results)
    const offset = (page - 1) * pageSize
    selectQuery = selectQuery.range(offset, offset + pageSize)

    const { data, error } = await selectQuery

    if (error) {
      throw mapSupabaseError(error)
    }

    const items = data || []
    const trimmedItems = trimToPageSize(items, pageSize)

    // Build DTOs with optional stats
    const learningLanguages: LearningLanguageDto[] = await Promise.all(
      trimmedItems.map(async item => {
        const dto: LearningLanguageDto = {
          id: item.id,
          languageId: item.language_id,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }

        // Fetch stats if requested
        if (includeStats) {
          const stats = await this.getLanguageStats(item.id)
          dto.stats = stats
        }

        return dto
      })
    )

    // Generate cursor from last item
    const lastItem = trimmedItems[trimmedItems.length - 1]
    const nextCursor = lastItem ? lastItem.id : undefined

    const meta = calculateCursorPaginationMeta(page, pageSize, items.length, nextCursor)

    return {
      data: learningLanguages,
      meta,
    }
  }

  /**
   * Creates a new learning language for the authenticated user.
   */
  static async createLearningLanguage(
    userId: string,
    command: CreateLearningLanguageCommand
  ): Promise<LearningLanguageDto> {
    const supabase = await createClient()

    // Validate that the language exists
    const { data: languageExists, error: languageError } = await supabase
      .schema('app')
      .from('languages')
      .select('code')
      .eq('code', command.languageId)
      .single()

    if (languageError || !languageExists) {
      throw new ValidationError(`Language '${command.languageId}' is not available`)
    }

    // Check if user is trying to add their profile language
    const { data: profileData, error: profileError } = await supabase
      .schema('app')
      .from('profiles')
      .select('user_language_id')
      .eq('user_id', userId)
      .single()

    if (profileError) {
      throw mapSupabaseError(profileError)
    }

    if (profileData.user_language_id === command.languageId) {
      throw new ValidationError('Cannot add your interface language as a learning language')
    }

    // Insert the learning language
    const { data, error } = await supabase
      .schema('app')
      .from('user_learning_languages')
      .insert({
        user_id: userId,
        language_id: command.languageId,
      })
      .select()
      .single()

    if (error) {
      throw mapSupabaseError(error)
    }

    return {
      id: data.id,
      languageId: data.language_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  /**
   * Deletes a learning language for the authenticated user.
   */
  static async deleteLearningLanguage(userId: string, learningLanguageId: string): Promise<void> {
    const supabase = await createClient()

    // Delete the learning language (RLS ensures user ownership)
    const { error } = await supabase
      .schema('app')
      .from('user_learning_languages')
      .delete()
      .eq('id', learningLanguageId)
      .eq('user_id', userId)

    if (error) {
      throw mapSupabaseError(error)
    }
  }

  /**
   * Helper to get stats for a learning language (categories and words count).
   */
  private static async getLanguageStats(
    learningLanguageId: string
  ): Promise<{ categories: number; words: number }> {
    const supabase = await createClient()

    // Count categories
    const { count: categoriesCount, error: categoriesError } = await supabase
      .schema('app')
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('user_learning_language_id', learningLanguageId)

    if (categoriesError) {
      throw mapSupabaseError(categoriesError)
    }

    // Count words
    const { count: wordsCount, error: wordsError } = await supabase
      .schema('app')
      .from('words')
      .select('*', { count: 'exact', head: true })
      .eq('user_learning_language_id', learningLanguageId)

    if (wordsError) {
      throw mapSupabaseError(wordsError)
    }

    return {
      categories: categoriesCount || 0,
      words: wordsCount || 0,
    }
  }
}
