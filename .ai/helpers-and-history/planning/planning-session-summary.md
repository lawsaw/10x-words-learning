<conversation_summary>
<decisions>
Target users are independent vocabulary learners working in English-language UI only.
Static languages list (English, German, Polish, Russian, Ukrainian) serves both registration (“user language”, immutable) and learning languages (add/delete, unique per user).
Categories are user-created per language; words belong to categories and can be entered manually or via AI using Easy/Medium/Advanced difficulty (default Medium, create-only).
AI provider is OpenRouter (DeepSeek); prompt includes selected language, user language, category, difficulty; response is JSON with word, translation, examples (Markdown, 3–4 items).
Word records store Markdown examples; form supports Markdown editing; AI result overwrites current form without warning; loader blocks UI during requests and disappears without error messaging even on failure/invalid JSON.
Table view shows words sorted by date added; slider view supports next/previous buttons, shuffles on demand (reset to start), loops only backward at end.
Deletions require confirmation dialogs using shared template with specific messages; cascades remove dependent entities; languages cannot be renamed.
Supabase with email/password auth (min 5 chars, no reset/verification); RLS enabled with separate authenticated and service roles; local/temporary DB used for Cypress E2E tests (registration, add language, add category, manual add word, slider flow).
Frontend uses Tailwind 4 with Shadcn/ui, responsive across desktop/tablet/mobile; no analytics, logging, quotas, or draft saving; helper copy remains inline where used.
</decisions>
<matched_recommendations>
Defined AI prompt structure and example payload to ensure consistent auto-fill behavior (Rec #1 in latest exchange).
Adopted Markdown support with formatting guidance for examples (Rec #2 earlier).
Established shared confirmation dialog pattern with standardized buttons/messages (Rec #6 earlier).
Planned local/ephemeral test database to run Cypress flows cleanly (Rec #6 in prior set).
Clarified shuffle-reset behavior for flashcards to keep navigation predictable (Rec #8 earlier).
Accepted design guideline alignment using Tailwind 4 and Shadcn/ui components for UI consistency (Rec #6 in previous round).
Confirmed Supabase RLS migration planning with role separation for authenticated vs. service operations (Rec #9 previously).
Prioritized Cypress coverage for core flows while omitting AI generation tests (Rec #8 earlier).
</matched_recommendations>
<prd_planning_summary>
The MVP will let solo language learners build personalized vocabulary sets per selected learning language. Users register with email/password, choose a fixed “user language”, and subsequently add unique learning languages from the static list. For each language they create manual categories and populate words either manually or via AI. The AI consumes the selected language, user language, category, and difficulty, returning JSON that auto-fills word, translation, and 3–4 Markdown-formatted examples. Users can freely edit or re-generate entries before saving. Word browsing includes a date-sorted table view and a slider with next/previous navigation, manual shuffling, and continuous backward looping.
Core operations—adding/editing/deleting languages, categories, and words—require confirmation dialogs and cascade appropriately. Supabase (with RLS and distinct roles) backs data storage; the UI is built with Tailwind 4 and Shadcn/ui, responsive across form factors. There is no analytics, logging, or rate limiting; uniqueness is case-sensitive per entity scope. Cypress tests cover registration, language/category creation, manual word entry, and slider navigation against a clean local testing database.
Key user journeys:
Registration, including user-language selection.
Adding a learning language, then managing its categories and words.
Generating a word via AI, reviewing Markdown examples, and saving.
Browsing vocabulary via table or slider modes, reshuffling cards as needed.
Deleting languages/categories/words with clear confirmations and understanding cascading impacts.
Success criteria remain aligned with the high-level goals: users must be able to view, create, edit, and delete their languages, categories, and words—and leverage AI-assisted word creation seamlessly. Without analytics, success will be evaluated qualitatively or through manual checks (e.g., verifying CRUD completeness and AI integration in Cypress/manual QA).
</prd_planning_summary>
<unresolved_issues>
None identified.
</unresolved_issues>
</conversation_summary>
