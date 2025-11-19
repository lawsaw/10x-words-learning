import type {
  GenerateWordsCommand,
  AiGeneratedWordsDto,
  GeneratedWordSuggestionDto,
  OpenRouterConfig,
} from '@/lib/types'
import { ValidationError, DomainError, ErrorCode } from '@/lib/errors'
import { sanitizeMarkdown } from '@/lib/sanitize'
import { OpenRouterService } from '@/lib/openrouter/service'
import { MessageComposer } from '@/lib/openrouter/message-composer'
import {
  OpenRouterConfigurationError,
  OpenRouterAuthError,
  OpenRouterRateLimitError,
} from '@/lib/openrouter/errors'

/**
 * Service for AI-powered word generation using OpenRouter.
 * This service uses the OpenRouterService for API communication.
 */
export class AiGenerationService {
  private static readonly DEFAULT_MODEL = 'openai/gpt-4o-mini'
  private static readonly OPENROUTER_API_URL = 'https://openrouter.ai/api/v1'

  /**
   * Creates an OpenRouterService instance with proper configuration.
   * @private
   */
  private static createOpenRouterService(): OpenRouterService {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      throw new ValidationError('AI generation is not configured. Please contact support.')
    }

    const config: OpenRouterConfig = {
      apiKey,
      baseUrl: this.OPENROUTER_API_URL,
      defaultModel: this.DEFAULT_MODEL,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      appTitle: '10xWordsLearning',
    }

