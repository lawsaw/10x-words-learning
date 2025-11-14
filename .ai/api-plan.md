# REST API Plan

## 1. Resources

- `Auth` → Supabase GoTrue service; coordinates signup, login, logout, session refresh.
- `Profiles` → `app.profiles`; immutable link between Supabase `auth.users` and application context.
- `Languages` → `app.languages`; seeded static list for user-language and learning-language selection.
- `LearningLanguages` → `app.user_learning_languages`; user-specific collection of target languages.
- `Categories` → `app.categories`; topical groupings within a learning language.
- `Words` → `app.words`; vocabulary entries holding term, translation, and Markdown examples.
- `VocabularyOverview` → `app.vocabulary_overview`; read-only view for aggregated listings (optional but useful for dashboards).
- `Testing Utilities` → no dedicated table; guarded endpoints for automated test resets.

## 2. Endpoints

### 2.1 Auth

- **Method / Path:** `POST /auth/register`
  - Description: Create a Supabase user and corresponding profile with immutable `user_language_id`.
  - Request JSON:
    ```json
    {
      "email": "learner@example.com",
      "password": "string(minLength:5)",
      "userLanguage": "english"
    }
    ```
  - Response JSON (201):
    ```json
    {
      "user": { "id": "uuid", "email": "learner@example.com" },
      "session": {
        "accessToken": "jwt",
        "refreshToken": "jwt",
        "expiresAt": 1737645234
      },
      "profile": { "userId": "uuid", "userLanguage": "english" }
    }
    ```
  - Success: `201 Created` (profile + session), `200 OK` if signup handled but session already active.
  - Errors: `400` validation (duplicate email, password too short, missing userLanguage), `409` conflict (profile already exists), `500` internal (Supabase service failure).

- **Method / Path:** `POST /auth/login`
  - Description: Proxy to Supabase GoTrue sign-in for SSR contexts; optional if client SDK handles logins.
  - Request JSON:
    ```json
    { "email": "learner@example.com", "password": "string" }
    ```
  - Response JSON (200):
    ```json
    {
      "session": {
        "accessToken": "jwt",
        "refreshToken": "jwt",
        "expiresAt": 1737645234
      },
      "user": { "id": "uuid", "email": "learner@example.com" }
    }
    ```
  - Errors: `400` invalid credentials, `423` if account locked (future-proof), `500` internal.

- **Method / Path:** `POST /auth/logout`
  - Description: Invalidate current session (server-side sign-out + cookie clearance).
  - Request JSON: none.
  - Response JSON (204): empty.
  - Errors: `401` missing/invalid session, `500` internal.

- **Method / Path:** `GET /auth/session`
  - Description: Return current authenticated session for SSR/CSR hydration.
  - Query params: none.
  - Response JSON (200):
    ```json
    {
      "session": {
        "userId": "uuid",
        "accessTokenExpiresAt": 1737645234
      }
    }
    ```
  - Errors: `401` no active session.

### 2.2 Languages

- **Method / Path:** `GET /languages`
  - Description: Fetch static list of supported languages filtered by context (e.g., exclude current user language client-side).
  - Query params: `scope=registration|learning` (optional to drive UI hints).
  - Response JSON (200):
    ```json
    {
      "languages": [
        { "code": "english", "name": "English" },
        { "code": "german", "name": "German" }
      ]
    }
    ```
  - Success: `200 OK`.
  - Errors: `500` internal (unlikely; data static).

### 2.3 Profiles

- **Method / Path:** `GET /profile`
  - Description: Return the authenticated user’s profile record.
  - Response JSON (200):
    ```json
    {
      "profile": {
        "userId": "uuid",
        "userLanguage": "english",
        "createdAt": "2025-01-01T12:00:00Z",
        "updatedAt": "2025-01-01T12:00:00Z"
      }
    }
    ```
  - Success: `200 OK`.
  - Errors: `401` unauthenticated, `404` profile missing (should only happen pre-registration completion).

- **Method / Path:** `PATCH /profile`
  - Description: Update mutable profile fields (future-friendly; currently none besides potential metadata). Reject `userLanguage` changes.
  - Request JSON:
    ```json
    {
      "displayName": "optional string"
    }
    ```
  - Response JSON (200): updated profile payload.
  - Errors: `400` invalid field or attempt to change `userLanguage`, `401` unauthenticated, `409` optimistic locking failure if using `updatedAt`, `500` internal.

### 2.4 Learning Languages

