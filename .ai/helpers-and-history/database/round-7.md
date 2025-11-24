Questions:

1. Should we set each Supabase role’s search_path to include app, public so queries can omit schema qualifiers? Recommendation: Yes, update role configuration (or issue SET search_path in migrations) to default to the app schema where domain tables live.
2. Should the AFTER INSERT trigger on auth.users read user_language_id from raw_user_meta_data to populate app.profiles automatically? Recommendation: Yes, have the trigger parse the metadata (populated during signup) so profiles are created with the correct language without an extra API call.
3. Do we need the profile-creation trigger to be idempotent in case Supabase retries the insert webhook? Recommendation: Yes, make the trigger perform an upsert or guard with EXISTS to avoid duplicate-profile errors during retries.
4. Should we implement a shared trigger function that copies user_id from user_learning_languages into both categories and words on insert/update? Recommendation: Yes, reuse a single function to keep denormalized user references consistent and reduce duplicated logic.
5. Should categories.user_id, words.user_id, and words.user_learning_language_id be declared NOT NULL with foreign keys pointing to their respective parents? Recommendation: Yes, require these columns and constrain them to profiles/user_learning_languages so RLS checks have guaranteed values.
6. Should words.user_learning_language_id carry a direct FOREIGN KEY ... ON DELETE CASCADE to user_learning_languages(id) even though category_id already cascades? Recommendation: Yes, add the FK to reinforce data integrity and allow filtering words by learning language without joins.
7. Do we need an index on words(user_learning_language_id, created_at DESC) to support fetching words for slider mode ordered by recency within a language? Recommendation: Yes, create the composite index to keep per-language queries efficient.
8. Should the consolidated read view be created WITH (security_barrier=true) so RLS on base tables is always respected? Recommendation: Yes, set the view as a security barrier before attaching policies to prevent predicate pushdown from bypassing RLS.
9. Do we have to grant USAGE and SELECT/INSERT/UPDATE/DELETE privileges on the app schema objects to the Supabase authenticated and service_role roles explicitly? Recommendation: Yes, issue explicit GRANTs because new schemas default to no access, ensuring clients can reach the tables and view.
10. Should we expose a SECURITY INVOKER SQL function (RPC) that returns the consolidated view filtered by category_id to simplify client access while letting RLS enforce permissions? Recommendation: Yes, add a parameterized function that reads from the view so frontend calls stay simple and RLS continues to guard the result set.

Answers:

1. Yes.
2. Yes.
3. Yes.
4. Yes.
5. Yes.
6. Yes.
7. Not needed. The slider will work with all words in the category.
8. Yes.
9. Yes.
10. Yes.
