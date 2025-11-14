import { useCallback, useState } from "react"

import type {
  AiGenerationRequest,
  GeneratedWordSuggestionDto,
} from "@/lib/types"

type UseAiWordGenerationOptions = {
  categoryId: string
  learningLanguageId: string
  learningLanguageName?: string
  userLanguage: string
  categoryName?: string
  excludeTerms?: string[]
  onError?: (message: string | null) => void
}

type UseAiWordGenerationResult = {
  aiBusy: boolean
  error: string | null
  generate: (
    difficulty: AiGenerationRequest["difficulty"],
  ) => Promise<GeneratedWordSuggestionDto | null>
  resetError: () => void
}

export function useAiWordGeneration({
  categoryId,
  learningLanguageId,
  learningLanguageName,
  userLanguage,
  categoryName,
  excludeTerms,
  onError,
}: UseAiWordGenerationOptions): UseAiWordGenerationResult {
  const [aiBusy, setAiBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const emitError = useCallback(
    (message: string | null) => {
      setError(message)
      if (onError) {
        onError(message)
      }
    },
    [onError],
  )

  const resetError = useCallback(() => {
    emitError(null)
  }, [emitError])

  const generate = useCallback(
    async (difficulty: AiGenerationRequest["difficulty"]) => {
      setAiBusy(true)
      emitError(null)
      const jitteredTemperature = Math.min(0.9, Math.max(0.1, Math.random() * 0.3 + 0.35))

      try {
        const response = await fetch(
          `/api/categories/${categoryId}/words/ai-generate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              difficulty,
              learningLanguageId,
              learningLanguageName,
              userLanguage,
              excludeTerms,
              categoryContext: categoryName,
              temperature: jitteredTemperature,
              count: 1,
            } satisfies AiGenerationRequest),
          },
        )

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          const message =
            payload?.error?.message ??
            "Unable to generate word suggestion."
          emitError(message)
          return null
        }

        const payload = (await response.json()) as {
          generated: GeneratedWordSuggestionDto[]
        }

        const suggestion = payload.generated?.[0]

        if (!suggestion) {
          emitError("AI did not return any suggestions.")
          return null
        }

        emitError(null)
        return suggestion
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "AI generation failed unexpectedly."
        emitError(message)
        return null
      } finally {
        setAiBusy(false)
      }
    },
    [categoryId, learningLanguageId, learningLanguageName, userLanguage, categoryName, excludeTerms, emitError],
  )

  return {
    aiBusy,
    error,
    generate,
    resetError,
  }
}


