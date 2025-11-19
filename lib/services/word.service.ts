import { createClient } from '@/lib/supabase/server'
import type {
  WordDto,
  WordDetailDto,
  CategoryWordsListDto,
  CategoryWordsQueryDto,
  SearchWordsQueryDto,
  WordsListDto,
  CreateWordCommand,
  UpdateWordCommand,
} from '@/lib/types'
import { mapSupabaseError, NotFoundError, ForbiddenError, ValidationError } from '@/lib/errors'
import { calculateCursorPaginationMeta, trimToPageSize, mapOrderByToColumn } from '@/lib/pagination'

/**
 * Service for managing vocabulary words.
 */
export class WordService {
  /**
   * Retrieves words for a specific category with view mode support.
   */
  static async getCategoryWords(
    userId: string,
    categoryId: string,
    query: CategoryWordsQueryDto
  ): Promise<CategoryWordsListDto> {
    const supabase = await createClient()

    // Verify user owns the category
    await this.verifyCategoryOwnership(userId, categoryId)

    const page = query.page || 1
    const pageSize = query.pageSize || 10
    const view = query.view || 'table'
    const orderBy = query.orderBy || 'createdAt'
    const direction = query.direction || 'desc'

    // Build base query
    let selectQuery = supabase
      .schema('app')
      .from('words')
      .select('*')
      .eq('category_id', categoryId)
      .eq('user_id', userId)

    // Apply sorting (handle random ordering specially)
    if (orderBy === 'random') {
      // For random ordering, we can't use standard order
      // Fetch all and shuffle, or use a postgres random function
      // For now, we'll fetch with a seed-based approach
      selectQuery = selectQuery.order('id', { ascending: true })
    } else {
      const column = mapOrderByToColumn(orderBy)
      selectQuery = selectQuery.order(column, { ascending: direction === 'asc' })
    }

    // Apply pagination (fetch one extra to check for more results)
    const offset = (page - 1) * pageSize
    selectQuery = selectQuery.range(offset, offset + pageSize)

    const { data, error } = await selectQuery

    if (error) {
      throw mapSupabaseError(error)
    }

    let items = data || []

    // Apply random shuffle if needed (client-side for simplicity)
    if (orderBy === 'random') {
      items = this.shuffleArray([...items])
    }

    const trimmedItems = trimToPageSize(items, pageSize)

    // Build DTOs
    const words: WordDto[] = trimmedItems.map(item => ({
      id: item.id,
      learningLanguageId: item.user_learning_language_id,
      categoryId: item.category_id,
      term: item.term,
      translation: item.translation,
      examplesMd: item.examples_md,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }))

    // Generate cursor from last item
    const lastItem = trimmedItems[trimmedItems.length - 1]
    const nextCursor = lastItem ? lastItem.id : undefined

    const meta = {
      ...calculateCursorPaginationMeta(page, pageSize, items.length, nextCursor),
      view,
      orderBy,
      direction,
    }

    return {
      data: words,
      meta,
    }
  }

