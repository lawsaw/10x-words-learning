1. Tables with columns, data types, and constraints

### `app.languages`

- `code text primary key` – stable identifier (e.g., `english`, `german`), seeded via migrations.
- `name text not null` – human-readable label.
- `created_at timestamptz not null default now()` – audit timestamp.
- `updated_at timestamptz not null default now()` – maintained by shared timestamp trigger.

### `app.profiles`

- `user_id uuid primary key references auth.users(id) on delete cascade` – inherits Supabase auth identifier.
- `user_language_id text not null references app.languages(code)` – immutable preferred language selected at signup.
- `created_at timestamptz not null default now()`.
- `updated_at timestamptz not null default now()`.
- Constraints:
  - Check via trigger to prevent updates to `user_language_id` after insert.
  - Owned by `service_role`; inserts occur through signup trigger to ensure metadata validation.

### `app.user_learning_languages`

- `id uuid primary key default gen_random_uuid()`.
- `user_id uuid not null references app.profiles(user_id) on delete cascade`.
- `language_id text not null references app.languages(code)`.
- `created_at timestamptz not null default now()`.
- `updated_at timestamptz not null default now()`.
- Constraints:
  - `unique_user_language` unique constraint on `(user_id, language_id)`.
  - Trigger propagates `user_id` and guards against adding the same language as the immutable `user_language_id`.

### `app.categories`

- `id uuid primary key default gen_random_uuid()`.
- `user_learning_language_id uuid not null references app.user_learning_languages(id) on delete cascade`.
- `user_id uuid not null references app.profiles(user_id) on delete cascade`.
- `name text not null`.
- `created_at timestamptz not null default now()`.
- `updated_at timestamptz not null default now()`.
- Constraints:
  - `unique_category_name` unique constraint on `(user_learning_language_id, name)` (case-sensitive).
  - Trigger keeps `user_id` synchronized with the parent learning language.

### `app.words`

- `id uuid primary key default gen_random_uuid()`.
- `user_learning_language_id uuid not null references app.user_learning_languages(id) on delete cascade`.
- `user_id uuid not null references app.profiles(user_id) on delete cascade`.
- `category_id uuid not null references app.categories(id) on delete cascade`.
- `term text not null` – word in the learning language.
- `translation text not null` – learner’s translation.
- `examples_md text not null` – Markdown-formatted usage examples (3–4 sentences recommended).
- `created_at timestamptz not null default now()`.
- `updated_at timestamptz not null default now()`.
- Constraints:
  - `unique_word_per_category` unique constraint on `(category_id, term)`.
  - Trigger ensures `user_learning_language_id` and `user_id` remain aligned with the referenced category.

### Support objects

- Extension: `pgcrypto` enabled for `gen_random_uuid()`.
- Shared trigger functions in `app` schema:
  - `app.tg_set_timestamp()` to maintain `updated_at`.
  - `app.tg_set_category_owner()` and `app.tg_set_word_owner()` to copy parent ownership columns and enforce consistency.
  - `app.tg_prevent_profile_language_update()` to keep `user_language_id` immutable.
- View: `app.vocabulary_overview` (security-barrier) exposing vocabulary joined across tables for read-only client access.
- RPC helpers wrapping the view to enforce parameterized filtering by authenticated user.

2. Relationships between tables

- One `app.languages` record can relate to many `app.profiles` (1:N via `user_language_id`).
- One `app.profiles` record owns many `app.user_learning_languages` (1:N via `user_id`).
- One `app.user_learning_languages` record owns many `app.categories` (1:N via `user_learning_language_id`).
- One `app.categories` record owns many `app.words` (1:N via `category_id`).
- `app.user_learning_languages` also relates to many `app.words` (1:N via `user_learning_language_id`) for cross-category aggregation.
- Cascading deletes propagate from `auth.users` → `app.profiles` → `app.user_learning_languages` → `app.categories` → `app.words`.

3. Indexes

- `app.languages_pkey` (btree on `code`).
- `app.profiles_pkey` (btree on `user_id`).
- `app.user_learning_languages_pkey` (btree on `id`).
- `app.user_learning_languages_unique_user_language` (unique btree on `(user_id, language_id)`).
- `app.user_learning_languages_user_created_idx` (btree on `(user_id, created_at desc)`) for dashboard listings.
- `app.categories_pkey` (btree on `id`).
- `app.categories_unique_category_name` (unique btree on `(user_learning_language_id, name)`).
- `app.categories_lookup_idx` (btree on `(user_learning_language_id, created_at desc)`).
- `app.words_pkey` (btree on `id`).
- `app.words_unique_word_per_category` (unique btree on `(category_id, term)`).
- `app.words_recent_idx` (btree on `(user_learning_language_id, created_at desc)`) for slider/table ordering.
- `app.words_category_idx` (btree on `(category_id, created_at desc)`) to accelerate per-category fetches.

4. PostgreSQL policies (RLS)

- `app.languages`: RLS disabled; grant `SELECT` to `authenticated` and `anon` roles for static lookups.
- `app.profiles`:
  - Enable RLS.
  - Policy `select_own_profile`: `USING (user_id = auth.uid())`.
  - Policy `update_own_profile`: `USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`; trigger blocks changes to `user_language_id`.
  - `INSERT` restricted to `service_role` (signup trigger context) via GRANTs, not policy.
- `app.user_learning_languages`:
  - Enable RLS.
  - Policy `manage_own_learning_languages`: `USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`.
- `app.categories`:
  - Enable RLS.
  - Policy `manage_own_categories`: `USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`.
- `app.words`:
  - Enable RLS.
  - Policy `manage_own_words`: `USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`.
- `app.vocabulary_overview` view:
  - Security barrier with policy `select_own_vocabulary`: `USING (user_id = auth.uid())`.
- Ensure `authenticated` role can execute RPCs/view while `anon` lacks access beyond signup requirements.

5. Additional notes

- Set database `search_path` for Supabase roles to `app, public` to prioritize the application schema.
- Enforce UTC by defaulting all timestamps with `now()`; consider `statement_timestamp()` for long-running tasks if needed.
- All tables owned by `service_role` to keep DDL privileges centralized; grant `SELECT/INSERT/UPDATE/DELETE` on mutable tables only to `authenticated`.
- Automated migrations should wrap schema changes in transactions and seed `app.languages`.
- Provide test reset scripts to truncate user-scoped tables under `service_role`, respecting cascade dependencies.
- Future analytics tables should live outside the RLS-protected schema to avoid policy conflicts.
