<conversation_summary>
<decisions>
Use a public landing page with header containing login/register buttons; after authentication, show logout and route users into the workspace.
Workspace layout keeps a left sidebar (language select + category list sorted by newest) and main word area; header carries the table/slider mode toggle.
All CRUD actions (languages, categories, words) occur in shared-template modals; create modals show “Create”, edit modals show “Save” with inline delete for words.
Login and register each use single-step modal forms with switching links; no tooltips or hints anywhere.
Word creation modal embeds a “Generate with AI” button that overwrites fields immediately while an overlay with animated loader and text blocks the form visually.
View mode is stored client-side via routing: slider mode appends /study to the URL; absence of /study means table mode.
Word table shows sequential row numbers (no pagination), term, translation, expand icon for examples (accordion allowing only one open) and an edit icon column; slider mode shows examples in a modal using the same Markdown renderer.
Loading feedback uses a reusable animated overlay component that only visually covers regions (languages, categories, workspace/words) with text like “Loading words”.
JSON error details appear in a stackable modal that can open atop other modals, with full-page overlay, readable payload, and copy button.
Multiple modals may stack; lower modals remain visible with reduced emphasis, and escape closes the topmost dialog first.
</decisions>
<matched_recommendations>
Provide distinct landing layout with hero/CTA funneling into auth modals (accepted).
Swap header controls based on auth state, using modals for login/register and logout for authenticated users (accepted).
Maintain nested routes /app/[languageId]/[categoryId] and append /study for slider mode to restore context on reload (accepted).
Use shared modal template with consistent validation and action buttons across CRUD flows (accepted).
Reuse a centralized Markdown rendering component for both table accordion and slider examples modal (accepted).
Display component-scoped loading overlays with descriptive text and fade animation to cover asynchronous fetches (accepted).
Restrict accordion to one open row while rotating the expand icon and updating aria attributes (accepted).
Present empty states when no languages/categories/words exist, guiding users to creation modals (accepted).
Show slider-mode empty-category messaging with shortcuts to add a word or return to table view (accepted).
Surface API errors in a dedicated JSON modal with copy-to-clipboard control (accepted).
</matched_recommendations>
<ui_architecture_planning_summary>
Main UI architecture requirements: Public landing page with informational content and auth modals; authenticated workspace comprising header, sidebar, and main content. Header offers mode toggle and auth controls; sidebar holds language select and category list; main area houses table/slider views with shared modal workflows. No tooltips; all critical operations use modals.
Key views, screens, and flows:
Landing page (unauth): hero/feature sections, login/register modals.
Workspace dashboard (auth): /app/[languageId]/[categoryId] route with sidebar and table view by default.
Slider study mode: /app/[languageId]/[categoryId]/study with modal-triggered examples.
CRUD modals: add/edit language, category, word; AI generation integrated into word modal; delete action via edit modal.
Error handling flow: JSON modal stacking over current dialog.
Empty states: global message when no languages/categories/words exist; slider empty deck message with actions.
API integration & state management: Each language selection triggers fresh GET /learning-languages and dependent category/word fetches (no caching). Category list sorted by creation desc; words fetched per category and rendered in table or slider mode. Mode state derived from URL segment. Loading overlays applied per fetch region; sequential row numbering computed client-side. AI button calls POST /categories/{id}/words/ai-generate overwriting form fields immediately; error responses open JSON modal.
Responsiveness, accessibility, security: Tailwind/ Shadcn components provide responsive layout; sidebar collapses as drawer on smaller screens (previous agreement). Accordion icon rotation with proper aria attributes; modals trap focus individually and stack cleanly. Landing accessible to everyone; all /app/\* routes require auth. Overlays purely visual (pointer events passthrough) but with clear text labels.
Unresolved issues / clarifications needed: None identified; all raised items received concrete decisions.
</ui_architecture_planning_summary>
<unresolved_issues>
None.
</unresolved_issues>
</conversation_summary>
