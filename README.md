# 10x Words Learning
![Version](https://img.shields.io/badge/version-0.0.1-blue.svg) ![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![CI](https://img.shields.io/badge/CI-GitHub%20Actions-blue) ![License](https://img.shields.io/badge/license-TBD-lightgrey)

A web-based vocabulary workspace for independent language learners. The MVP blends manual curation and AI-assisted word generation so users can assemble thematic lists, study in table or slider modes, and keep data private through Supabase row-level security. For a detailed breakdown of requirements, see the [Product Requirements](./.ai/prd.md).

## Table of Contents
- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
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
- Supabase project credentials (URL, anon key, service role for migrations/tests)
- OpenRouter API key for DeepSeek access

### Installation
1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/lawsaw/10x-words-learning.git
   cd 10x-words-learning
   npm install
   ```
2. Create a `.env.local` file and add the required environment variables, including (but not limited to):
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key-for-scripts>
   OPENROUTER_API_KEY=<your-openrouter-api-key>
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open the app at `http://localhost:3000` and sign up to begin adding learning languages, categories, and words.

### Testing & QA
- Configure an isolated Supabase instance (local or ephemeral) for Cypress end-to-end tests that cover registration, CRUD flows, and slider navigation.
- Additional test and migration scripts will build on the Supabase configuration outlined in the PRD.

## Available Scripts
- `npm run dev` — Start the Next.js development server.
- `npm run build` — Create an optimized production build.
- `npm run start` — Serve the production build.
- `npm run lint` — Run ESLint checks.
- `npm run lint:fix` — Run ESLint with automatic fixes.
- `npm run format` — Format files with Prettier.

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
- Cypress end-to-end coverage for the primary user flows using an isolated database.

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
- Providing Cypress suites that run against an isolated database.
- Meeting success metrics such as 100% usability for core flows and consistent AI-generated JSON responses.

## License
License information is not yet specified. Until a license is declared, the project should be treated as "all rights reserved."