# Authentication Architecture Specification

## Overview

- Scope: email/password registration, login, and logout for 10x Words Learning, aligned with PRD section 3.1 and the tech stack (NextJS 16, TypeScript 5, Tailwind 4, Shadcn/ui, Supabase).
- Goals: keep the public landing experience lightweight, gate the workspace behind Supabase Auth, and preserve language/category/word flows described in the PRD by ensuring authenticated sessions remain stable.
- Constraints: password reset and account recovery remain out of scope for the MVP; the UI must not surface recovery entry points so expectations stay aligned with the PRD.

## 1. User Interface Architecture

### 1.1 Application Shell & Routing

- `app/layout.tsx` initializes fonts and global styles; no auth logic is placed here to avoid coupling public and private shells.
- Public segment `app/(public)` hosts the landing page (`page.tsx`). These routes must remain accessible to unauthenticated visitors.
- Authenticated segment `app/(app)` uses `app/(app)/layout.tsx` to create a Supabase server client and redirect anonymous users to `/`. This layout wraps all workspace routes (`/app`, `/app/[learningLanguageId]`, `/app/[learningLanguageId]/[categoryId]`, study mode, etc.) so existing CRUD and study flows stay under auth.
- `middleware.ts` (via `lib/supabase/middleware.ts`) keeps Supabase cookies synchronized on every request; this is required for both server components and API routes to read the same session without breaking other features.
- Navigation: successful auth always redirects to `/app` (workspace dashboard). Logging out or session expiration routes users back to `/`, which renders the public landing page with auth modals disabled by default.

### 1.2 Public Experience & Modals

- `app/(public)/page.tsx` (server component) fetches `/api/auth/session` and `/api/languages?scope=registration`. It redirects authenticated users to `/app` and passes language data plus the active modal key to `LandingPageClient`.
- `LandingPageClient` orchestrates UI sections (hero, feature grid, privacy) and controls modal visibility through `AuthModalSwitch` + `useModalState`.
- `RegisterModal` (client) responsibilities:
  - Own the registration form state (email, password, userLanguage, status, error).
  - Fetch the static language list lazily (using `/api/languages?scope=registration`) when opened, handling loading, retry, and empty states.
  - Perform client-side guards (email format, password ≥ 6 characters, language selection) before POSTing `/api/auth/register`.
  - On success, close modal and reload the app (`window.location.replace("/app")`).
- `LoginModal` (client) responsibilities:
  - Manage email/password inputs, simple presence validation, and submission status.
  - POST `/api/auth/login`, display inline authentication errors, and redirect to `/app` on success.
  - Link to `RegisterModal` via `onSwitch`.
- `AuthModalSwitch` renders the correct modal lazily, keeping DOM clean when no modal is active.

### 1.3 Authenticated Workspace UI

- `app/(app)/layout.tsx` enforces auth and passes children to workspace pages without re-rendering the landing modals.
- `components/app/app-shell-layout.tsx` supplies the shared header (brand + `LogoutButton`), breadcrumb slots, and main content container. All workspace pages should continue to use this layout so authentication controls remain consistent.
- `components/app/logout-button.tsx` (client) is responsible for POSTing `/api/auth/logout`, handling loading state, and performing `router.push("/")` + `router.refresh()` after sign-out. No other component should call logout directly.
- Workspace-specific client components (languages dashboard, category views, study slider) remain untouched but rely on the authenticated Supabase session maintained by the layout and middleware.

### 1.4 Responsibilities & Integration Boundaries

- Server components (e.g., `app/(public)/page.tsx`, `app/(app)/app/page.tsx`) handle data prefetching using `fetch` or Supabase server clients; they never manage interactive form state or call auth APIs directly.
- Client components are split by concern:
  - **Presentation containers** (`HeroSection`, `FeatureGrid`, `PrivacySection`) display marketing or workspace content without understanding auth state.
  - **Form controllers** (`RegisterModal`, `LoginModal`) manage local state, validation, submission orchestration, and error messaging. They call REST endpoints via `fetch` with `credentials: "include"` to ensure Supabase cookies sync.
  - **Navigation helpers** (`AuthModalSwitch`, `useModalState`, `LogoutButton`) coordinate user actions (open modal, switch modal, route after logout) and never format data.
