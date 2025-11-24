Questions:

1. Should we create an AFTER INSERT trigger on auth.users that inserts a profiles row and expects the frontend to supply user_language_id? Recommendation: Yes, enforce profile creation at signup so the domain tables always have the owning profile available.
2. How do we guarantee profiles.user_language_id stays immutable—should a trigger block updates once the row exists? Recommendation: Yes, add a BEFORE UPDATE trigger that raises an exception whenever user_language_id changes, matching the PRD constraint.
3. Do we want profiles(user_id) to cascade deletions into user_learning_languages, categories, and words? Recommendation: Yes, chain ON DELETE CASCADE through the foreign keys so orphaned data cannot remain when a user is removed.
4. Should user_learning_languages.user_id and language_id both be NOT NULL and reference profiles(user_id) and languages(id)? Recommendation: Yes, enforce referential integrity so every learning language ties to a valid profile and supported language.
5. Should the denormalized categories.user_id column carry its own foreign key to profiles(user_id) in addition to the trigger synchronization? Recommendation: Yes, add the constraint so mismatched assignments are rejected even if the trigger is bypassed.
6. Do we need dedicated btree indexes on categories.user_id and words.user_id to accelerate RLS-filtered queries? Recommendation: Yes, create non-unique indexes to keep user-scoped lookups fast as data grows.
7. Is a simple unique constraint on (user_learning_language_id, name) enough to enforce case-sensitive uniqueness for categories? Recommendation: Yes, rely on PostgreSQL’s case-sensitive text comparison without extra expression indexes.
8. Should we add a unique constraint on (category_id, value) to keep word values unique inside each category? Recommendation: Yes, implement the constraint so duplicates are rejected automatically while honoring case sensitivity.
9. Do we permit words.examples to remain NULL until users add content later? Recommendation: Yes, allow nulls to support incremental word entry without forcing placeholder text.
10. For the planned read-only view joining languages, categories, and words, should we declare it WITH (security_barrier) and attach a matching SELECT policy? Recommendation: Yes, ensure the view honors RLS by being security-barrier protected with policies checking auth.uid() against the underlying user_id.

Answers:

1. The recommendation is suitable.
2. Do nothing.
3. Yes.
4. The recommendation is suitable.
5. The recommendation is suitable.
6. The recommendation is suitable.
7. Yes, a simple constraint is sufficient.
8. The recommendation is suitable.
9. The recommendation is suitable.
10. The recommendation is suitable.
