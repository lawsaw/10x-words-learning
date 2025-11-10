# API Endpoint Implementation Plan: 10xWordsLearning REST API

## 1. Endpoint Overview
- Auth: Register, login, logout, session retrieval to manage Supabase GoTrue sessions and profile bootstrap.
- Languages: Expose static language catalog with optional scope filter.
- Profiles: Fetch and update (limited) profile for authenticated user.
- Learning Languages: CRUD subset covering listing, creation, and deletion of user-owned learning languages.
- Categories: Scoped listing, creation, rename, delete under a learning language.
- Words: Category-level listing, global search, detail read, CRUD for vocabulary entries.
- AI Generation: Generate word suggestions via OpenRouter using contextual inputs.
- Vocabulary Overview: Read-only aggregate view for analytics.
- Testing Utilities: Environment-guarded reset endpoint for automated suites.

## 2. Request Details
- POST /auth/register: requires JSON email, password (min 5), userLanguage code; unauthenticated access.
- POST /auth/login: requires JSON email, password; unauthenticated access.
- POST /auth/logout: no body; requires authenticated session.
- GET /auth/session: no body; requires authenticated session.
- GET /languages: optional query scope=registration|learning; public access.
- GET /profile: no body; requires authenticated session.
- PATCH /profile: JSON displayName optional string; requires authenticated session; forbid userLanguage field.
- GET /learning-languages: optional query page, pageSize (≤50), cursor, includeStats boolean; requires authenticated session.
- POST /learning-languages: JSON languageId code; requires authenticated session.
- DELETE /learning-languages/{learningLanguageId}: path UUID; requires authenticated session with ownership.
- GET /learning-languages/{learningLanguageId}/categories: path UUID and optional query search, page, pageSize (≤50), orderBy createdAt|name, direction asc|desc; requires authenticated session.
- POST /learning-languages/{learningLanguageId}/categories: path UUID, JSON name 1-150 chars; requires authenticated session.
- PATCH /categories/{categoryId}: path UUID, JSON name 1-150 chars; requires authenticated session.
- DELETE /categories/{categoryId}: path UUID; requires authenticated session.
- GET /categories/{categoryId}/words: path UUID and optional query view table|slider, orderBy createdAt|term|random, direction asc|desc, page, pageSize (table ≤50, slider ≤100), cursor; requires authenticated session.
- GET /words: optional query learningLanguageId UUID, categoryId UUID, search string, page, pageSize (≤50), orderBy createdAt|term, direction asc|desc, cursor; requires authenticated session.
- GET /words/{wordId}: path UUID; requires authenticated session.
- POST /categories/{categoryId}/words: path UUID, JSON term and translation non-empty strings, examplesMd validated markdown; requires authenticated session.
- PATCH /words/{wordId}: path UUID, JSON term|translation|examplesMd (at least one provided); requires authenticated session.
- DELETE /words/{wordId}: path UUID; requires authenticated session.
- POST /categories/{categoryId}/words/ai-generate: path UUID, JSON learningLanguageId UUID, userLanguage code, optional difficulty easy|medium|advanced, categoryContext ≤500 chars, temperature 0-1, count 1-5; requires authenticated session.
- GET /vocabulary-overview: optional query learningLanguageId UUID, categoryId UUID, orderBy createdAt|category|language, direction asc|desc, page, pageSize (≤100); requires authenticated session.
- POST /testing/reset: JSON adminToken string; only allowed when NODE_ENV=test and behind service secret.

## 3. Used Types
- Auth: RegisterCommand, RegisterResponseDto, LoginCommand, LoginResponseDto, LogoutResponseDto, AuthSessionStatusDto.
- Languages: LanguagesQueryDto, LanguageDto, LanguagesListDto.
- Profiles: ProfileDto, UpdateProfileCommand.
- Learning Languages: LearningLanguagesQueryDto, LearningLanguagesListDto, LearningLanguageDto, CreateLearningLanguageCommand.
- Categories: CategoriesQueryDto, CategoriesListDto, CategoryDto, CreateCategoryCommand, UpdateCategoryCommand.
- Words: CategoryWordsQueryDto, CategoryWordsListDto, WordDto, WordDetailDto, WordListMetaDto, CreateWordCommand, UpdateWordCommand, SearchWordsQueryDto, WordsListDto.
- AI: GenerateWordsCommand, AiGeneratedWordsDto, GeneratedWordSuggestionDto, AiUsageDto.
- Vocabulary Overview: VocabularyOverviewQueryDto, VocabularyOverviewListDto, VocabularyOverviewEntryDto.
- Testing: TestResetCommand.
- Shared: ErrorResponseDto, EmptyResponse, PaginationMetaDto, CursorPaginationMetaDto, SortDirection.

