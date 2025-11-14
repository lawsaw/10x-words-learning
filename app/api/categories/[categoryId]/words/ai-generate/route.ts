import { NextRequest } from "next/server"
import { AuthService } from "@/lib/services/auth.service"
import { AiGenerationService } from "@/lib/services/ai-generation.service"
import {
  categoryParamsSchema,
  generateWordsCommandSchema,
} from "@/lib/validation"
import { okResponse, errorResponse } from "@/lib/response"
import type { AiGeneratedWordsDto } from "@/lib/types"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/categories/[categoryId]/words/ai-generate
 * Generates word suggestions using AI for a specific category.
 * Does not persist words - returns suggestions for user review.
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
    const validatedCommand = generateWordsCommandSchema.parse(body)

    const supabase = await createClient()

    const { data: categoryRow } = await supabase
      .schema("app")
      .from("categories")
      .select("name, user_learning_language_id")
      .eq("id", validatedParams.categoryId)
      .eq("user_id", userId)
      .single()

    if (!categoryRow) {
      throw new Error("Category not found")
    }

    const { data: learningRow } = await supabase
      .schema("app")
      .from("user_learning_languages")
      .select("language_id")
      .eq("id", categoryRow.user_learning_language_id)
      .eq("user_id", userId)
      .single()

    const learningLanguageCodeFromProfile =
      (learningRow as { language_id?: string } | null)?.language_id

    const { data: languageRow } = await supabase
      .schema("app")
      .from("languages")
      .select("name")
      .eq("code", learningLanguageCodeFromProfile ?? validatedCommand.learningLanguageId)
      .single()

    const { data: existingWords } = await supabase
      .schema("app")
      .from("words")
      .select("term")
      .eq("category_id", validatedParams.categoryId)
      .eq("user_id", userId)

    const databaseTerms = (existingWords ?? [])
      .map((word) => word.term?.toLowerCase().trim())
      .filter((term): term is string => Boolean(term))

    const clientExclude = (validatedCommand.excludeTerms ?? [])
      .map((term) => term.toLowerCase().trim())
      .filter((term) => term.length > 0)

    // Generate word suggestions
    const result: AiGeneratedWordsDto =
      await AiGenerationService.generateWords({
        ...validatedCommand,
        categoryContext: validatedCommand.categoryContext ?? categoryRow.name,
        learningLanguageName: languageRow?.name,
        excludeTerms: Array.from(new Set([...databaseTerms, ...clientExclude])),
      })

    if (!result.generated?.[0]) {
      throw new Error("AI did not return a valid suggestion")
    }

    return okResponse(result)
  } catch (error) {
    return errorResponse(error)
  }
}

