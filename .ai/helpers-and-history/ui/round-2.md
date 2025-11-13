Questions:

1) Should the common header also surface global actions like logout and profile access alongside the mode toggle? Recommendation: Reserve space in the header for auth controls (e.g., profile menu, logout) so users can manage sessions without leaving the workspace.
2) How should the language select in the sidebar indicate the active learning language when the list is long? Recommendation: Use a searchable select or combobox tied to GET /learning-languages, highlighting the active language and updating categories on selection.
3) Do we want categories in the sidebar sorted alphabetically, by recency, or manually? Recommendation: Default to alphabetical sorting with optional future filtering to keep navigation predictable, especially when the list grows.
4) When no categories exist for a language, what should the main workspace display? Recommendation: Show an inline empty state with a call-to-action button that opens the shared category creation modal to keep users focused on the flow.
5) Which word attributes (e.g., term, translation, createdAt) must appear in the table mode by default? Recommendation: Display term, translation, created date, and action buttons in the table so users can quickly scan and edit entries.
6) How should slider mode present Markdown examples—collapsed or expanded by default? Recommendation: Expand Markdown-rendered examples by default in slider mode to support immersive study, with scrollable content if necessary.
7) Should the AI generation overlay include progress messaging or simply block interactions? Recommendation: Display a concise “Generating…” status within the overlay to reassure users while requests hit POST /categories/{id}/words/ai-generate.
8) Do we need dedicated UI controls to reveal the JSON error modal triggered by failed API calls? Recommendation: Auto-open the JSON error modal whenever an API response includes an error payload, with a close button and copy-to-clipboard option.
9) How should the router handle deep linking when users land on /study without a selected word? Recommendation: Redirect to the first available word in slider mode or show a friendly message if the category is empty, ensuring the URL contract remains intact.
10) What breakpoint strategy should govern the sidebar’s behavior on small screens? Recommendation: Convert the sidebar into a collapsible drawer on tablets and mobile, preserving language/category controls while maximizing space for the word workspace.

Answers: 

1) Yes, the common header should also include “Login” and “Register” buttons. The main page should function as a landing page, providing information about the essence of the project. The landing page must be accessible to all users, while all other pages require authentication.
2) The learning language selector should be a select box containing all available languages. When a user selects a language, the selector should update its displayed value accordingly.
3) Sort by creation date, showing the most recently added items at the top.
4) Display an informative message indicating that there are no learning languages, categories, or words yet.
5) Display the following columns:
- Row number
- Term
- Translation
- If examples exist: a down-arrow button that expands a section with examples using an accordion-style animation
- An edit button that opens a modal window for editing; inside this modal, there should also be an option to delete the word.
6) In slider mode, display a button that opens a modal window with examples.
7) Show any animated loader along with a text message.
8) The recommendation is suitable.
9) The recommendation is suitable.
10) The recommendation is suitable.