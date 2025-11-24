Questions:

1. Should the landing page expose direct “Login” and “Register” buttons that open modal dialogs rather than separate routes? Recommendation: Yes, use header buttons that trigger shared auth modals so anonymous users stay on the landing page while switching between forms seamlessly.
2. Do we want the login and register modals to share the same multi-step template used elsewhere for consistency? Recommendation: Extend the shared modal template to authentication flows, ensuring step validation matches the registration requirements (email, password, language).
3. Should the language select trigger immediate workspace data refresh via API calls when the value changes? Recommendation: Yes, on selection change call GET /learning-languages and dependent endpoints to reload categories and words in real time without caching.
4. How should we handle latency when fetching the entire language/category/word lists for every selection? Recommendation: Display a full-content skeleton or overlay in the workspace to communicate loading while the fresh data arrives.
5. Do we need dedicated routes for login/register for deep linking, or are modals sufficient? Recommendation: Provide query-string toggles (e.g., ?auth=login) that open the corresponding modal, enabling sharable links while keeping the landing experience intact.
6. Should the sidebar highlight the active category while also exposing an edit icon per item? Recommendation: Use a two-column layout in each row—with the name and a trailing edit icon—ensuring the active category retains a distinct background and focus state.
7. When displaying the table of words, should rows become clickable or only the edit button triggers a modal? Recommendation: Keep rows non-clickable to avoid ambiguity, relying on the explicit edit button and accordion control for intentional interactions.
8. How do we ensure the slider-mode examples modal feels cohesive with the table accordion experience? Recommendation: Reuse the Markdown rendering component and modal styling from the shared template, limiting actions to close to maintain focus on the word details.
9. Should the JSON error modal always appear centered with scroll support for long payloads? Recommendation: Yes, center the modal with a scrollable code block, monospaced font, and copy button so even large error objects remain readable.
10. Do we need to surface a global toast confirming successful creations/updates since row numbering updates instantly? Recommendation: Yes, display brief success toasts on create/update/delete actions to reassure users that the sequential list reflects the latest state.

Answers:

1. The recommendation is suitable.
2. During registration, display a single-step modal containing all required fields: email, password, and user language. In the “Login” window, also use a single-step layout that includes only email and password fields.
3. The recommendation is suitable.
4. Show a semi-transparent overlay only over the area related to the component being loaded. For example, when loading learning languages, show the overlay in the section where the language list will appear. Do the same for categories. Since words belong to the workspace area, the overlay for words should cover the entire workspace.
5. Not needed.
6. The recommendation is suitable.
7. In the table, include a dedicated column with an icon button for editing a word via a modal window. The entire row should not be clickable.
8. Reuse the Markdown component to render the content itself. In table mode, these examples open in an accordion style, expanding the page height. In slider mode, the examples open in a modal window. Both modes use the same shared Markdown component, but the accordion and the modal have distinct styles.
9. The recommendation is suitable.
10. Not needed.
