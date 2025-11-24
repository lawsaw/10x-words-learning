Questions:

1. Should we extend the users table with a user_language column that is immutable after signup? Recommendation: Yes, add a user_language text column constrained to the static list and enforce immutability via database constraint or trigger to align with PRD requirements.
2. Do learning languages need a dedicated user_learning_languages table keyed by user_id and language_code to enforce uniqueness per user? Recommendation: Yes, create a composite primary key on (user_id, language_code) with a check excluding the user’s own language to prevent duplicates.
3. How should categories relate to learning languages—should we store a foreign key to the user-language pair? Recommendation: Model categories with a surrogate id, referencing user_learning_languages(id) and enforce case-sensitive uniqueness on (user_learning_language_id, name) using a unique index.
4. For words, should we include structured fields for term, definitions, translation, and examples_markdown plus timestamps? Recommendation: Yes, store term and translation as text, definitions as text or jsonb (if multiple definitions), examples_markdown as text, and add created_at/updated_at with default NOW().
5. Do we need to track AI-generated words separately to differentiate manual versus AI entries? Recommendation: Add a nullable source enum (e.g., manual, ai) and optional ai_payload jsonb for debugging invalid responses without exposing it in the UI.
6. Should we enable cascading deletes from learning languages to categories and words at the database level? Recommendation: Yes, define ON DELETE CASCADE on foreign keys from categories to learning languages and from words to categories to match UI behavior and prevent orphan records.
7. Which indexes are required to support dashboard queries and ordering in table/slider modes? Recommendation: Add btree indexes on categories.user_learning_language_id, words.category_id, and a compound index on words(category_id, created_at DESC) to maintain fast retrieval.
8. Are there any large tables that might warrant partitioning in the MVP phase? Recommendation: Not initially—volumes appear low; revisit partitioning if word counts approach performance limits.
9. What row-level security policies should govern access to languages, categories, and words? Recommendation: Enable RLS on all three tables with policies that restrict SELECT/INSERT/UPDATE/DELETE to rows where user_id matches the authenticated user, using Supabase session variables.
10. Do we require audit logging or soft deletes for destructive actions? Recommendation: For MVP, rely on hard deletes with cascading while keeping optional extension hooks (e.g., event triggers) documented for future audit needs.

Answers:

1. Yes, add such a column, but store the language ID from the list of available languages in it.
2. Yes, a separate table is needed.
3. For each learning language, a user can have any number of unique categories. Within a learning language, there is a unique set of categories. Within each category, there is a unique set of words.
4. A “word” should have three main fields: value, translation, and examples — all of type text. Additionally, there should be fields for creation and update timestamps.
5. Not needed. At the database level, there’s no difference in the origin of a “word.”
6. Yes.
7. The recommendation is suitable.
8. Do nothing.
9. The recommendation is suitable.
10. Use hard delete. No logging or documentation is required.
