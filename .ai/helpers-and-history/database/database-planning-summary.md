<conversation_summary>
<decisions>
Store each user’s immutable language preference as user_language_id referencing the static language list.
Maintain a canonical languages table seeded via migration, using text identifiers.
Create a profiles table (app.profiles) keyed to auth.users, populated by an AFTER INSERT trigger pulling user_language_id from signup metadata.
Use separate app.user_learning_languages with UUID primary keys, composite uniqueness on (user_id, language_id), denormalized user_id, timestamps, and cascade deletes.
Model app.categories linked to user_learning_languages, duplicating user_id, enforcing (user_learning_language_id, name) uniqueness with case sensitivity, and maintaining timestamps.
Model app.words with text value, translation, examples, timestamps, denormalized user_id and user_learning_language_id, and uniqueness on (category_id, value); track provenance/difficulty only in the UI.
Enable ON DELETE CASCADE through user → learning language → category → word, and allow hard deletes only.
Denormalize RLS-critical columns, create shared trigger functions to sync user_id fields, and apply WITH CHECK policies matching auth.uid().
Define an app schema (set in search_path), grant access to Supabase roles, ensure tables are owned by service_role, and enable pgcrypto for UUID generation.
Provide supporting infrastructure: UTC timestamptz defaults, transactional migrations, backfill for legacy users, reset scripts for tests, security-barrier view (app.vocabulary_overview), and RPC functions for secured data access.
</decisions>
<matched_recommendations>
Establish a seeded languages reference table with text identifiers and enforce FK use.
Create profiles tied to auth.users, populated via trigger using signup metadata.
Adopt UUID primary keys with gen_random_uuid() and enable pgcrypto.
Denormalize user_id onto categories and words with synchronization triggers for RLS.
Apply UTC timestamptz timestamps and maintain them via shared trigger logic.
Enable cascading deletes across user, learning language, category, and word tables.
Implement RLS policies using auth.uid() with complementary WITH CHECK clauses.
Place domain tables in a dedicated app schema, adjusting search_path, ownership, and grants.
Build a security-barrier view with RPC wrappers for controlled read access.
Provide transactional migrations and utility scripts (profile backfill, test resets) to keep environments consistent.
</matched_recommendations>
<database_planning_summary>
The MVP database will live in an app schema and center on languages, profiles, user_learning_languages, categories, and words, all using UUID PKs and UTC timestamps. Users select a language from the seeded languages table during signup; an AFTER INSERT trigger on auth.users validates this choice, creates a profile, and aborts if metadata is missing or invalid. user_learning_languages records represent each user’s study languages, enforcing one entry per language via uniqueness and cascaded deletion when a profile is removed. categories belong to a specific learning language, keep user references in sync via shared triggers, and enforce case-sensitive uniqueness within that scope. words capture value, translation, and optional examples, enforce uniqueness within categories, and duplicate both category and learning-language ownership for RLS efficiency; AI-specific metadata remains outside the database.
Row-level security applies to every mutable table, relying on matching user_id to auth.uid() in both USING and WITH CHECK clauses. Static data (languages) exposes read access without RLS. Supabase roles (service_role, authenticated, anon) receive explicit schema/table grants; objects are owned by service_role. pgcrypto is enabled for UUID generation, migrations run transactionally, and supporting scripts handle profile backfills and test resets. A security-barrier view (e.g., app.vocabulary_overview) aggregates user-scoped vocabulary data, with parameterized RPC functions providing controlled access for the frontend. The design favors hard deletes, cascading cleanup, no server-side AI metadata or manual ordering, and delegates certain validations (e.g., non-empty names, immutability of learning language selection) to the UI.
</database_planning_summary>
<unresolved_issues>
None.
</unresolved_issues>
</conversation_summary>
