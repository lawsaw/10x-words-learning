import { createClient } from "@/lib/supabase/server"
import type { LanguageDto, LanguagesListDto, LanguagesQueryDto } from "@/lib/types"
import { mapSupabaseError } from "@/lib/errors"

/**
 * Service for managing language catalog operations.
 */
export class LanguageService {
  /**
   * Retrieves the list of available languages, optionally filtered by scope.
   * Note: Scope filtering requires additional database fields (available_for_registration, available_for_learning)
   * that can be added via migration. Currently returns all languages regardless of scope.
   */
  static async getLanguages(
    query: LanguagesQueryDto
  ): Promise<LanguagesListDto> {
    try {
      const supabase = await createClient()

      const languageQuery = supabase
        .schema("app")
        .from("languages")
        .select("code, name")
        .order("name", { ascending: true })

      const { data, error } = await languageQuery

      if (error) {
        throw mapSupabaseError(error)
      }

      const languages: LanguageDto[] = (data || []).map((lang) => ({
        code: lang.code,
        name: lang.name,
      }))

      return {
        languages,
      }
    } catch (error) {
      throw error instanceof Error ? error : mapSupabaseError(error)
    }
  }
}

