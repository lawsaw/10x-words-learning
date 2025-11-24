Questions:

1. Do we want to disable background scrolling whenever any modal is open to keep focus on the active form? Recommendation: Yes, lock body scroll and trap focus for all modal dialogs (auth, CRUD, error) to maintain accessibility and prevent accidental background interaction.
2. Should login/register modals validate inputs on blur or only on submit? Recommendation: Validate on submit with inline error messages under each field to keep the single-step forms uncluttered yet informative.
3. When fetching learning languages, should the sidebar overlay also display a textual loading cue? Recommendation: Pair the semi-transparent overlay with a centered “Loading languages…” label so users understand why the list is temporarily unavailable.
4. For categories, do we need to indicate which items are currently loading when the overlay appears? Recommendation: Apply the semi-transparent overlay over the entire category list with a shared loader message to avoid partial states while data refreshes.
5. Should the workspace overlay for words include a neutral background pattern to signal that table/slider content is unavailable? Recommendation: Use a uniform overlay with subtle animation and “Loading words…” text, keeping the underlying layout visible yet clearly blocked.
6. How should we handle focus after the workspace overlay disappears? Recommendation: Automatically focus the first interactive element in the refreshed view (e.g., the table’s first row accordion button) to support keyboard users.
7. Do we need separate success toasts for language/category/word operations, or can a shared message suffice? Recommendation: Use a shared toast component that prefixes the entity type (e.g., “Word saved successfully”) to keep feedback consistent and contextual.
8. Should the accordion’s expand/collapse icons rotate to indicate state changes? Recommendation: Yes, rotate the down-arrow when expanded to reinforce the interaction without relying on tooltips or text hints.
9. When the slider’s example modal opens, should we dim the underlying card to emphasize the modal content? Recommendation: Apply a backdrop blur/dim effect so the modal becomes the primary focus while still hinting at the underlying word card.
10. For the JSON error modal, should we provide a button to copy the payload to the clipboard? Recommendation: Include a secondary “Copy JSON” button so users can quickly share error details with support or during debugging.

Answers:

1. The recommendation is suitable.
2. The recommendation is suitable.
3. The recommendation is suitable.
4. Display an overlay above categories with the text “Loading categories”. Do the same for learning languages (“Loading languages”) and words (“Loading words”).
5. The overlay should be a separate reusable component. It should accept text as a prop, for example “Loading languages”.
6. Do nothing.
7. Do nothing.
8. The recommendation is suitable.
9. Do nothing.
10. The recommendation is suitable.