- **Method / Path:** `GET /learning-languages`
  - Description: List paginated learning languages owned by the current user, ordered by `created_at desc`.
  - Query params: `page` (default 1), `pageSize` (default 20, max 50), `cursor` (optional alternative to page), `includeStats` (boolean to append counts via view).
  - Response JSON (200):
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "languageId": "german",
          "createdAt": "2025-01-02T12:00:00Z",
          "updatedAt": "2025-01-02T12:00:00Z",
          "stats": { "categories": 3, "words": 42 }
        }
      ],
      "meta": { "page": 1, "pageSize": 20, "hasMore": false, "nextCursor": null }
    }
    ```
  - Success: `200 OK`.
  - Errors: `401` unauthenticated, `500` internal.

- **Method / Path:** `POST /learning-languages`
  - Description: Create a new learning language for the current user while enforcing uniqueness and excluding the user’s primary language.
  - Request JSON:
    ```json
    { "languageId": "german" }
    ```
  - Response JSON (201):
    ```json
    {
      "id": "uuid",
      "languageId": "german",
      "createdAt": "2025-01-02T12:00:00Z"
    }
    ```
  - Success: `201 Created`.
  - Errors: `400` invalid language code or matches user language, `409` duplicate language, `401` unauthenticated, `500` internal.

- **Method / Path:** `DELETE /learning-languages/{learningLanguageId}`
  - Description: Remove learning language and cascade delete categories and words after confirmation.
  - Response JSON (204): empty.
  - Success: `204 No Content`.
  - Errors: `400` attempt to delete non-owned resource (RLS returns 404), `401` unauthenticated, `404` not found, `409` if protected (future), `500` internal.

### 2.5 Categories

- **Method / Path:** `GET /learning-languages/{learningLanguageId}/categories`
  - Description: List categories for a specific learning language with optional search.
  - Query params: `search` (string), `page`, `pageSize`, `orderBy` (`createdAt|name` default `createdAt`), `direction` (`asc|desc`).
  - Response JSON (200):
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "learningLanguageId": "uuid",
          "name": "Business",
          "createdAt": "2025-01-02T12:00:00Z",
          "updatedAt": "2025-01-03T08:00:00Z",
          "wordCount": 15
        }
      ],
      "meta": { "page": 1, "pageSize": 20, "hasMore": false }
    }
    ```
  - Success: `200 OK`.
  - Errors: `401`, `404` if parent not accessible, `500`.

- **Method / Path:** `POST /learning-languages/{learningLanguageId}/categories`
  - Description: Create a category under a learning language, enforcing case-sensitive uniqueness.
  - Request JSON:
    ```json
    { "name": "Business" }
    ```
  - Response JSON (201):
    ```json
    {
      "id": "uuid",
      "learningLanguageId": "uuid",
      "name": "Business",
      "createdAt": "2025-01-02T12:00:00Z"
    }
    ```
  - Success: `201 Created`.
  - Errors: `400` invalid name (empty or >150 chars), `409` duplicate name, `401`, `404` parent missing, `500`.

- **Method / Path:** `PATCH /categories/{categoryId}`
  - Description: Rename category; update reflected automatically via DB triggers.
  - Request JSON:
    ```json
    { "name": "Finance" }
    ```
  - Response JSON (200): updated category payload.
  - Success: `200 OK`.
  - Errors: `400` invalid name, `409` duplicate within same learning language, `401`, `404`, `500`.

- **Method / Path:** `DELETE /categories/{categoryId}`
  - Description: Delete category and cascade its words.
  - Response JSON (204): empty.
  - Success: `204 No Content`.
  - Errors: `401`, `404`, `500`.

### 2.6 Words