  /**
   * Global search for words across learning languages and categories.
   */
  static async searchWords(userId: string, query: SearchWordsQueryDto): Promise<WordsListDto> {
    const supabase = await createClient()

    const page = query.page || 1
    const pageSize = query.pageSize || 10
    const orderBy = query.orderBy || 'createdAt'
    const direction = query.direction || 'desc'

    // Build base query
    let selectQuery = supabase.schema('app').from('words').select('*').eq('user_id', userId)

    // Apply filters
    if (query.learningLanguageId) {
      selectQuery = selectQuery.eq('user_learning_language_id', query.learningLanguageId)
    }

    if (query.categoryId) {
      selectQuery = selectQuery.eq('category_id', query.categoryId)
    }

    if (query.search) {
      // Search in both term and translation fields
      selectQuery = selectQuery.or(
        `term.ilike.%${query.search}%,translation.ilike.%${query.search}%`
      )
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

    // Build DTOs
    const words: WordDto[] = trimmedItems.map(item => ({
      id: item.id,
      learningLanguageId: item.user_learning_language_id,
      categoryId: item.category_id,
      term: item.term,
      translation: item.translation,
      examplesMd: item.examples_md,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }))

    // Generate cursor from last item
    const lastItem = trimmedItems[trimmedItems.length - 1]
    const nextCursor = lastItem ? lastItem.id : undefined

    const meta = calculateCursorPaginationMeta(page, pageSize, items.length, nextCursor)

    return {
      data: words,
      meta,
    }
  }

  /**
   * Retrieves a single word with full details.
   */
  static async getWordDetail(userId: string, wordId: string): Promise<WordDetailDto> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .schema('app')
      .from('words')
      .select('*')
      .eq('id', wordId)
      .eq('user_id', userId)
      .single()

    if (error) {
      throw mapSupabaseError(error)
    }

    if (!data) {
      throw new NotFoundError('Word')
    }

    return {
      id: data.id,
      userId: data.user_id,
      learningLanguageId: data.user_learning_language_id,
      categoryId: data.category_id,
      term: data.term,
      translation: data.translation,
      examplesMd: data.examples_md,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  /**
   * Creates a new word in a category.
   */
  static async createWord(
    userId: string,
    categoryId: string,
    command: CreateWordCommand
  ): Promise<WordDto> {
    const supabase = await createClient()

    // Verify user owns the category
    await this.verifyCategoryOwnership(userId, categoryId)

    // Insert the word (triggers will set user_id and user_learning_language_id)
    const { data, error } = await supabase
      .schema('app')
      .from('words')
      .insert({
        category_id: categoryId,
        term: command.term,
        translation: command.translation,
        examples_md: command.examplesMd,
      })
      .select()
      .single()

    if (error) {
      throw mapSupabaseError(error)
    }

    return {
      id: data.id,
      learningLanguageId: data.user_learning_language_id,
      categoryId: data.category_id,
      term: data.term,
      translation: data.translation,
      examplesMd: data.examples_md,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  /**
   * Updates an existing word.
   */
  static async updateWord(
    userId: string,
    wordId: string,
    command: UpdateWordCommand
  ): Promise<WordDto> {
    const supabase = await createClient()

    // Validate that at least one field is provided
    if (Object.keys(command).length === 0) {
      throw new ValidationError('No fields provided for update')
    }

    // Build update object (only include defined fields)
    const updateData: Record<string, any> = {}
    if (command.term !== undefined) {
      updateData.term = command.term
    }
    if (command.translation !== undefined) {
      updateData.translation = command.translation
    }
    if (command.examplesMd !== undefined) {
      updateData.examples_md = command.examplesMd
    }

    // Update the word (RLS ensures user ownership)
    const { data, error } = await supabase
      .schema('app')
      .from('words')
      .update(updateData)
      .eq('id', wordId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw mapSupabaseError(error)
    }

    if (!data) {
      throw new NotFoundError('Word')
    }

    return {
      id: data.id,
      learningLanguageId: data.user_learning_language_id,
      categoryId: data.category_id,
      term: data.term,
      translation: data.translation,
      examplesMd: data.examples_md,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  /**
   * Deletes a word.
   */
  static async deleteWord(userId: string, wordId: string): Promise<void> {
    const supabase = await createClient()

    // Delete the word (RLS ensures user ownership)
    const { error } = await supabase
      .schema('app')
      .from('words')
      .delete()
      .eq('id', wordId)
      .eq('user_id', userId)

    if (error) {
      throw mapSupabaseError(error)
    }
  }

  /**
   * Helper to verify that a user owns a category.
   */
  private static async verifyCategoryOwnership(userId: string, categoryId: string): Promise<void> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .schema('app')
      .from('categories')
      .select('id')
      .eq('id', categoryId)
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      throw new ForbiddenError('Category not found or access denied')
    }
  }

  /**
   * Helper to shuffle an array (Fisher-Yates algorithm).
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}