## 4. Response Details
- Successful reads return 200 with DTO payloads; POST creations return 201 with created entity; deletions return 204 with EmptyResponse.
- Auth responses include user and session per RegisterResponseDto and LoginResponseDto; session endpoint returns AuthSessionStatusDto.
- Listing endpoints return data arrays plus meta objects for pagination per DTOs; include stats when requested.
- AI generation returns AiGeneratedWordsDto including usage and model metadata.
- Error responses use ErrorResponseDto with descriptive code and message; map Supabase/RLS cases into domain codes (e.g., ValidationError, Unauthorized, NotFound, Conflict, RateLimited, InvalidAIResponse).
- For optional stats or meta fields, ensure undefined fields are omitted from JSON via serializer helpers.

## 5. Data Flow
- Requests enter Next.js API routes, verify Supabase session via server client from `lib/supabase/server`.
- Validate input using Zod schemas mapped from command/query DTOs before calling services.
- Services interact with Supabase PostgREST or RPCs using typed queries, relying on RLS for authorization.
- Creation and mutation operations run within service methods that wrap Supabase calls, handle uniqueness conflicts, and map errors.
- AI generation service composes prompt, calls OpenRouter via fetch with API key, parses JSON, validates structure, and returns suggestions without persisting.
- Responses assembled from DTO transformers that convert Supabase rows to API shapes, including meta calculations for pagination.
- Centralized error handler intercepts thrown domain errors and serializes to ErrorResponseDto with appropriate HTTP status.

## 6. Security Considerations
- Enforce Supabase session verification on all authenticated routes and fail fast with 401 when missing or invalid.
- Rely on database RLS policies to scope data by user_id; supplement with ownership checks when cross-resource IDs are provided.
- Validate UUID format and enum bounds to prevent injection and broken object level authorization.
- Rate limit sensitive endpoints (auth, AI generation) via middleware or edge function; throttle based on user and IP.
- Sanitize Markdown fields to mitigate stored XSS; strip disallowed HTML and enforce length constraints.
- Protect AI endpoint credentials by storing OpenRouter key in server environment variables and redacting from logs.
- Lock testing reset endpoint to test environment and shared secret; ensure it is excluded from production builds via feature flag.
- Implement CSRF defenses for cookie-based sessions using anti-CSRF token verification on state-changing requests.

## 7. Error Handling
- Map validation failures to 400 with specific error codes (e.g., InvalidInput, DuplicateLanguage, DuplicateCategory, DuplicateWord).
- Return 401 when Supabase session retrieval fails or logout is attempted without valid session.
- Surface missing or unauthorized resources as 404 to avoid leaking existence; rely on RLS or explicit checks.
- Handle Supabase unique constraint violations by detecting PostgREST error codes and translating to Conflict domain errors.
- For AI provider issues, differentiate between schema validation (422 InvalidAIResponse), rate limiting (429 RateLimited), and upstream failures (500 ExternalServiceError); convert to 500 if limited status set is required.
- Catch unexpected exceptions, log with correlation ID, and respond with 500 InternalError while omitting sensitive details.
- Ensure testing reset returning unauthorized (401/403) when environment or token guard fails.

## 8. Performance Considerations
- Reuse Supabase client instances per request to minimize connection overhead; avoid N+1 by selecting necessary columns only.
- Apply pagination defaults and enforce pageSize caps to limit payload size and DB load.
- Use database indexes for sorting fields as defined (created_at, name, term) to keep response times low.
- Cache static language list in memory or edge cache with short TTL since table rarely changes.
- Defer AI calls to background when possible and ensure timeouts with retries capped to avoid blocking server threads.
- Optimize Markdown sanitization with memoized sanitizer configuration to reduce repeated setup costs.
- Monitor query latency and add instrumentation counters for high traffic endpoints.

## 9. Implementation Steps
1. Scaffold API route files under `app/api` following resource namespaces and configure middleware for Supabase session extraction and rate limiting.
2. Create shared utilities for validation (Zod schemas per command/query), error mapping, response builders, pagination helpers, and Markdown sanitization in `lib`.
3. Implement service layer modules (AuthService, ProfileService, LanguageService, LearningLanguagesService, CategoryService, WordService, AiGenerationService, VocabularyOverviewService, TestingResetService) with typed Supabase calls and domain error handling.
4. Wire API handlers to validate requests, call services, and return DTOs with standardized success and error responses; ensure happy path last and guard clauses for invalid states.
5. Integrate logging middleware capturing request id, user id, endpoint, latency, and error context without PII.
6. Add rate limiting and CSRF checks in middleware for applicable endpoints and enforce environment guard for testing reset.
7. Write unit tests for validation and service error mapping plus integration tests against Supabase stub or test instance; include AI endpoint schema validation tests with mocked OpenRouter responses.
8. Document endpoints and DTOs via OpenAPI or README, and verify linting plus type checks before deployment.