- **Method / Path:** `GET /categories/{categoryId}/words`
  - Description: Fetch words in a category for table/slider modes.
  - Query params:
    - `view` (`table|slider`; default `table` to steer default sorting/layout hints).
    - `orderBy` (`createdAt|term|random`).
    - `direction` (`asc|desc`; ignored for `random`).
    - `page`, `pageSize` (table default 20; slider default 50).
    - `cursor` (alternative pagination).
  - Response JSON (200):
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "categoryId": "uuid",
          "term": "die Firma",
          "translation": "the company",
          "examplesMd": "- Beispiel 1...",
          "createdAt": "2025-01-03T10:00:00Z",
          "updatedAt": "2025-01-03T10:00:00Z"
        }
      ],
      "meta": {
        "view": "slider",
        "orderBy": "random",
        "page": 1,
        "pageSize": 50,
        "hasMore": false,
        "nextCursor": null
      }
    }
    ```
  - Success: `200 OK`.
  - Errors: `401`, `404` if category inaccessible, `500`.

- **Method / Path:** `GET /words`
  - Description: Search words across categories/learning languages for dashboards or AI prompts.
  - Query params: `learningLanguageId`, `categoryId`, `search` (term or translation, full-text), `page`, `pageSize`, `orderBy`, `direction`.
  - Response JSON mirrors category list response but aggregated.
  - Success: `200 OK`.
  - Errors: `401`, `500`.

- **Method / Path:** `GET /words/{wordId}`
  - Description: Retrieve single word by id (prefill edit form).
  - Response JSON (200):
    ```json
    {
      "id": "uuid",
      "categoryId": "uuid",
      "learningLanguageId": "uuid",
      "term": "die Firma",
      "translation": "the company",
      "examplesMd": "- Beispiel...",
      "createdAt": "2025-01-03T10:00:00Z",
      "updatedAt": "2025-01-04T09:30:00Z"
    }
    ```
  - Errors: `401`, `404`, `500`.

- **Method / Path:** `POST /categories/{categoryId}/words`
  - Description: Create word within category; DB trigger copies ownership metadata.
  - Request JSON:
    ```json
    {
      "term": "die Firma",
      "translation": "the company",
      "examplesMd": "- Beispiel 1\n- Beispiel 2\n- Beispiel 3"
    }
    ```
  - Response JSON (201): newly created word payload.
  - Success: `201 Created`.
  - Errors: `400` invalid payload (missing fields, Markdown too short), `409` duplicate term in category, `401`, `404`, `500`.

- **Method / Path:** `PATCH /words/{wordId}`
  - Description: Update word details; maintain uniqueness constraint.
  - Request JSON:
    ```json
    {
      "term": "die Firma",
      "translation": "the company",
      "examplesMd": "- Neue Beispiele..."
    }
    ```
  - Response JSON (200): updated word payload.
  - Errors: `400`, `409`, `401`, `404`, `500`.

- **Method / Path:** `DELETE /words/{wordId}`
  - Description: Remove a word after confirmation.
  - Response JSON (204): empty.
  - Errors: `401`, `404`, `500`.

### 2.7 AI Word Generation

- **Method / Path:** `POST /categories/{categoryId}/words/ai-generate`
  - Description: Call OpenRouter (DeepSeek) to generate vocabulary suggestion scoped to category, learning language, and user language.
  - Request JSON:
    ```json
    {
      "difficulty": "medium",
      "learningLanguageId": "uuid",
      "userLanguage": "english",
      "categoryContext": "Business meetings",
      "temperature": 0.4,
      "count": 1
    }
    ```
  - Response JSON (200):
    ```json
    {
      "generated": [
        {
          "term": "der Vorstand",
          "translation": "board of directors",
          "examplesMd": "- Beispiel 1...\n- Beispiel 2...\n- Beispiel 3..."
        }
      ],
      "model": "deepseek-sample",
      "usage": { "promptTokens": 512, "completionTokens": 184 }
    }
    ```
  - Success: `200 OK`.
  - Errors: `400` invalid difficulty or missing context, `422` invalid AI response schema (return fallback + leave form unchanged), `429` rate limited, `500` model failure.

### 2.8 Vocabulary Overview (Optional Dashboard)

- **Method / Path:** `GET /vocabulary-overview`
  - Description: Proxy `app.vocabulary_overview` with RLS to return joined language/category/word tuples for analytics/table view.
  - Query params: `learningLanguageId`, `categoryId`, `orderBy` (`createdAt|category|language`), `direction`, `page`, `pageSize`.
  - Response JSON (200):
    ```json
    {
      "data": [
        {
          "learningLanguageId": "uuid",
          "learningLanguageCode": "german",
          "categoryId": "uuid",
          "categoryName": "Business",
          "wordId": "uuid",
          "term": "die Firma",
          "translation": "the company",
          "createdAt": "2025-01-03T10:00:00Z"
        }
      ],
      "meta": { "page": 1, "pageSize": 50, "hasMore": false }
    }
    ```
  - Success: `200 OK`.
  - Errors: `401`, `500`.

### 2.9 Testing Utilities (Test Environment Only)

- **Method / Path:** `POST /testing/reset`
  - Description: Truncate user-scoped tables for Cypress runs using service role; only available when `NODE_ENV === "test"` and behind shared secret.
  - Request JSON:
    ```json
    { "adminToken": "string" }
    ```
  - Response JSON (204): empty.
  - Errors: `401`/`403` if not test mode or invalid token, `500`.

## 3. Authentication and Authorization

- **Mechanism:** Supabase GoTrue JWT sessions handled through `@supabase/auth-helpers-nextjs`. API routes verify session using server-side helpers, extracting `auth.uid()` to scope all queries.
- **Session Storage:** Access and refresh tokens stored in HttpOnly cookies via Next.js middleware for SSR support; client obtains session via helper or `/auth/session`.
- **Authorization:** All resource queries executed via Supabase PostgREST or client with RLS ensuring `user_id = auth.uid()` for profiles, learning languages, categories, words, and views (per db-plan triggers/policies). Service-role Supabase client restricted to server-only contexts (AI generation, testing resets) and never exposed to browser.
- **Rate Limiting:** Apply IP + user-based rate limiting (e.g., Upstash Redis) especially to `POST /auth/*`, `POST /ai` endpoints to mitigate abuse; enforce 10 requests/minute per user for AI endpoint and 20/minute per IP for auth operations.
- **Transport Security:** Require HTTPS; set `Strict-Transport-Security` and `SameSite=Lax` cookies. Utilize Next.js middleware for CSRF protection on state-changing routes by validating Supabase JWT + anti-CSRF token (for cookie-based sessions).

## 4. Validation and Business Logic

- **Profiles**
  - Validation: `userLanguage` must be one of static codes; immutable after creation. `userLanguage` mutation attempts return `400`.
  - Business Logic: `POST /auth/register` executes Supabase signup, then inserts profile using service role, relying on trigger `app.tg_prevent_profile_language_update`.

- **Learning Languages**
  - Validation: `languageId` must be in static list, must differ from `profile.userLanguage`, must not already exist for user (unique constraint). Respect pagination defaults to align with `user_created_idx`.
  - Business Logic: On create/delete, API may emit events for UI updates; deletion triggers cascading removal (confirm via UI before calling API). Use RLS `manage_own_learning_languages`.

- **Categories**
  - Validation: `name` required (1–150 chars, trim whitespace), enforce unique `(user_learning_language_id, name)` (case-sensitive). Ensure parent learning language belongs to user.
  - Business Logic: `PATCH` updates propagate via trigger `app.tg_set_category_owner`. Deleting category automatically cascades `words`.

- **Words**
  - Validation: `term`, `translation`, and `examplesMd` required; enforce Markdown length to ensure 3–4 sentences (client-prevalidated, server ensures minimum length/line count). Uniqueness per category via `unique_word_per_category`. Sorting defaults to `created_at desc` leveraging `words_recent_idx`.
  - Business Logic: `POST`/`PATCH` sanitize Markdown (strip disallowed HTML) and trim whitespace. Deletion uses RLS to ensure only owner can remove.

- **AI Generation**
  - Validation: `difficulty` ∈ {`easy`, `medium`, `advanced`} default `medium`; `categoryId` must belong to user; `learningLanguageId`/`userLanguage` cross-checked against DB; request size limited to prevent abuse.
  - Business Logic: API constructs prompt with localized context, calls OpenRouter using server-only key, parses JSON and validates structure (term string, translation string, 3-4 Markdown sentences). On parse failure, return `422` with `error: "InvalidAIResponse"` and do not persist data. Optionally log telemetry (without exposing secrets).

- **Vocabulary Overview**
  - Validation: Accept only known filter combinations; enforce pagination (pageSize ≤ 100). Use security barrier view with RLS to ensure user isolation.

- **Testing Reset**
  - Validation: Only accessible when `NODE_ENV === "test"`; require shared secret header or token. Execute within transaction to truncate `app.words`, `app.categories`, `app.user_learning_languages`, `app.profiles` (if safe) respecting cascade.

- **General**
  - Handle all errors with structured JSON: `{ "error": { "code": "Conflict", "message": "..." } }`.
  - Apply optimistic concurrency via `updatedAt` (optional) by requiring `If-Unmodified-Since` header or request payload `updatedAt` match for `PATCH` endpoints.
  - Implement consistent confirmation flows on client; API idempotent operations guarantee safe retries.
  - Logging: Server logs include request id, user id, endpoint, latency; exclude PII where possible.
  - Observability: Expose metrics (success/error counts, latency) for critical endpoints.