- This separation keeps the authentication backend contract isolated inside API routes (`app/api/auth/*`) so UI changes cannot bypass validation or RLS protections.

### 1.5 Validation & Error Messaging

| Surface                    | Rule                                                                                 | UI Feedback                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Registration email         | Must be a valid address (HTML5 + regex); trimmed non-empty                           | "Enter a valid email address."                                                                       |
| Registration password      | Minimum 6 characters (per PRD)                                                       | Inline helper text updates on blur; submission error reads "Password must be at least 6 characters." |
| Registration user language | Required selection from server-provided list; disabled options for unsupported codes | "Select your language to tailor prompts."                                                            |
| Login email/password       | Both required; password min length 1 to avoid blank submissions                      | "Invalid email or password. Please try again."                                                       |
| Duplicate email            | Supabase returns 409 → mapped to `ConflictError`                                     | "Email address is already registered."                                                               |
| Language fetch failure     | Network/500 errors when loading registration languages                               | Inline alert with retry button.                                                                      |
| Global server error        | Unexpected 5xx or network failures                                                   | Inline destructive alert with fallback message "Something went wrong. Please try again."             |

### 1.6 Key Scenario Handling

- **First-time registration**: user opens `RegisterModal`, completes form, receives inline validation, API returns `201`, modal closes, window navigates to `/app`, `AppLayout` confirms session and renders workspace dashboard.
- **Duplicate email**: Supabase `signUp` detects existing account, API raises `ConflictError`, UI shows blocking alert and keeps modal open.
- **Invalid login**: API responds 401 with standardized message; UI clears password field and focuses it for retry.
- **Language fetch outage**: registration modal shows alert + retry; submission remains disabled until languages load successfully to avoid mismatched user language IDs.
- **Session expiration while browsing workspace**: next navigation or fetch triggers redirect to `/` via `AppLayout` or 401 from API; `LandingPage` sees no session and re-enables login modal entry points.
- **Logout**: user clicks `LogoutButton`, API signs them out, router pushes `/`, and cached data refreshes to show public landing content.

## 2. Backend Logic

### 2.1 API Endpoint Contracts

