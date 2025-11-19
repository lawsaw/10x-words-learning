import { createClient } from '@/lib/supabase/server'
import type { LanguageDto, LanguagesListDto, LanguagesQueryDto } from '@/lib/types'
import { DomainError, ErrorCode, mapSupabaseError } from '@/lib/errors'

const FALLBACK_LANGUAGES: LanguageDto[] = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German' },
  { code: 'pl', name: 'Polish' },
  { code: 'ru', name: 'Russian' },
  { code: 'uk', name: 'Ukrainian' },
]

/**
 * Service for managing language catalog operations.
 */
export class LanguageService {
  /**
   * Retrieves the list of available languages, optionally filtered by scope.
   * Note: Scope filtering requires additional database fields (available_for_registration, available_for_learning)
   * that can be added via migration. Currently returns all languages regardless of scope.
   */
  static async getLanguages(query: LanguagesQueryDto): Promise<LanguagesListDto> {
    try {
      const supabase = await createClient()

      const languageQuery = supabase
        .schema('app')
        .from('languages')
        .select('code, name')
        .order('name', { ascending: true })

      const { data, error } = await languageQuery

      if (error) {
        throw mapSupabaseError(error)
      }

      const languages: LanguageDto[] = (data || []).map(lang => ({
        code: lang.code,
        name: lang.name,
      }))

      return {
        languages,
      }
    } catch (error) {
      const normalizedError =
        error instanceof DomainError
          ? error
          : error instanceof Error
            ? error
            : mapSupabaseError(error)

      // if (normalizedError instanceof DomainError && normalizedError.code === ErrorCode.Forbidden) {
      //   console.warn("[LanguageService] Falling back to static language list due to access error", {
      //     error: normalizedError.message,
      //   })

      //   return {
      //     languages: FALLBACK_LANGUAGES,
      //   }
      // }

      throw normalizedError
    }
  }
}
