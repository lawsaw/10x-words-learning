Questions:

1) Should the landing page highlight specific sections (hero, key features, CTA) that funnel users toward login/register? Recommendation: Yes, structure the landing page with a hero, three-feature overview, and a prominent CTA section above the footer to encourage authentication.
2) When a user signs in, should the header replace “Login/Register” with authenticated controls (e.g., profile menu, logout link)? Recommendation: Swap the buttons for a compact profile menu including logout to keep the header consistent and useful post-login.
3) How should we hydrate the language select—fetch once on load or re-query whenever the workspace mounts? Recommendation: Fetch the full language list during initial workspace hydration and cache it client-side since the options are static.
4) On language change, do we need loading indicators while categories and words refresh? Recommendation: Show a lightweight inline spinner in the sidebar and workspace while fetching fresh lists to communicate state without hints or tooltips.
5) What route structure should represent the workspace (e.g., /app/:languageId/:categoryId)? Recommendation: Use nested dynamic routes like /app/[languageId]/[categoryId] to keep URLs meaningful and simplify state derivation.
6) When toggling slider mode, should the URL become /app/[languageId]/[categoryId]/study and revert upon exiting? Recommendation: Yes, append /study for slider mode and remove it for table mode so URL parsing accurately restores the selected view on reload.
7) How should the shared modal template organize step-based validation for language/category/word forms? Recommendation: Divide the modal into clearly labeled steps with per-step validation feedback tied to the shared template to maintain consistency.
8) In slider mode, should the examples modal support next/previous navigation or focus on a single word’s details? Recommendation: Keep the modal scoped to the current word with a close action only, relying on the main slider controls for navigation.
9) Should the JSON error modal block background interaction until dismissed? Recommendation: Yes, treat it as a modal dialog with focus trap and explicit close button so users must acknowledge API errors before continuing.
10) When entries are added or removed, should row numbers reflow immediately to preserve strict sequential order? Recommendation: Recalculate row numbers client-side after each mutation so the table always reflects a continuous, gap-free sequence.

Answers: 

1) The recommendation is suitable.
2) If the user is not authenticated — show “Login” and “Register” buttons. If the user is authenticated — show a “Logout” button. Within the “Login” window, allow switching directly to the “Register” window and vice versa.
3) Load the full list each time. No need to cache anything.
4) The recommendation is suitable.
5) The recommendation is suitable.
6) The recommendation is suitable.
7) The recommendation is suitable.
8) Display only the details of a single word.
9) The recommendation is suitable.
10) Yes. Essentially, the row number is just the literal sequential index of the row. It doesn’t need to be stored anywhere separately — just add the current row index when rendering the list in a loop.

