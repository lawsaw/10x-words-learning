import { createClient } from '@/lib/supabase/server'
import type {
  VocabularyOverviewEntryDto,
  VocabularyOverviewListDto,
  VocabularyOverviewQueryDto,
} from '@/lib/types'
import { mapSupabaseError } from '@/lib/errors'
import { calculatePaginationMeta, trimToPageSize, mapOrderByToColumn } from '@/lib/pagination'

/**
 * Service for vocabulary overview analytics and reporting.
 */
export class VocabularyOverviewService {
  /**
   * Retrieves an aggregated view of user's vocabulary across all learning languages.
   */
  static async getVocabularyOverview(
    userId: string,
    query: VocabularyOverviewQueryDto
  ): Promise<VocabularyOverviewListDto> {
    const supabase = await createClient()

    const page = query.page || 1
    const pageSize = query.pageSize || 20
    const orderBy = query.orderBy || 'createdAt'
    const direction = query.direction || 'desc'

    // Build base query from the vocabulary_overview view
    let selectQuery = supabase
      .schema('app')
      .from('vocabulary_overview')
      .select('*')
      .eq('user_id', userId)

    // Apply filters
    if (query.learningLanguageId) {
      selectQuery = selectQuery.eq('learning_language_id', query.learningLanguageId)
    }

    if (query.categoryId) {
      selectQuery = selectQuery.eq('category_id', query.categoryId)
    }

    // Apply sorting based on orderBy field
    let column: string
    switch (orderBy) {
      case 'category':
        column = 'category_name'
        break
      case 'language':
        column = 'learning_language_code'
        break
      case 'createdAt':
      default:
        column = 'created_at'
        break
    }

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

    // Build DTOs
    const entries: VocabularyOverviewEntryDto[] = trimmedItems.map(item => ({
      learningLanguageId: item.learning_language_id,
      learningLanguageCode: item.learning_language_code,
      categoryId: item.category_id,
      categoryName: item.category_name,
      wordId: item.word_id,
      term: item.term,
      translation: item.translation,
      createdAt: item.created_at,
    }))

    const meta = calculatePaginationMeta(page, pageSize, items.length)

    return {
      data: entries,
      meta,
    }
  }
}
