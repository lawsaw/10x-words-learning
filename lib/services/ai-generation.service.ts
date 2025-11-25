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
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
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
      } catch (error) {
        console.error('Failed to parse AI response as JSON:', content, error)
        throw new DomainError(ErrorCode.InvalidAIResponse, 'AI response is not valid JSON', 422)
      }

      // Validate response structure
      const suggestions = this.validateAndExtractSuggestions(
        parsedContent,
        command.count || 1,
        command.excludeTerms
      )

      // Post-process TERMS: add language-specific part-of-speech markers
      const languageCode =
        this.normalizeLanguageCode(command.learningLanguageId) ||
        this.normalizeLanguageCode(command.learningLanguageName)

      if (languageCode) {
        suggestions.forEach(suggestion => {
          suggestion.term = this.enhanceTermWithPartOfSpeechMarker(suggestion.term, languageCode)
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
3. "examplesMd": exactly 5 concise example sentences in ${learningLanguageLabel} with pronunciation transcription and translation, formatted as markdown list items. Each example must follow this EXACT format:
   - [sentence in ${learningLanguageLabel}]
   [transcription using ${userLanguageLabel} alphabet]
   [translation in ${userLanguageLabel}]
   
   The transcription should help ${userLanguageLabel} speakers pronounce the ${learningLanguageLabel} sentence correctly using familiar characters.
   
   Example format:
   "- The cat is sleeping
   [зэ кэт из слипинг]
   Кошка спит

   - I like coffee
   [ай лайк кофи]
   Я люблю кофе"
   
   Important:
   - Each sentence should be practical and no longer than 100 characters
   - Line 1: Example sentence starting with "- "
   - Line 2: Transcription in square brackets using ${userLanguageLabel} alphabet
   - Line 3: Translation in ${userLanguageLabel}
   - Add ONE EMPTY LINE between examples for readability`

    // Add language-specific term rules
    const languageCode =
      this.normalizeLanguageCode(command.learningLanguageId) ||
      this.normalizeLanguageCode(command.learningLanguageName)

    const languageSpecificRules = this.getLanguageSpecificRules(languageCode, learningLanguageLabel)
    if (languageSpecificRules) {
      prompt += `

${languageSpecificRules}`
    }

    prompt += `

Return ONLY a JSON object with this exact structure:
{
  "words": [
    {
      "term": "word in ${learningLanguageLabel}",
      "translation": "translation in ${userLanguageLabel}",
      "examplesMd": "- Example 1\\n[transcription1]\\nTranslation 1\\n\\n- Example 2\\n[transcription2]\\nTranslation 2\\n\\n- Example 3\\n[transcription3]\\nTranslation 3\\n\\n- Example 4\\n[transcription4]\\nTranslation 4\\n\\n- Example 5\\n[transcription5]\\nTranslation 5"
    }
  ]
}

IMPORTANT: 
- Return ONLY valid JSON, no additional text or explanations
- Each example MUST have 3 lines: sentence (with "- "), transcription [in brackets], translation
- Add ONE EMPTY LINE between examples (\\n\\n between examples)
- Follow the exact format shown above`

    return prompt
  }

  /**
   * Returns language-specific rules for term formatting.
   * @private
   */
  private static getLanguageSpecificRules(
    languageCode: string | null,
    _languageLabel: string
  ): string | null {
    switch (languageCode) {
      case 'en':
        return `
CRITICAL RULES FOR ENGLISH TERMS:
- For VERBS: ALWAYS include "to" at the beginning (e.g., "to eat", "to run", "to speak")
- For NOUNS: include appropriate articles "a", "an", or "the" (e.g., "a book", "the house", "an apple")
- For ADJECTIVES: write without articles (e.g., "beautiful", "fast", "happy")

Examples of CORRECT English terms:
✓ "term": "to eat" (verb with "to")
✓ "term": "a book" (noun with article)
✓ "term": "an apple" (noun with article)
✓ "term": "the house" (noun with article)

Examples of WRONG English terms:
✗ "term": "eat" (missing "to")
✗ "term": "book" (missing article)
✗ "term": "apple" (missing article)

CRITICAL FORMAT FOR EXAMPLES:
- Line 1: Example sentence starting with "- "
- Line 2: Transcription in [square brackets] using user's alphabet
- Line 3: Translation in user's language
- Empty line between examples`

      case 'de':
        return `
CRITICAL RULES FOR GERMAN TERMS:
- For VERBS: use infinitive form ending in -en, -eln, or -ern (e.g., "essen", "laufen", "sprechen")
- For NOUNS: ALWAYS capitalize the first letter AND include the definite article "der", "die", or "das" (e.g., "der Apfel", "die Katze", "das Haus")
- For ADJECTIVES: write in lowercase without articles (e.g., "schön", "schnell", "glücklich")

Examples of CORRECT German terms:
✓ "term": "essen" (verb in infinitive)
✓ "term": "der Apfel" (masculine noun with article)
✓ "term": "die Katze" (feminine noun with article)
✓ "term": "das Haus" (neuter noun with article)

Examples of WRONG German terms:
✗ "term": "Apfel" (missing article)
✗ "term": "apfel" (noun not capitalized)
✗ "term": "der essen" (verb with article)

CRITICAL FORMAT FOR EXAMPLES:
- Line 1: Example sentence starting with "- "
- Line 2: Transcription in [square brackets] using user's alphabet
- Line 3: Translation in user's language
- Empty line between examples`

      case 'pl':
        return `
CRITICAL RULES FOR POLISH TERMS:
- For VERBS: ALWAYS use infinitive form ending in -ć or -c (e.g., "jeść", "pić", "robić", "czytać")
- For NOUNS: use nominative singular form without articles (e.g., "książka", "dom", "kot")
- For ADJECTIVES: use nominative singular form (e.g., "piękny", "szybki", "szczęśliwy")

Examples of CORRECT Polish terms:
✓ "term": "jeść" (verb in infinitive with -ć)
✓ "term": "czytać" (verb in infinitive with -ć)
✓ "term": "książka" (noun in nominative)
✓ "term": "dom" (noun in nominative)

Examples of WRONG Polish terms:
✗ "term": "jem" (conjugated verb, not infinitive)
✗ "term": "książki" (plural form instead of singular)
✗ "term": "jesc" (missing ogonek on ć)

CRITICAL FORMAT FOR EXAMPLES:
- Line 1: Example sentence starting with "- "
- Line 2: Transcription in [square brackets] using user's alphabet
- Line 3: Translation in user's language
- Empty line between examples`

      case 'ru':
        return `
CRITICAL RULES FOR RUSSIAN TERMS:
- For VERBS: ALWAYS use infinitive form ending in -ть, -ти, or -чь (e.g., "есть", "пить", "делать", "читать")
- For NOUNS: use nominative singular form without articles (e.g., "книга", "дом", "кот")
- For ADJECTIVES: use nominative singular masculine form (e.g., "красивый", "быстрый", "счастливый")

Examples of CORRECT Russian terms:
✓ "term": "есть" (verb in infinitive with -ть)
✓ "term": "читать" (verb in infinitive with -ть)
✓ "term": "книга" (noun in nominative singular)
✓ "term": "дом" (noun in nominative singular)

Examples of WRONG Russian terms:
✗ "term": "ем" (conjugated verb, not infinitive)
✗ "term": "книги" (plural form instead of singular)
✗ "term": "ест" (present tense, not infinitive)

CRITICAL FORMAT FOR EXAMPLES:
- Line 1: Example sentence starting with "- "
- Line 2: Transcription in [square brackets] using user's alphabet
- Line 3: Translation in user's language
- Empty line between examples`

      case 'uk':
        return `
CRITICAL RULES FOR UKRAINIAN TERMS:
- For VERBS: ALWAYS use infinitive form ending in -ти or -ть (e.g., "їсти", "пити", "робити", "читати")
- For NOUNS: use nominative singular form without articles (e.g., "книжка", "дім", "кіт")
- For ADJECTIVES: use nominative singular masculine form (e.g., "гарний", "швидкий", "щасливий")

Examples of CORRECT Ukrainian terms:
✓ "term": "їсти" (verb in infinitive with -ти)
✓ "term": "читати" (verb in infinitive with -ті)
✓ "term": "книжка" (noun in nominative singular)
✓ "term": "дім" (noun in nominative singular)

Examples of WRONG Ukrainian terms:
✗ "term": "їм" (conjugated verb, not infinitive)
✗ "term": "книжки" (plural form instead of singular)
✗ "term": "читає" (present tense, not infinitive)

CRITICAL FORMAT FOR EXAMPLES:
- Line 1: Example sentence starting with "- "
- Line 2: Transcription in [square brackets] using user's alphabet
- Line 3: Translation in user's language
- Empty line between examples`

      default:
        return null
    }
  }

  /**
   * Normalizes language identifier to a standard code.
   * @private
   */
  private static normalizeLanguageCode(language?: string): string | null {
    if (!language) return null
    const normalized = language.toLowerCase().trim()

    // English
    if (
      normalized === 'en' ||
      normalized === 'eng' ||
      normalized === 'english' ||
      normalized.startsWith('en-')
    ) {
      return 'en'
    }

    // German
    if (
      normalized === 'de' ||
      normalized === 'deu' ||
      normalized === 'ger' ||
      normalized === 'german' ||
      normalized === 'deutsch' ||
      normalized.startsWith('de-')
    ) {
      return 'de'
    }

    // Polish
    if (
      normalized === 'pl' ||
      normalized === 'pol' ||
      normalized === 'polish' ||
      normalized === 'polski' ||
      normalized.startsWith('pl-')
    ) {
      return 'pl'
    }

    // Russian
    if (
      normalized === 'ru' ||
      normalized === 'rus' ||
      normalized === 'russian' ||
      normalized === 'русский' ||
      normalized.startsWith('ru-')
    ) {
      return 'ru'
    }

    // Ukrainian
    if (
      normalized === 'uk' ||
      normalized === 'ukr' ||
      normalized === 'ukrainian' ||
      normalized === 'українська' ||
      normalized.startsWith('uk-')
    ) {
      return 'uk'
    }

    return null
  }

  /**
   * Checks if a language code or name is English.
   * @private
   */
  private static isEnglishLanguage(language?: string): boolean {
    return this.normalizeLanguageCode(language) === 'en'
  }

  /**
   * Enhances terms with language-specific part-of-speech markers.
   * @private
   */
  private static enhanceTermWithPartOfSpeechMarker(term: string, languageCode: string): string {
    switch (languageCode) {
      case 'en':
        return this.enhanceEnglishTerm(term)
      case 'de':
        return this.enhanceGermanTerm(term)
      case 'pl':
        return this.enhancePolishTerm(term)
      case 'ru':
        return this.enhanceRussianTerm(term)
      case 'uk':
        return this.enhanceUkrainianTerm(term)
      default:
        return term
    }
  }

  /**
   * Enhances English terms by adding articles for nouns and "to" for verbs.
   * @private
   */
  private static enhanceEnglishTerm(term: string): string {
    const trimmed = term.trim()

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
   * Enhances German terms by adding articles for nouns.
   * German verbs in infinitive form already end in -en, -eln, -ern.
   * German nouns are capitalized and should have der/die/das article.
   * @private
   */
  private static enhanceGermanTerm(term: string): string {
    const trimmed = term.trim()

    // If already has article, return as-is
    if (/^(der|die|das|ein|eine)\s+/i.test(trimmed)) {
      return trimmed
    }

    // Check if it's a verb (ends with -en, -eln, -ern) - these don't need articles
    if (/(?:eln|ern|en)$/i.test(trimmed)) {
      return trimmed
    }

    // Check if it's a capitalized word (likely a noun)
    if (/^[A-ZÄÖÜ]/.test(trimmed)) {
      // Add neutral article "das" as default
      // Note: In a more sophisticated system, we'd determine gender, but "das" is safest default
      return `das ${trimmed}`
    }

    return trimmed
  }

  /**
   * Enhances Polish terms.
   * Polish verbs in infinitive form end in -ć or -c.
   * Polish nouns don't use articles but are distinguished by case endings.
   * @private
   */
  private static enhancePolishTerm(term: string): string {
    const trimmed = term.trim()

    // Polish infinitive verbs end in -ć or -c (with the ogonek)
    // If it's already an infinitive verb, it's clear from the ending
    // No enhancement needed for Polish - the infinitive form is sufficient
    // Nouns don't use articles in Polish

    return trimmed
  }

  /**
   * Enhances Russian terms.
   * Russian verbs in infinitive form end in -ть, -ти, or -чь.
   * Russian nouns don't use articles but are distinguished by case endings.
   * @private
   */
  private static enhanceRussianTerm(term: string): string {
    const trimmed = term.trim()

    // Russian infinitive verbs end in -ть, -ти, or -чь
    // If it's already an infinitive verb, it's clear from the ending
    // No enhancement needed for Russian - the infinitive form is sufficient
    // Nouns don't use articles in Russian

    return trimmed
  }

  /**
   * Enhances Ukrainian terms.
   * Ukrainian verbs in infinitive form end in -ти or -ть.
   * Ukrainian nouns don't use articles but are distinguished by case endings.
   * @private
   */
  private static enhanceUkrainianTerm(term: string): string {
    const trimmed = term.trim()

    // Ukrainian infinitive verbs end in -ти or -ть
    // If it's already an infinitive verb, it's clear from the ending
    // No enhancement needed for Ukrainian - the infinitive form is sufficient
    // Nouns don't use articles in Ukrainian

    return trimmed
  }

  /**
   * Validates and extracts word suggestions from AI response.
   */
  private static validateAndExtractSuggestions(
    response: any,
    expectedCount: number,
    excludeTerms?: string[]
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

      // Split by newlines but keep empty lines to preserve formatting
      const allLines = examplesRaw.split('\n').map((item: string) => sanitizeMarkdown(String(item)))

      // Filter out empty lines for counting, but keep them for formatting
      const nonEmptyLines = allLines.filter((item: string) => item.trim().length > 0)

      // With transcriptions and translations, we expect 15 non-empty lines (5 examples + 5 transcriptions + 5 translations)
      // But we'll be flexible and accept anywhere from 5-15 lines
      if (nonEmptyLines.length < 5) {
        console.warn(
          `Skipping word ${i}: expected at least 5 non-empty lines, received ${nonEmptyLines.length}`
        )
        continue
      }

      // Count lines that start with "- " (these are the example sentences)
      const exampleSentences = nonEmptyLines.filter((line: string) => line.trim().startsWith('- '))

      // Count lines with transcriptions (in square brackets)
      const transcriptionLines = nonEmptyLines.filter((line: string) => /^\[.+\]/.test(line.trim()))

      if (exampleSentences.length < 5) {
        console.warn(
          `Word ${i}: expected 5 example sentences (lines starting with "- "), found ${exampleSentences.length}. Continuing anyway.`
        )
      }

      if (transcriptionLines.length < exampleSentences.length) {
        console.warn(
          `Word ${i}: found ${exampleSentences.length} examples but only ${transcriptionLines.length} transcriptions. Some examples may be missing transcription.`
        )
      }

      // Keep all lines including empty ones for proper formatting
      const examplesMd = allLines
        .map((line: string) => {
          const trimmedLine = line.trim()
          // Keep empty lines for spacing
          if (trimmedLine.length === 0) return ''
          // Keep example sentences with "- " prefix
          if (trimmedLine.startsWith('- ')) return trimmedLine
          // Keep transcription lines as-is
          if (/^\[.+\]/.test(trimmedLine)) return trimmedLine
          // Keep translation lines as-is (everything else)
          return trimmedLine
        })
        .join('\n')
        .substring(0, 3000)

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
