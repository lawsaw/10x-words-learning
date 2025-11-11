import type {
  GenerateWordsCommand,
  AiGeneratedWordsDto,
  GeneratedWordSuggestionDto,
} from "@/lib/types"
import {
  ValidationError,
  ExternalServiceError,
  RateLimitError,
  DomainError,
  ErrorCode,
} from "@/lib/errors"
import { sanitizeMarkdown } from "@/lib/sanitize"

/**
 * Service for AI-powered word generation using OpenRouter.
 */
export class AiGenerationService {
  private static readonly OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
  private static readonly DEFAULT_MODEL = "openai/gpt-4o-mini"
  private static readonly REQUEST_TIMEOUT = 30000 // 30 seconds

  /**
   * Generates word suggestions using AI based on learning context.
   */
  static async generateWords(
    command: GenerateWordsCommand
  ): Promise<AiGeneratedWordsDto> {
    // Validate API key is configured
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      throw new ValidationError(
        "AI generation is not configured. Please contact support."
      )
    }

    // Compose the prompt
    const prompt = this.composePrompt(command)

    try {
      // Call OpenRouter API
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT)

      const response = await fetch(this.OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "10xWordsLearning",
        },
        body: JSON.stringify({
          model: this.DEFAULT_MODEL,
          messages: [
            {
              role: "system",
              content: "You are a helpful language learning assistant that generates vocabulary words with translations and examples in valid JSON format.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: command.temperature,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Handle rate limiting
      if (response.status === 429) {
        throw new RateLimitError("AI service rate limit exceeded. Please try again later.")
      }

      // Handle API errors
      if (!response.ok) {
        const errorText = await response.text()
        console.error("OpenRouter API error:", response.status, errorText)
        throw new ExternalServiceError(
          "OpenRouter",
          `API request failed with status ${response.status}`
        )
      }

      const data = await response.json()

      // Extract the generated content
      const content = data.choices?.[0]?.message?.content
      if (!content) {
        throw new DomainError(
          ErrorCode.InvalidAIResponse,
          "AI response missing content",
          422
        )
      }

      // Parse JSON response
      let parsedContent
      try {
        parsedContent = JSON.parse(content)
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON:", content)
        throw new DomainError(
          ErrorCode.InvalidAIResponse,
          "AI response is not valid JSON",
          422
        )
      }

      // Validate response structure
      const suggestions = this.validateAndExtractSuggestions(
        parsedContent,
        command.count || 5
      )

      // Extract usage information
      const usage = {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
      }

      const model = data.model || this.DEFAULT_MODEL

      return {
        generated: suggestions,
        model,
        usage,
      }
    } catch (error) {
      // Handle fetch abort (timeout)
      if (error instanceof Error && error.name === "AbortError") {
        throw new ExternalServiceError(
          "OpenRouter",
          "AI request timed out. Please try again."
        )
      }

      // Re-throw domain errors
      if (error instanceof DomainError) {
        throw error
      }

      // Handle network errors
      console.error("AI generation error:", error)
      throw new ExternalServiceError(
        "OpenRouter",
        "Failed to generate words. Please try again later."
      )
    }
  }

  /**
   * Composes the prompt for word generation based on command parameters.
   */
  private static composePrompt(command: GenerateWordsCommand): string {
    const difficultyDescriptions = {
      easy: "common, everyday vocabulary suitable for beginners (A1-A2 level)",
      medium: "intermediate vocabulary for regular conversations (B1-B2 level)",
      advanced: "sophisticated vocabulary for advanced learners (C1-C2 level)",
    }

    const difficulty = command.difficulty || "medium"
    const difficultyDesc = difficultyDescriptions[difficulty]
    const count = command.count || 5

    let prompt = `Generate ${count} ${difficultyDesc} words or phrases in "${command.learningLanguageId}" language.`

    if (command.categoryContext) {
      prompt += ` The words should be related to the following topic or context: "${command.categoryContext}".`
    }

    prompt += `\n\nFor each word, provide:
1. "term": the word or phrase in ${command.learningLanguageId}
2. "translation": the translation in ${command.userLanguage}
3. "examplesMd": 1-3 example sentences in ${command.learningLanguageId} showing usage, formatted as markdown list items (use "- " prefix). Keep examples concise and practical.

Return ONLY a JSON object with this exact structure:
{
  "words": [
    {
      "term": "word in ${command.learningLanguageId}",
      "translation": "translation in ${command.userLanguage}",
      "examplesMd": "- Example sentence 1\\n- Example sentence 2"
    }
  ]
}

IMPORTANT: Return ONLY valid JSON, no additional text or explanations.`

    return prompt
  }

  /**
   * Validates and extracts word suggestions from AI response.
   */
  private static validateAndExtractSuggestions(
    response: any,
    expectedCount: number
  ): GeneratedWordSuggestionDto[] {
    // Check if response has words array
    if (!response.words || !Array.isArray(response.words)) {
      throw new DomainError(
        ErrorCode.InvalidAIResponse,
        "AI response missing 'words' array",
        422
      )
    }

    const words = response.words

    // Validate we have at least one suggestion
    if (words.length === 0) {
      throw new DomainError(
        ErrorCode.InvalidAIResponse,
        "AI generated no word suggestions",
        422
      )
    }

    // Validate and sanitize each suggestion
    const suggestions: GeneratedWordSuggestionDto[] = []

    for (let i = 0; i < Math.min(words.length, expectedCount); i++) {
      const word = words[i]

      // Validate required fields
      if (!word.term || typeof word.term !== "string") {
        console.warn(`Skipping word ${i}: missing or invalid term`)
        continue
      }

      if (!word.translation || typeof word.translation !== "string") {
        console.warn(`Skipping word ${i}: missing or invalid translation`)
        continue
      }

      // Sanitize and validate lengths
      const term = word.term.trim().substring(0, 500)
      const translation = word.translation.trim().substring(0, 500)
      const examplesMd = word.examplesMd
        ? sanitizeMarkdown(word.examplesMd.trim()).substring(0, 2000)
        : ""

      if (!term || !translation) {
        console.warn(`Skipping word ${i}: empty term or translation after sanitization`)
        continue
      }

      suggestions.push({
        term,
        translation,
        examplesMd,
      })
    }

    // Ensure we have at least one valid suggestion
    if (suggestions.length === 0) {
      throw new DomainError(
        ErrorCode.InvalidAIResponse,
        "No valid word suggestions after validation",
        422
      )
    }

    return suggestions
  }
}

