Questions:

1. Will we create an app-level profiles table in public that references auth.users(id) to store user_language_id and future profile fields? Recommendation: Yes, add profiles with user_id uuid primary key references auth.users(id) so Supabase auth stays intact while holding domain-specific data.
2. Which primary key type should user_learning_languages, categories, and words use—uuid or bigint? Recommendation: Use uuid with gen_random_uuid() defaults to align with Supabase conventions and simplify client-side handling.
3. Should we enforce at the database level that user_learning_languages.language_id cannot equal the user’s user_language_id? Recommendation: Yes, add a trigger or deferred constraint comparing against profiles.user_language_id to prevent contradictory entries.
4. Do we need to persist the AI difficulty selection (Easy/Medium/Advanced) on each word record? Recommendation: Yes, add a nullable difficulty text constrained to the three values so future filtering or analytics can differentiate study complexity.
5. Should categories and words include a position column to support custom ordering beyond created_at? Recommendation: Add optional position int columns (default null) to future-proof manual sorting while the MVP can ignore them.
6. Should all timestamp columns be defined as timestamptz instead of timestamp? Recommendation: Yes, use timestamptz with timezone('utc', now()) defaults to guarantee consistent ordering across time zones.
7. Do we want to prevent direct updates to created_at fields while allowing updated_at to change automatically? Recommendation: Yes, add BEFORE UPDATE triggers that raise an exception if created_at is modified and set updated_at = NOW() implicitly.
8. How should we structure database roles so the Supabase service key can bypass RLS for migrations and tests while the anon role remains restricted? Recommendation: Adopt the standard Supabase role model (anon/authenticated) but ensure service role has ALTER POLICY privileges and clients rely solely on RLS-guarded roles.
9. Would a materialized view or standard view that joins languages, categories, and words simplify client reads while honoring RLS? Recommendation: Create a standard view with explicit RLS policies to reduce repetitive joins in the API layer and keep access controlled.
10. For automated test environments, should we supply SQL fixtures to reset user-specific tables while keeping the static languages entries intact? Recommendation: Yes, provide a truncation-and-seed script that preserves languages but clears dependent tables for deterministic Cypress runs.

Answers:

1. The recommendation is suitable.
2. The recommendation is suitable.
3. Not needed.
4. The AI difficulty entity should not exist at the database level at all. It remains only at the UI level.
5. Not needed.
6. The recommendation is suitable.
7. Not needed. We do not plan to update the created_at field, and no separate logic for restricting it is required.
8. The recommendation is suitable.
9. Use a standard view.
10. Not needed.
