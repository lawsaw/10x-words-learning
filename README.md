# 10x Words Learning

![Version](https://img.shields.io/badge/version-0.0.1-blue.svg) ![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![CI](https://github.com/lawsaw/10x-words-learning/actions/workflows/pull-request.yml/badge.svg) ![License](https://img.shields.io/badge/license-TBD-lightgrey)

A web-based vocabulary workspace for independent language learners. The MVP blends manual curation and AI-assisted word generation so users can assemble thematic lists, study in table or slider modes, and keep data private through Supabase row-level security. For a detailed breakdown of requirements, see the [Product Requirements](./.ai/prd.md).

## Table of Contents
- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Testing & QA](#testing--qa)
- [Continuous Integration](#continuous-integration)
- [Available Scripts](#available-scripts)
- [API Documentation](#api-documentation)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description
10x Words Learning delivers a structured environment for building and practicing multilingual vocabulary sets:
- Email/password accounts require learners to pick an immutable user language at registration.
- Users manage learning languages, subject categories, and words, with guard rails against duplicates and cascading deletions across the hierarchy.
- Words capture multilingual definitions, personal translations, and Markdown-formatted usage examples with timestamps for chronological sorting.
- AI generation via OpenRouter (DeepSeek) can overwrite an in-progress word form with JSON-provided suggestions while a full-screen loader blocks interactions.
- Two study modes—table and slider—offer responsive layouts, shuffle controls, and boundary-aware navigation.
- Supabase persistence enforces row-level security policies so each learner only accesses their own data.

## Tech Stack
- **Frontend:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Shadcn/ui, lucide-react, class-variance-authority, tailwind-merge, tw-animate-css.
- **Backend & Data:** Supabase with `@supabase/supabase-js` and `@supabase/ssr` for authenticated access, cascading deletes, and role separation.
- **AI & Integrations:** OpenRouter (DeepSeek) for AI-assisted vocabulary generation.
- **Testing:** Vitest for unit, component, and API integration tests; Playwright for end-to-end testing with visual regression and accessibility checks; React Testing Library for component behavior testing; MSW for API mocking; Grafana k6 for performance testing; Axe-core for accessibility audits; Semgrep for security static analysis.
- **Tooling & Quality:** ESLint 9, Prettier, TypeScript tooling, Husky, lint-staged, GitHub Actions for CI.

## Getting Started Locally
### Prerequisites
- Node.js 20 or later
- npm 10 or later
- Supabase project with credentials (URL and anon key)
- OpenRouter API key for DeepSeek access

### Installation
1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/lawsaw/10x-words-learning.git
   cd 10x-words-learning
   npm install
   ```

2. Set up environment variables:
   ```bash
   # For development/production
   cp .env.example .env
   
   # For E2E testing (only if running tests)
   cp .env.test.example .env.test
   
   # Edit both files with your actual credentials
   ```
   See the [Environment Variables](#environment-variables) section for detailed configuration.

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open the app at `http://localhost:3000` and sign up to begin adding learning languages, categories, and words.

### Environment Variables

The project uses different environment files for different contexts. Separate example files are provided:
- `.env.example` → `.env` for development/production
- `.env.test.example` → `.env.test` for E2E testing

#### `.env` (Development & Production)
Required for running the application locally or in production:

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# AI Generation (Required for word suggestions)
OPENROUTER_API_KEY=<your-openrouter-api-key>
```

**How to get these values:**
- **Supabase credentials**: Go to your [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API
- **OpenRouter API Key**: Sign up at [OpenRouter](https://openrouter.ai/) and create an API key

#### `.env.test` (E2E Testing)
Required for running Playwright end-to-end tests:

```bash
# Supabase Configuration (same as .env or separate test instance)
NEXT_PUBLIC_SUPABASE_URL=<your-test-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-test-supabase-anon-key>

# E2E Test User Credentials
E2E_USERNAME_ID=<test-user-uuid>
E2E_USERNAME=<test-user-email>
E2E_PASSWORD=<test-user-password>
```

**Note:** The test user must exist in your Supabase project with a matching profile in `app.profiles` table. These same credentials must also be configured as GitHub Secrets for CI/CD. See the [Continuous Integration](#continuous-integration) section for setup instructions.

### Testing & QA

#### End-to-End Tests (Playwright)
E2E tests use Playwright with the Page Object Model pattern to ensure critical user flows work correctly.

**Setup:**
1. Configure `.env.test` file as described in the [Environment Variables](#environment-variables) section

2. Create the test user in your Supabase project:
   - Navigate to **Authentication** → **Users** in your Supabase dashboard
   - Click **Add user** → **Create new user**
   - Email: The email specified in `E2E_USERNAME`
   - Password: The password specified in `E2E_PASSWORD`
   - After user creation, ensure a profile entry exists in the `app.profiles` table with:
     - `id`: The user's UUID (found in the Authentication section)
     - `user_language_id`: A valid language ID from `app.languages` table
     - `created_at`: Current timestamp

**Running Tests:**
- Run all E2E tests: `npm run test:e2e`
- Run specific test file: `npx playwright test add-polish-language`
- Run with UI (headed mode): `npx playwright test add-polish-language --headed`
- Run with single worker: `npx playwright test add-polish-language --workers=1`
- View test report: `npx playwright show-report`

**Test Coverage:**
- Add/delete learning languages with cleanup
- Dialog interactions and cancellations
- Authentication flows
- Empty state handling

Additional test and migration scripts will build on the Supabase configuration outlined in the PRD.

## Continuous Integration

The project uses GitHub Actions for automated testing on all pull requests. The CI pipeline includes:

- **Linting** - ESLint checks for code quality
- **Build** - Validates production build succeeds
- **Unit Tests** - Runs Vitest tests with coverage collection
- **E2E Tests** - Executes Playwright tests in CI environment

All jobs run in parallel after successful linting, and a status comment is automatically posted to the pull request with detailed results.

### GitHub Secrets Configuration

For CI to work, configure these secrets in your GitHub repository:

**Settings → Environments → Create "integration" environment**

Add the following secrets to the **integration** environment:

**Application Secrets:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `OPENROUTER_API_KEY` - Your OpenRouter API key for AI generation

**E2E Test Secrets:**
- `E2E_USERNAME_ID` - Test user UUID from Supabase Authentication
- `E2E_USERNAME` - Test user email address
- `E2E_PASSWORD` - Test user password

The workflow automatically runs on pull requests and posts detailed status comments with job results and links to workflow runs.

## Available Scripts
- `npm run dev` — Start the Next.js development server.
- `npm run build` — Create an optimized production build.
- `npm run start` — Serve the production build.
- `npm run lint` — Run ESLint checks.
- `npm run lint:fix` — Run ESLint with automatic fixes.
- `npm run format` — Format files with Prettier.
- `npm run test` — Run unit and integration tests with Vitest.
- `npm run test:e2e` — Run end-to-end tests with Playwright.
- `npm run test:e2e:ui` — Run E2E tests with Playwright UI mode.

## API Documentation

A comprehensive REST API is available for all application functionality. See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete endpoint documentation including:

- **Authentication** - Register, login, logout, session management
- **Languages** - Available language catalog
- **Profile** - User profile management
- **Learning Languages** - CRUD with optional statistics
- **Categories** - Full category management with search and word counts
- **Words** - Complete vocabulary CRUD with multiple view modes and global search
- **AI Generation** - OpenRouter integration for word suggestions
- **Vocabulary Overview** - Aggregated analytics view
- **Testing** - Database reset utilities for test environments

All endpoints follow REST conventions with standardized error responses and proper HTTP status codes.

## Project Scope
**In scope**
- Email/password authentication with immutable user language selection.
- CRUD for learning languages, categories (including rename), and words with Markdown-rich examples.
- AI-assisted vocabulary generation that overwrites current form data when successful.
- Table and slider study modes with shuffle behavior and responsive layouts.
- Standardized confirmation dialogs and cascading delete flows across the vocabulary hierarchy.
- Supabase persistence with row-level security and separated roles.
- Playwright end-to-end coverage for the primary user flows using the Page Object Model pattern.

**Out of scope**
- Progress tracking, spaced repetition, or learning analytics.
- Administrative dashboards or cross-user management.
- Password recovery, multi-factor authentication, or email verification flows.
- AI prompt customization beyond language, category, and difficulty parameters.
- Native mobile applications (web-responsive experience only).
- External error tracking, analytics, or rate limiting.

## Project Status
The project is in active MVP development guided by the PRD. Upcoming milestones focus on:
- Implementing the end-to-end CRUD and study flows described in the functional requirements.
- Integrating Supabase row-level security and cascading deletes across environments.
- Expanding Playwright test suites following the Page Object Model pattern for comprehensive coverage.
- Meeting success metrics such as 100% usability for core flows and consistent AI-generated JSON responses.

## License
License information is not yet specified. Until a license is declared, the project should be treated as "all rights reserved."
