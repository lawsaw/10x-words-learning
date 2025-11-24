Questions:

1. What external AI service will power word generation, and do we need environment-based configuration for API keys and pricing controls? Recommendation: Confirm the provider and expected usage to budget costs and set up secure configuration management before development.
2. Should we impose limits on the number of languages, categories, or words a user can create to keep Supabase tables performant? Recommendation: Define sensible caps or pagination plans so the schema and UI remain responsive at scale.
3. Do we need to prevent duplicate word entries within the same category/language, or is duplication acceptable? Recommendation: Clarify validation rules now to avoid rewriting creation logic and user messaging later.
4. How should we handle AI request timeouts—retry automatically, or surface a specific error message prompting manual entry? Recommendation: Establish timeout thresholds and user feedback copy to keep the experience predictable when the AI is slow or unavailable.
5. What security measures (e.g., Supabase RLS policies, client-side validation) are required to ensure users only access their own languages/categories/words? Recommendation: Document access-control requirements early so the database schema and API routes enforce correct ownership boundaries.
6. Do we plan to log AI usage events or errors server-side (even without analytics) for debugging and monitoring? Recommendation: Implement lightweight server logs or error tracking to support maintenance without adding full analytics.
7. Are there compliance or content-safety expectations for AI-generated examples (e.g., profanity filtering)? Recommendation: Decide whether to include moderation checks or user warnings to mitigate inappropriate outputs.
8. Should the loader overlay on AI requests include cancel/abort options, or is the user expected to wait until completion? Recommendation: Define the interaction pattern to avoid users feeling locked out of the app when generation takes longer than expected.
9. How will we test the cascade deletions to ensure data integrity—unit tests only, or do we need end-to-end scenarios as well? Recommendation: Outline a testing approach covering Supabase triggers and UI confirmations so regressions are caught early.
10. Do we need to support draft-saving if users start filling the word form but leave without submitting? Recommendation: Decide whether to persist partially completed forms or warn users before navigating away to prevent accidental data loss.

Answers:

1. We will use the provider https://openrouter.ai, and as an example, select the DeepSeek model.
2. There are no limits on the number of languages, categories, or words. However, a user cannot create more languages than those available in the static list. A user also cannot add a language that already exists in their list. It’s important to distinguish between two types of languages:
   - Learning language – the language under which categories and words are created. It is added through the “Add language” form from the available language list. It can be deleted but not renamed.
   - User language – the language selected during registration and used by the AI to generate the “translation” field. It cannot be deleted or changed.
3. A user can only have one instance of each language from the list (e.g., cannot have two “English” entries). Thus, each language is unique. Categories must be unique within their language, but can have the same name in other languages. Words must be unique within their category, but the same word can exist in other categories or languages.
4. While the AI request promise is being processed, a semi-transparent loader is shown. The promise may resolve successfully or fail; in both cases, the loader is removed afterward. There’s no need to display errors separately.
5. Enable Supabase RLS.
6. Not needed.
7. Not needed.
8. No cancel button is required during AI loading.
9. All tests should be done using Cypress.
10. No draft saving is required if the user leaves the form before submission.
