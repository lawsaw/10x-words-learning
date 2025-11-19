import type { Tables } from './supabase/database.types'

/**
 * Database entity aliases keep DTOs and commands in sync with Supabase types.
 */
type LanguageEntity = Tables<'languages'>
type ProfileEntity = Tables<'profiles'>
type LearningLanguageEntity = Tables<'user_learning_languages'>
type CategoryEntity = Tables<'categories'>
type WordEntity = Tables<'words'>
type VocabularyOverviewRow = Tables<{ schema: 'app' }, 'vocabulary_overview'>

/**
 * Shared primitives and helpers.
 */
export type EmptyResponse = Record<string, never>
export type SortDirection = 'asc' | 'desc'
export type PaginationMetaDto = {
  page: number
  pageSize: number
  hasMore: boolean
}

export type CursorPaginationMetaDto = PaginationMetaDto & {
  nextCursor: string | null
}

/**
 * Auth DTOs and commands.
 */
export type AuthUserDto = {
  id: ProfileEntity['user_id']
  email: string
}

export type AuthSessionDto = {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export type RegisterCommand = {
  email: string
  password: string
  userLanguage: ProfileEntity['user_language_id']
}

export type RegisterResponseDto = {
  user: AuthUserDto
  session: AuthSessionDto
  profile: ProfileDto
}

export type LoginCommand = {
  email: string
  password: string
}

export type LoginResponseDto = {
  session: AuthSessionDto
  user: AuthUserDto
}

export type LogoutResponseDto = EmptyResponse

export type AuthSessionStatusDto = {
  session: {
    userId: ProfileEntity['user_id']
    accessTokenExpiresAt: number
  } | null
}

/**
 * Language DTOs and queries.
 */
export type LanguagesQueryDto = {
  scope?: 'registration' | 'learning'
}

export type LanguageDto = {
  code: LanguageEntity['code']
  name: LanguageEntity['name']
}

export type LanguagesListDto = {
  languages: LanguageDto[]
}

/**
 * Profile DTOs and commands.
 */
export type ProfileDto = {
  userId: ProfileEntity['user_id']
  userLanguage: ProfileEntity['user_language_id']
  displayName: ProfileEntity['display_name']
  createdAt: ProfileEntity['created_at']
  updatedAt: ProfileEntity['updated_at']
}

export type UpdateProfileCommand = {
  displayName?: ProfileEntity['display_name']
}

/**
 * Learning language DTOs, queries, and commands.
 */
export type LearningLanguageStatsDto = {
  categories: number
  words: number
}

export type LearningLanguageDto = {
  id: LearningLanguageEntity['id']
  languageId: LearningLanguageEntity['language_id']
  createdAt: LearningLanguageEntity['created_at']
  updatedAt: LearningLanguageEntity['updated_at']
  stats?: LearningLanguageStatsDto
}

export type LearningLanguagesQueryDto = {
  page?: number
  pageSize?: number
  cursor?: string
  includeStats?: boolean
}

export type LearningLanguagesListDto = {
  data: LearningLanguageDto[]
  meta: CursorPaginationMetaDto
}

export type CreateLearningLanguageCommand = {
  languageId: LearningLanguageEntity['language_id']
}

/**
 * Category DTOs, queries, and commands.
 */
export type CategoryOrderField = 'createdAt' | 'name'

export type CategoriesQueryDto = {
  search?: string
  page?: number
  pageSize?: number
  orderBy?: CategoryOrderField
  direction?: SortDirection
}

export type CategoryDto = {
  id: CategoryEntity['id']
  learningLanguageId: CategoryEntity['user_learning_language_id']
  name: CategoryEntity['name']
  createdAt: CategoryEntity['created_at']
  updatedAt: CategoryEntity['updated_at']
  wordCount?: number
}

export type CategoriesListDto = {
  data: CategoryDto[]
  meta: PaginationMetaDto
}

export type CreateCategoryCommand = {
  name: CategoryEntity['name']
}

export type UpdateCategoryCommand = {
  name: CategoryEntity['name']
}

/**
 * Word DTOs, queries, and commands.
 */
export type WordViewMode = 'table' | 'slider'
export type WordOrderField = 'createdAt' | 'term' | 'random'

export type CategoryWordsQueryDto = {
  view?: WordViewMode
  orderBy?: WordOrderField
  direction?: SortDirection
  page?: number
  pageSize?: number
  cursor?: string
}

export type WordDto = {
  id: WordEntity['id']
  learningLanguageId: WordEntity['user_learning_language_id']
  categoryId: WordEntity['category_id']
  term: WordEntity['term']
  translation: WordEntity['translation']
  examplesMd: WordEntity['examples_md']
  createdAt: WordEntity['created_at']
  updatedAt: WordEntity['updated_at']
}

export type WordDetailDto = WordDto & {
  userId: WordEntity['user_id']
}

export type WordListMetaDto = CursorPaginationMetaDto & {
  view: WordViewMode
  orderBy: WordOrderField
  direction: SortDirection
}

export type CategoryWordsListDto = {
  data: WordDto[]
  meta: WordListMetaDto
}

/**
 * Category word table view models.
 */
export type WordTableRowVm = {
  id: string
  term: string
  translation: string
  examplesMd: string
  createdAt: string
  updatedAt: string
  createdAtLabel: string
  updatedAtLabel: string
}

export type WordTableViewModel = {
  rows: WordTableRowVm[]
  meta: WordListMetaDto
  count: number
  isEmpty: boolean
}

export type WordFormState = {
  wordId?: string
  term: string
  translation: string
  examplesMd: string
  difficulty: DifficultyLevel
}

export type DeleteWordContext = {
  wordId: string
  term: string
}

export type AiGenerationRequest = {
  difficulty: DifficultyLevel
  learningLanguageId: string
  learningLanguageName?: string
  userLanguage: string
  userLanguageName?: string
  categoryContext?: string
  temperature?: number
  count?: number
  excludeTerms?: string[]
}

export type CreateWordCommand = {
  term: WordEntity['term']
  translation: WordEntity['translation']
  examplesMd: WordEntity['examples_md']
}

export type UpdateWordCommand = Partial<CreateWordCommand>

export type SearchWordsQueryDto = {
  learningLanguageId?: WordEntity['user_learning_language_id']
  categoryId?: WordEntity['category_id']
  search?: string
  page?: number
  pageSize?: number
  orderBy?: Exclude<WordOrderField, 'random'>
  direction?: SortDirection
  cursor?: string
}

export type WordsListDto = {
  data: WordDto[]
  meta: CursorPaginationMetaDto
}

/**
 * AI generation DTOs and commands.
 */
export type DifficultyLevel = 'easy' | 'medium' | 'advanced'

export type GenerateWordsCommand = {
  difficulty?: DifficultyLevel
  learningLanguageId: WordEntity['user_learning_language_id']
  learningLanguageName?: string
  userLanguage: ProfileEntity['user_language_id']
  userLanguageName?: string
  categoryContext?: string
  temperature?: number
  count?: number
  excludeTerms?: string[]
}

export type GeneratedWordSuggestionDto = {
  term: WordEntity['term']
  translation: WordEntity['translation']
  examplesMd: WordEntity['examples_md']
}

export type AiUsageDto = {
  promptTokens: number
  completionTokens: number
}

export type AiGeneratedWordsDto = {
  generated: GeneratedWordSuggestionDto[]
  model: string
  usage: AiUsageDto
}

/**
 * Vocabulary overview DTOs and queries.
 */
export type VocabularyOverviewOrderField = 'createdAt' | 'category' | 'language'

export type VocabularyOverviewQueryDto = {
  learningLanguageId?: VocabularyOverviewRow['learning_language_id']
  categoryId?: VocabularyOverviewRow['category_id']
  orderBy?: VocabularyOverviewOrderField
  direction?: SortDirection
  page?: number
  pageSize?: number
}

export type VocabularyOverviewEntryDto = {
  learningLanguageId: VocabularyOverviewRow['learning_language_id']
  learningLanguageCode: VocabularyOverviewRow['learning_language_code']
  categoryId: VocabularyOverviewRow['category_id']
  categoryName: VocabularyOverviewRow['category_name']
  wordId: VocabularyOverviewRow['word_id']
  term: VocabularyOverviewRow['term']
  translation: VocabularyOverviewRow['translation']
  createdAt: VocabularyOverviewRow['created_at']
}

export type VocabularyOverviewListDto = {
  data: VocabularyOverviewEntryDto[]
  meta: PaginationMetaDto
}

/**
 * Testing utilities.
 */
export type TestResetCommand = {
  adminToken: string
}

/**
 * Structured error response shared across endpoints.
 */
export type ErrorResponseDto = {
  error: {
    code: string
    message: string
  }
}

/**
 * OpenRouter service types.
 */
export type ChatMessageRole = 'system' | 'user' | 'assistant' | 'tool'

export type ChatMessage = {
  role: ChatMessageRole
  content: string
  name?: string
}

export type ResponseFormatType = 'text' | 'json_object' | 'json_schema'

export type JsonSchema = {
  type: string
  properties?: Record<string, any>
  required?: string[]
  additionalProperties?: boolean
  items?: any
  [key: string]: any
}

export type ResponseFormatSchema = {
  type: ResponseFormatType
  json_schema?: {
    name: string
    strict?: boolean
    schema: JsonSchema
  }
}

export type ModelParameters = {
  temperature?: number
  top_p?: number
  max_tokens?: number
  frequency_penalty?: number
  presence_penalty?: number
  stop?: string | string[]
}

export type ChatRequest = {
  messages: ChatMessage[]
  model?: string
  parameters?: ModelParameters
  responseFormat?: ResponseFormatSchema
  tags?: Record<string, string>
  signal?: AbortSignal
}

export type ChatChoice = {
  index: number
  message: ChatMessage
  finish_reason: string | null
}

export type UsageInfo = {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export type ChatResponse = {
  id: string
  model: string
  choices: ChatChoice[]
  usage?: UsageInfo
  created?: number
}

export type ChatChunk = {
  id: string
  model: string
  choices: Array<{
    index: number
    delta: Partial<ChatMessage>
    finish_reason: string | null
  }>
}

export type OpenRouterConfig = {
  apiKey: string
  baseUrl: string
  defaultModel: string
  defaultParams?: ModelParameters
  timeoutMs?: number
  appUrl?: string
  appTitle?: string
}

export type OpenRouterOptions = {
  fetchImpl?: typeof fetch
  logger?: {
    info: (message: string, meta?: any) => void
    warn: (message: string, meta?: any) => void
    error: (message: string, meta?: any) => void
  }
  metricsClient?: {
    recordMetric: (event: string, meta: any) => void
  }
}

export type OpenRouterPayload = {
  model: string
  messages: ChatMessage[]
  temperature?: number
  top_p?: number
  max_tokens?: number
  frequency_penalty?: number
  presence_penalty?: number
  stop?: string | string[]
  response_format?: ResponseFormatSchema
  stream?: boolean
}
