## Introduction And Goals

- Ensure 10x Words Learning delivers reliable vocabulary management, AI-assisted generation, and dual study modes across web clients.
- Validate Supabase-backed security (row-level security, ownership enforcement) and Next.js 16 API compliance.
- Detect regressions early by aligning tests with PRD, auth spec, and implementation summary, emphasizing CRUD consistency and user privacy.

## Scope Of Testing

- In-scope: `app/api/*` endpoints, `lib/services/*`, validation schemas, Supabase RLS policies, registration/login (`components/public/register-form.tsx`), workspace client flows (`app/(app)/app/workspace-client.tsx`), AI generation, study modes, and UI responsiveness.
- Out-of-scope: future enhancements beyond MVP (rate limiting middleware, analytics), third-party OpenRouter uptime, non-web clients.

## Test Types

- Unit: Vitest for service functions, validation schemas, utility modules (`lib/validation.ts`, `lib/errors.ts`).
- Component: React Testing Library + Vitest for Shadcn/ui components, form logic, state hooks.
- API/Integration: Vitest + Next.js route handler testing for `app/api` routes with Supabase test project; verify responses, RLS, cascading deletes.
- End-to-End: Playwright against deployed preview or Docker container to cover registration, CRUD, study flows, AI generation, logout.
- API Mocking: MSW to validate OpenRouter AI payloads, timeouts, and error scenarios.
- Performance/Load: Grafana k6 on critical endpoints (words CRUD, AI generation) to ensure Supabase quotas respected.
- Accessibility: Axe-core automated scans via Playwright in CI + manual keyboard/ARIA review.
- Security: Static analysis (ESLint security rules + Semgrep), RLS penetration tests, Markdown sanitization checks.
- Visual regression: Playwright built-in screenshot comparison for table/slider modes across breakpoints.

## Key Test Scenarios

- Authentication: immutable language selection, rejection of duplicate emails, session persistence/expiration, unauthorized API blocks.
- Learning language CRUD: create/update/delete with stats verification, preventing duplicates, cascading delete impact on categories/words.
- Category & word management: hierarchical CRUD, duplicate prevention, Markdown example rendering & sanitization, timestamp ordering.
- AI generation: triggering loader, handling success overwrite vs errors/timeouts, ensuring manual edits preserved when canceling.
- Study modes: table navigation/shuffle, slider boundary handling, responsive layouts (mobile/tablet/desktop), accessibility shortcuts.
- Vocabulary overview: aggregated metrics accuracy after CRUD ops.
- Supabase RLS: attempt cross-user access via API, ensure denial.
- Error handling: validation failures, network errors surfaced via user-friendly toasts/dialogs.
- Testing utilities endpoint: database reset limited to test env, proper authentication gating.

## Testing Environment

- Local: Next.js dev server + Supabase local stack with seed data.
- CI: GitHub Actions pipeline running lint/unit/component/API tests with Supabase test project & mocked OpenRouter (MSW).
- Staging: Dockerized build deployed to DigitalOcean droplet; Playwright E2E + visual tests.
- Data sets: anonymized fixtures covering multiple languages/categories, boundary values (long text, Markdown, Unicode).

## Testing Tools

- Vitest + ts-node for unit/component/API integration tests (unified testing framework).
- React Testing Library + Testing Library DOM for UI behavior.
- Playwright for E2E, visual regression testing, and advanced accessibility checks.
- MSW for OpenRouter API mocking and error scenario simulation.
- ESLint, Semgrep, TypeScript compiler, Prettier for static quality gates.
- Grafana k6 for performance and load testing.
- Axe-core (via Playwright) + Lighthouse CI for accessibility/performance.
- Supabase Studio for data inspection during validation.

## Test Structure

```
tests/
├── unit/              # Vitest unit tests for services & utilities
├── component/         # React Testing Library component tests
├── integration/       # API route tests with Vitest + Supabase
├── e2e/              # Playwright end-to-end scenarios
├── performance/       # k6 load testing scripts
├── fixtures/         # Shared test data & factories
└── mocks/            # MSW handlers for external APIs
```

## Test Schedule

- Sprint Day 1-2: Update/add unit tests for new features; ensure lint/TypeScript/Semgrep clean.
- Day 3-4: Component + API/integration suites; execute RLS/security checks.
- Day 5: Playwright E2E + visual + accessibility audits on staging build.
- Prior to release: k6 performance runs, smoke tests post-deployment, regression rerun triggered by GitHub Actions workflow.
- Hotfix cadence: targeted unit/API tests within 4 hours, E2E smoke within 24 hours.

## Acceptance Criteria

- 100% passing automated suites (unit, component, API, E2E) in CI.
- Critical user journeys (register, login, CRUD, AI generation, study modes) validated manually and via Playwright.
- No open Sev-1/Sev-2 defects; Sev-3 max 2 with mitigation plan.
- Performance: p95 API latency < 500ms for CRUD endpoints under target load; AI generation gracefully handles 5s timeout.
- Accessibility score ≥ 90 (Lighthouse) and zero WCAG AA blockers.
- Visual regression: no unintended UI changes across desktop/tablet/mobile viewports.

## Roles And Responsibilities

- QA Lead: own test plan, schedule, defect triage, release readiness sign-off.
- QA Engineers: design/maintain test cases, develop automated suites (Vitest, Playwright), execute exploratory tests.
- Developers: provide unit/component coverage, assist with fixtures/mocks, fix defects.
- DevOps: maintain CI/CD pipelines, test environments, Supabase test instances, k6 infrastructure.
- Product Owner: prioritize defects, confirm acceptance criteria alignment.

## Bug Reporting Procedures

- Log issues in project tracker with severity, environment, reproduction steps, expected vs actual results, screenshots/logs, Playwright traces.
- Tag related modules (e.g., `app/api/words`, `lib/services/auth.service.ts`) for traceability.
- Include Supabase request IDs and AI payload snippets when relevant.
- QA Lead reviews new bugs within 24 hours, assigns ownership, and updates status during daily stand-up.
- Blocking issues trigger immediate Slack notification and halt release until resolved.

## Technology Rationale

- **Vitest**: Fast, modern, ESM-native, unified framework for unit/component/API tests with excellent TypeScript support.
- **Playwright**: Superior E2E performance, built-in visual regression, multi-browser support, trace debugging, better Next.js 16 compatibility than Cypress.
- **MSW**: Realistic network-level mocking sufficient for OpenRouter integration testing without contract testing overhead.
- **Grafana k6**: Go-based performance tool with excellent reporting, Grafana integration, and active maintenance.
- **Semgrep**: Advanced static security analysis beyond ESLint, with Supabase-specific rules and SQL injection detection.
