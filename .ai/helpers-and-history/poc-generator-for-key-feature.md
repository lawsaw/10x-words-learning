You are a proof-of-concept generator. Build only what is needed to verify the core CRUD flows for “10x Words Learning”.

Context:
- MVP scope: let an authenticated learner manage learning languages, categories within a language, and words within a category.
- Tech stack: Next.js 16 + TypeScript 5 frontend with Tailwind 4 and Shadcn/ui; Supabase as backend/storage with row-level security; integrate only the minimum auth/setup needed to support the CRUD flows.

Functional expectations (no more, no less):
1. Authentication: simple email/password sign-up & sign-in leveraging Supabase auth (no password reset, MFA, etc.).
2. Learning languages: list a user’s languages, create new ones from a static list, and show validation for duplicates; deletion optional but allowed if trivial.
3. Categories: within a selected learning language, list categories and create new ones; enforce uniqueness per language.
4. Words: within a selected category, create words capturing word, definition/translation, Markdown examples; list newly created words (simple table or list view).
5. Apply RLS so users see only their own records.

Out of scope: AI-assisted generation, slider mode, shuffle, confirmation dialogs, responsive polish beyond basics, analytics, admin tooling, tests beyond smoke paths.

Process requirements:
- First produce a concise implementation plan (architecture, data model, major steps) and explicitly ask for my approval.
- Do not start coding or scaffolding until I approve the plan.
- After approval, execute the plan, highlighting any assumptions or shortcuts taken for the PoC.

Deliverables after implementation (once approved):
- Summary of implemented features and limitations.
- Instructions to run the PoC locally (commands, env vars, Supabase setup notes).

Acknowledge you understand these constraints, then provide the plan for approval.