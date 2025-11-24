Questions:

1. Should the primary dashboard group learning languages by cards with inline stats fetched via GET /learning-languages to mirror the API structure? Recommendation: Yes, use card-based tiles that consume the paginated endpoint and surface category/word counts when includeStats is enabled to reinforce the API hierarchy.
2. Do we want the add-learning-language flow to live in a modal or dedicated route for easier reuse of POST /learning-languages validation errors? Recommendation: Use a modal with step-based validation tied directly to the endpoint’s responses so users remain on the dashboard while resolving errors.
3. Should category creation and renaming occur inline within the category list, or should we route to a dedicated detail page? Recommendation: Provide inline editable rows powered by POST /learning-languages/{id}/categories and PATCH /categories/{id} to keep context and minimize navigation hops.
4. How should the word form expose Markdown guidance so it aligns with the API requirement for Markdown-formatted examples? Recommendation: Include a collapsible helper panel plus live preview that mirrors the examplesMd payload to reduce invalid submissions.
5. Should AI generation share the same word form UI with a blocking overlay while POST /categories/{id}/words/ai-generate is in flight? Recommendation: Yes, reuse the form with a full-screen loader state so the AI response can overwrite fields per requirement without conflicting edits.
6. How do we persist the user’s choice between table and slider modes across navigation and API calls? Recommendation: Store the selected view in client state (e.g., URL query or global store) and pass matching parameters to GET /categories/{id}/words so the API and UI remain in sync.
7. What responsive layout strategy should we adopt to ensure tables and sliders remain usable on mobile breakpoints? Recommendation: Define Tailwind-responsive grid patterns and card-stacked fallbacks, using Shadcn/ui components that degrade gracefully under the smallest breakpoint.
8. Which accessibility patterns should govern confirmation dialogs and slider controls? Recommendation: Follow Shadcn/ui dialog semantics with focus traps and provide keyboard navigation plus ARIA labels on slider buttons, ensuring destructive actions remain predictable.
9. How should the UI handle authentication state transitions when consuming /auth/\* endpoints? Recommendation: Centralize session management via @supabase/auth-helpers-nextjs, gating protected routes in middleware and showing global toasts when tokens expire or logout occurs.
10. What strategy should we use for error handling and optimistic updates when API calls fail (e.g., 409 duplicates, 422 invalid AI response)? Recommendation: Use a shared error boundary with standardized toast/messages mapped to API error codes and apply optimistic UI updates only where rollbacks are trivial; otherwise rely on server responses before mutating state.

Answers:

1. Not needed. The entire main page is the working area with words; there’s a sidebar on the left containing a select box for choosing a language and, below it, a list of categories for the selected language. There’s also a common header and footer. The header must include a toggle for switching between “table/slider” word display modes.
2. The forms for adding languages, categories, and words should appear in a modal window with a shared template and step-based validation. The edit modals should use the same template, but instead of a “Create” button, they should have a “Save” button.
3. Next to each category name, there should be an icon button that opens the modal window for editing.
4. No tooltips or hints should be shown.
5. When the modal window for creating a “word” is open, it should include a “Generate with AI” button. Clicking it triggers AI-based word generation and automatically fills the form with the server’s response. While the request is processing, show an overlay.
6. Store the selected mode on the client. When switching to slider mode, append “/study” to the end of the URL. If the URL doesn’t contain “/study”, then the table mode is active. When the page reloads, the presence of “/study” in the URL determines which mode to load.
7. The recommendation applies.
8. The recommendation applies.
9. The recommendation applies.
10. Display a separate modal window showing detailed error information. The error should be output simply as a readable JSON.