    return new OpenRouterService(config, {
      logger: {
        info: (message, meta) => console.log(`[OpenRouter] ${message}`, meta),
        warn: (message, meta) => console.warn(`[OpenRouter] ${message}`, meta),
        error: (message, meta) => console.error(`[OpenRouter] ${message}`, meta),
      },
    })
  }

  /**
   * Generates word suggestions using AI based on learning context.
   */
  static async generateWords(command: GenerateWordsCommand): Promise<AiGeneratedWordsDto> {
    // Compose the prompt
    const prompt = this.composePrompt(command)

    // Debug: Log language detection
    console.log('[AI Generation] Language detection:', {
      learningLanguageId: command.learningLanguageId,
      learningLanguageName: command.learningLanguageName,
      isLearningEnglish:
        this.isEnglishLanguage(command.learningLanguageId) ||
        this.isEnglishLanguage(command.learningLanguageName),
      userLanguage: command.userLanguage,
      userLanguageName: command.userLanguageName,
    })

    try {
      // Create OpenRouter service instance
      const openRouterService = this.createOpenRouterService()

      // Note: We'll post-process translations for English later, but we can still hint to the AI
      // Prepare system message
      const systemMessage =
        'You are a helpful language learning assistant that generates vocabulary words with translations and examples in valid JSON format.'

      // Prepare messages
      const messages = [
        MessageComposer.createSystemMessage(systemMessage),
        MessageComposer.createUserMessage(prompt),
      ]

      // Send chat request
      const response = await openRouterService.sendChat({
        messages,
        parameters: {
          temperature: command.temperature,
        },
        responseFormat: {
          type: 'json_object',
        },
      })

      // Extract the generated content
      const content = response.choices?.[0]?.message?.content
      if (!content) {
        throw new DomainError(ErrorCode.InvalidAIResponse, 'AI response missing content', 422)
      }

      // Parse JSON response
      let parsedContent
      try {
        parsedContent = JSON.parse(content)
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', content)
        throw new DomainError(ErrorCode.InvalidAIResponse, 'AI response is not valid JSON', 422)
      }

      // Validate response structure
      const suggestions = this.validateAndExtractSuggestions(
        parsedContent,
        command.count || 1,
        command.excludeTerms,
        command.learningLanguageName ?? command.learningLanguageId
      )

      // Post-process TERMS for English learning: add articles and "to" for verbs
      const isLearningEnglish =
        this.isEnglishLanguage(command.learningLanguageId) ||
        this.isEnglishLanguage(command.learningLanguageName)

      if (isLearningEnglish) {
        suggestions.forEach(suggestion => {
          suggestion.term = this.enhanceEnglishTranslation(suggestion.term)
        })
      }

      // Extract usage information
      const usage = {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
      }

      return {
        generated: suggestions,
        model: response.model,
        usage,
      }
    } catch (error) {
      // Handle OpenRouter-specific errors
      if (error instanceof OpenRouterConfigurationError) {
        throw new ValidationError('AI generation is not configured. Please contact support.')
      }

      if (error instanceof OpenRouterAuthError) {
        throw new ValidationError('AI service authentication failed. Please contact support.')
      }

      if (error instanceof OpenRouterRateLimitError) {
        throw new DomainError(
          ErrorCode.RateLimited,
          'AI service rate limit exceeded. Please try again later.',
          429
        )
      }

      // Re-throw domain errors
      if (error instanceof DomainError) {
        throw error
      }

      // Handle unexpected errors
      console.error('AI generation error:', error)
      throw new DomainError(
        ErrorCode.ExternalServiceError,
        'Failed to generate words. Please try again later.',
        500
      )
    }
  }

  /**
   * Composes the prompt for word generation based on command parameters.
   */
  private static composePrompt(command: GenerateWordsCommand): string {
    const difficultyDescriptions = {
      easy: 'common, everyday vocabulary suitable for beginners (A1-A2 level)',
      medium: 'intermediate vocabulary for regular conversations (B1-B2 level)',
      advanced: 'sophisticated vocabulary for advanced learners (C1-C2 level)',
    }

    const difficulty = command.difficulty || 'medium'
    const difficultyDesc = difficultyDescriptions[difficulty]
    const count = command.count || 5

    const learningLanguageLabel = command.learningLanguageName ?? command.learningLanguageId
    const userLanguageLabel = command.userLanguageName ?? command.userLanguage

    // Check if translation language is English
    const isEnglishTranslation =
      this.isEnglishLanguage(command.userLanguage) ||
      this.isEnglishLanguage(command.userLanguageName)

    let prompt = `Generate ${count} distinct ${difficultyDesc} words or phrases in ${learningLanguageLabel}.`

    if (command.categoryContext) {
      prompt += ` The words should be related to the following topic or context: "${command.categoryContext}".`
    }

    if (command.excludeTerms && command.excludeTerms.length > 0) {
      prompt += ` Avoid generating any of the following existing terms: ${command.excludeTerms
        .map(item => `"${item}"`)
        .join(', ')}.`
    }

    prompt += `

For each word, provide:
1. "term": the word or phrase in ${learningLanguageLabel}
2. "translation": the translation in ${userLanguageLabel}
3. "examplesMd": exactly 5 concise example sentences in ${learningLanguageLabel} showing usage, formatted as markdown list items (each sentence prefixed with "- "). Sentences should be practical and no longer than 120 characters.`

    // Check if learning English (terms should have articles/to)
    const isLearningEnglish =
      this.isEnglishLanguage(command.learningLanguageId) ||
      this.isEnglishLanguage(command.learningLanguageName)

    // Add English-specific term rules when learning English
    if (isLearningEnglish) {
      prompt += `

CRITICAL RULES FOR ENGLISH TERMS:
- For VERBS: ALWAYS include "to" at the beginning (e.g., "to eat", "to run", "to speak")
- For NOUNS: include appropriate articles "a", "an", or "the" (e.g., "a book", "the house", "an apple")
- For ADJECTIVES: write without articles (e.g., "beautiful", "fast", "happy")

Examples of CORRECT terms:
✓ "term": "to eat" (verb with "to")
✓ "term": "a book" (noun with article)
✓ "term": "an apple" (noun with article)
✓ "term": "the house" (noun with article)

Examples of WRONG terms:
✗ "term": "eat" (missing "to")
✗ "term": "book" (missing article)
✗ "term": "apple" (missing article)`
    }

    prompt += `

Return ONLY a JSON object with this exact structure:
{
  "words": [
    {
      "term": "word in ${learningLanguageLabel}",
      "translation": "translation in ${userLanguageLabel}",
      "examplesMd": "- Example sentence 1\n- Example sentence 2"
    }
  ]
}

IMPORTANT: Return ONLY valid JSON, no additional text or explanations.`

    return prompt
  }

  /**
   * Checks if a language code or name is English.
   * @private
   */
  private static isEnglishLanguage(language?: string): boolean {
    if (!language) return false
    const normalized = language.toLowerCase().trim()
    return (
      normalized === 'en' ||
      normalized === 'eng' ||
      normalized === 'english' ||
      normalized.startsWith('en-') ||
      normalized.startsWith('english')
    )
  }

  /**
   * Enhances English translations by adding articles for nouns and "to" for verbs.
   * @private
   */
  private static enhanceEnglishTranslation(translation: string): string {
    const trimmed = translation.trim()

    // If already has article or "to", return as-is
    if (/^(a|an|the|to)\s+/i.test(trimmed)) {
      return trimmed
    }

    // Common verb patterns - add "to"
    const verbIndicators = [
      'be',
      'have',
      'do',
      'say',
      'go',
      'get',
      'make',
      'know',
      'think',
      'take',
      'see',
      'come',
      'want',
      'use',
      'find',
      'give',
      'tell',
      'work',
      'call',
      'try',
      'ask',
      'need',
      'feel',
      'become',
      'leave',
      'put',
      'mean',
      'keep',
      'let',
      'begin',
      'seem',
      'help',
      'show',
      'hear',
      'play',
      'run',
      'move',
      'live',
      'believe',
      'bring',
      'happen',
      'write',
      'sit',
      'stand',
      'lose',
      'pay',
      'meet',
      'include',
      'continue',
      'set',
      'learn',
      'change',
      'lead',
      'understand',
      'watch',
      'follow',
      'stop',
      'create',
      'speak',
      'read',
      'spend',
      'grow',
      'open',
      'walk',
      'win',
      'teach',
      'offer',
      'remember',
      'consider',
      'appear',
      'buy',
      'serve',
      'die',
      'send',
      'build',
      'stay',
      'fall',
      'cut',
      'reach',
      'kill',
      'raise',
      'pass',
      'sell',
      'decide',
      'return',
      'explain',
      'hope',
      'develop',
      'carry',
      'break',
      'receive',
      'agree',
      'support',
      'hit',
      'produce',
      'eat',
      'cover',
      'catch',
      'draw',
      'choose',
      'cause',
      'point',
      'allow',
      'expect',
      'build',
      'drink',
      'sleep',
      'cook',
      'clean',
      'drive',
      'sing',
      'dance',
      'swim',
      'fly',
      'jump',
    ]

    const firstWord = trimmed.split(/\s+/)[0].toLowerCase()

    // Check if it's likely a verb
    if (verbIndicators.includes(firstWord)) {
      return `to ${trimmed}`
    }

    // Vowel sounds for "an" vs "a"
    const vowelSounds = /^[aeiou]/i

    // Common noun indicators - add article
    // If it starts with a vowel sound, use "an", otherwise "a"
    if (vowelSounds.test(trimmed)) {
      return `an ${trimmed}`
    } else {
      return `a ${trimmed}`
    }
  }

  /**
   * Validates and extracts word suggestions from AI response.
   */
  private static validateAndExtractSuggestions(
    response: any,
    expectedCount: number,
    excludeTerms?: string[],
    learningLanguageLabel?: string
  ): GeneratedWordSuggestionDto[] {
    // Check if response has words array
    if (!response.words || !Array.isArray(response.words)) {
      throw new DomainError(ErrorCode.InvalidAIResponse, "AI response missing 'words' array", 422)
    }

    const words = response.words

    // Validate we have at least one suggestion
    if (words.length === 0) {
      throw new DomainError(ErrorCode.InvalidAIResponse, 'AI generated no word suggestions', 422)
    }

    // Validate and sanitize each suggestion
    const normalizedExclusions = new Set(
      (excludeTerms ?? []).map(term => term.toLowerCase().trim())
    )

    const suggestions: GeneratedWordSuggestionDto[] = []

    for (let i = 0; i < Math.min(words.length, expectedCount); i++) {
      const word = words[i]

      // Validate required fields
      if (!word.term || typeof word.term !== 'string') {
        console.warn(`Skipping word ${i}: missing or invalid term`)
        continue
      }

      if (!word.translation || typeof word.translation !== 'string') {
        console.warn(`Skipping word ${i}: missing or invalid translation`)
        continue
      }

      // Sanitize and validate lengths
      const term = word.term.trim().substring(0, 500)
      const translation = word.translation.trim().substring(0, 500)
      const examplesRaw = word.examplesMd
        ? String(word.examplesMd)
        : Array.isArray(word.examples)
          ? word.examples.join('\n')
          : ''

      const sanitizedExamples = examplesRaw
        .split('\n')
        .map((item: string) => sanitizeMarkdown(String(item).trim()))
        .filter((item: string) => item.length > 0)

      if (sanitizedExamples.length !== 5) {
        console.warn(
          `Skipping word ${i}: expected 5 examples, received ${sanitizedExamples.length}`
        )
        continue
      }

      const examplesMd = sanitizedExamples
        .slice(0, 5)
        .map((example: string) => (example.startsWith('- ') ? example : `- ${example}`))
        .join('\n')
        .substring(0, 2000)

      if (!term || !translation) {
        console.warn(`Skipping word ${i}: empty term or translation after sanitization`)
        continue
      }

      if (normalizedExclusions.has(term.toLowerCase())) {
        console.warn(`Skipping word ${i}: term already exists in category`)
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
        'No valid word suggestions after validation',
        422
      )
    }

    return suggestions
  }
}