| Endpoint             | Method | Auth             | Purpose & Behavior                                                                                                                                                               |
| -------------------- | ------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/auth/register` | POST   | Public           | Validates `RegisterCommand`, calls `AuthService.register`, inserts profile with immutable `user_language_id`, returns session + profile payload, and sets Supabase auth cookies. |
| `/api/auth/login`    | POST   | Public           | Validates `LoginCommand`, calls `AuthService.login`, returns session tokens, relies on Supabase SSR helpers to set cookies.                                                      |
| `/api/auth/logout`   | POST   | Requires session | Invokes `AuthService.getCurrentUserId` to guard, then `AuthService.logout`, clearing auth cookies.                                                                               |
| `/api/auth/session`  | GET    | Requires session | Returns `AuthSessionStatusDto` for landing page gating; 401 if anonymous.                                                                                                        |

### 2.2 Data Model Alignment

- **Supabase Auth (`auth.users`)** stores email and hashed password; minimal profile data remains external.
- **`app.languages`** (static list per PRD assumption) backs the registration language select. Endpoint `/api/languages?scope=registration` filters to the canonical five languages and ensures codes align with Supabase constraints (`languageCodeSchema`).
- **`app.profiles`** persists `user_id`, `user_language_id`, optional `display_name`, and timestamps. `user_language_id` is a foreign key to `app.languages.code` and is written once during registration by the API. Downstream features (AI prompts, filtering) read this field, so any auth change must leave it intact.
- **User-generated tables** (`user_learning_languages`, `categories`, `words`) rely on Supabase RLS rules keyed by `auth.uid()`. Authentication endpoints must not mutate these tables directly but must maintain sessions so other API routes continue to resolve `user_id`.

### 2.3 Input Validation Mechanism

- Server-side validation uses Zod schemas in `lib/validation.ts` (`registerCommandSchema`, `loginCommandSchema`). Each handler parses `request.json()`, calls the schema `.parse`, and short-circuits with `ValidationError` for descriptive 400 responses so malformed payloads never reach Supabase.
- Client-side validation mirrors these rules to provide immediate feedback while still deferring to server truth to avoid divergence.

### 2.4 Exception Handling

- `lib/errors.ts` defines domain errors (`ValidationError`, `UnauthorizedError`, `ConflictError`). `AuthService` methods throw these when translating Supabase errors (e.g., duplicate email, invalid credentials) or unexpected failures.
- `app/api/*/route.ts` files wrap handlers in `try/catch` and delegate to `errorResponse`, which serializes `{ error: { code, message } }` with proper HTTP status. This keeps UI messaging predictable and prevents leakage of Supabase internals.
- Logging: centralized in `AuthService` so unexpected Supabase responses can be inspected without exposing details to the client.

### 2.5 Session & Security Considerations

- `AuthService.getCurrentUserId` is the canonical way for API routes to confirm authentication before performing user-specific operations (languages, categories, words). Auth endpoints must keep this helper untouched so existing CRUD features remain protected.
- Supabase RLS policies remain unchanged: authentication only supplies JWTs, while data access continues to filter on `auth.uid()`. Session persistence through middleware ensures AI generation, category management, and slider mode keep working after login.
- Since email verification is off, ensure Supabase project settings disable confirm links and allow immediate session issuance to match PRD expectations.

## 3. Authentication System (Supabase + NextJS)

### 3.1 Supabase Configuration

- Environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` feed `createServerClient` / `createClient`. Service-role keys stay server-only (never bundled).
- Auth settings: enable email/password provider, disable email confirmations, and set password minimum length to 5 to align with UI messaging. Optional: customize rate limits to protect against brute force.
- Database schema: `app` schema holds `profiles`, `languages`, and domain tables. Database triggers are not required because profile insertion happens within `AuthService.register`.

### 3.2 Session Propagation in NextJS 16

- Server components call `createClient()` from `@/lib/supabase/server` to access `supabase.auth.getSession()` or `getUser()`.
- Client components that need Supabase (none within auth UI currently) would import from `@/lib/supabase/client`.
- `middleware.ts` ensures Supabase cookies remain in sync even during static asset requests, preventing random logouts across navigation per Supabase SSR guidance.
- The `/api/auth/*` routes run on the Edge/Node runtime (default). Because they use `createClient()`, they automatically read/write auth cookies, so UI fetches with `credentials: "include"` will share session state.

### 3.3 Registration Pipeline

1. `RegisterModal` validates inputs locally and POSTs `/api/auth/register`.
2. Route handler validates payload (Zod) and calls `AuthService.register`.
3. Auth service:
   - Ensures `userLanguage` exists in `app.languages`.
   - Calls `supabase.auth.signUp`.
   - Writes `app.profiles` row with immutable language selection.
   - Builds `RegisterResponseDto` with user, session, and profile info.
4. API responds `201 Created`, Next.js automatically sets Supabase cookies, and client redirects to `/app`.
5. `AppLayout` verifies session and renders `app/(app)/app/page.tsx`, which continues existing language dashboard behavior.

### 3.4 Login & Logout Pipeline

- Login flow:
  1. `LoginModal` collects credentials and POSTs `/api/auth/login`.
  2. API validates payload and calls `AuthService.login`, which wraps `supabase.auth.signInWithPassword`.
  3. On success, session data is returned and cookies update; client redirects to `/app`.
  4. On failure, unauthorized error surfaces to UI without exposing system details.
- Logout flow:
  1. `LogoutButton` POSTs `/api/auth/logout`.
  2. Handler confirms authentication via `getCurrentUserId`, calls `AuthService.logout` (Supabase `signOut`), and returns `204 No Content`.
  3. Client pushes `/` and refreshes, ensuring landing page re-mounts without stale auth state.

### 3.5 Testing & Tooling

- Existing Cypress suites for registration, adding languages, categories, manual words, and slider navigation continue to run against the authenticated workspace because the auth flows remain REST-based.
- Add Cypress helpers for authentication:
  - `cy.registerTestUser()` hitting `/api/auth/register`.
  - `cy.login()` calling `/api/auth/login` and storing cookies.
- Local Supabase test database (per PRD 3.8) should seed the static `languages` table and clean up `auth.users` between runs via `/api/testing/reset`.

### 3.6 Observability & Resilience

- Centralize auth-related logging inside `AuthService` to capture unexpected Supabase errors without leaking to clients.
- Rate-limit public auth endpoints via middleware (future work) if needed; spec keeps them stateless so CDN caching remains off.

## 4. Alignment with PRD User Stories

- **US-001 Registration with Fixed User Language**: `RegisterModal`, `/api/auth/register`, and the immutable `user_language_id` write ensure signup enforces the static list and minimum password length before routing learners to `/app`.
- **US-002 Login to Existing Account**: `LoginModal` + `/api/auth/login` handle credential validation, user-friendly errors, and redirect logic that lands authenticated learners on the workspace dashboard.
- **US-003 View Learning Languages Dashboard**: `app/(app)/layout.tsx` verifies a Supabase session before rendering the existing dashboard, guaranteeing only authenticated users access their learning languages.
- **US-004 Add Learning Language from Static List**: Authenticated sessions established by this spec allow the existing language CRUD UI to call protected APIs that already enforce the static language list minus the user language.
- **US-005 Remove Learning Language with Cascade**: Session persistence plus `AuthService.getCurrentUserId` ensure delete actions remain scoped to the owner so cascades in Supabase execute safely.
- **US-006 Manage Categories per Learning Language**: Because authenticated Supabase clients remain available across the workspace, category creation and renaming continue to leverage current APIs under the same session.
- **US-007 Remove Category with Cascade**: The same session guard plus Supabase RLS policies guarantee category deletions run under the learner’s identity and cascade to associated words.
- **US-008 Manage Word Details Manually**: Word forms rely on the authenticated Supabase context preserved by middleware; no additional auth changes are needed for CRUD parity.
- **US-009 Delete Word with Confirmation**: Confirmations continue to call authenticated delete APIs because `/app` pages only render once the session is validated.
- **US-010 Generate Word via AI**: AI prompts depend on the stored `user_language_id`; registration flow writes this field once so the AI service can safely derive context for every subsequent request.
- **US-011 Switch Between Table and Slider Views**: View toggles remain client-side features rendered inside the authenticated workspace, so this spec leaves them fully supported.
- **US-012 Browse Words in Table View**: Session persistence ensures the table continues to fetch scoped data via Supabase RLS using the logged-in user.
- **US-013 Learn Words in Slider View**: Slider mode consumes the same authenticated datasets as the table and therefore remains available once the session guard passes.
- **US-014 Standardized Confirmation Dialogs**: Since delete APIs already require authentication, confirmation dialogs stay consistent and backed by the same session-aware endpoints.
- **US-015 Enforce Data Isolation and Row-Level Security**: Middleware and `AuthService.getCurrentUserId` preserve Supabase cookies and JWT issuance so RLS policies keep isolating each learner’s data.
- **US-016 Run Cypress End-to-End Tests Against Ephemeral Database**: REST endpoints for register/login/logout remain deterministic, enabling Cypress helpers to seed sessions and exercise downstream CRUD and slider flows against isolated Supabase instances.

---

This architecture maintains clear boundaries between UI, API, and Supabase Auth, satisfies PRD authentication requirements, and leaves existing vocabulary management features untouched by guaranteeing that successful sessions unlock the entire `/app` experience exactly as before.
