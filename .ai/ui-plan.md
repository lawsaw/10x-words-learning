# UI Architecture for 10x Words Learning

## 1. UI Structure Overview

- Public landing funnels visitors into authentication, while the authenticated workspace combines a persistent header, collapsible sidebar, and context-aware main pane for vocabulary management.
- Routing relies on `/app` with segments for learning language, category, and optional `/study` suffix so table/slider mode persists across refreshes; CRUD modals overlay on top without leaving the current context.
- API alignment covers `GET /languages`, `/auth/*`, `GET/POST/DELETE /learning-languages`, `GET/POST/PATCH/DELETE /categories`, `GET/POST/PATCH/DELETE /words`, and `POST /categories/{id}/words/ai-generate`, all respecting Supabase RLS enforced server-side.
- Accessibility and security are embedded through focus-trapped modals, ARIA-labelled toggles, disabled controls at slider bounds, authenticated route guards, and avoidance of sensitive data in public views.
- Requirement coverage spans US-001 through US-016 via the coordinated set of views (auth modals, dashboards, CRUD modals, study mode, confirmation dialogs, error overlays) to satisfy MVP flows and testing needs.
- Pain points are mitigated with guided empty states, inline validation preventing duplicates, blocking loaders during async operations, confirmation dialogs to avoid accidental cascades, and stackable JSON error modals for troubleshooting without confusing users.

## 2. View List

### Landing Page

- View path: `/`
- Main purpose: Introduce the product and route unauthenticated users to login or registration modals.
- Key information to display: hero value proposition; feature highlights for table and slider modes; supported language list; privacy reassurance; prominent CTA buttons.
- Key view components: `PublicHeader` with auth triggers; `HeroSection`; `FeatureGrid`; `Footer` with legal links.
- UX, accessibility, and security considerations: keyboard ordering prioritizes auth triggers; high-contrast typography; responsive stacking down to mobile widths; no authenticated data rendered; optional analytics respect consent.
- Requirement coverage: `US-001`, `US-002`, `US-003` orientation.

### Register Modal

- View path: global overlay `?modal=register`
- Main purpose: Collect email, password, and immutable user language for new accounts.
- Key information to display: email field; password field with minimum length hint; user language select; loader state; link to login modal.
- Key view components: `AuthModalShell`; `TextInput`; `PasswordInput`; `LanguageSelect` hydrated via `GET /languages?scope=registration`; `SubmitButton` calling `POST /auth/register`.
- UX, accessibility, and security considerations: focus trap with ESC to close; inline validation for password length and required language; disable submit during request; never echo password; show server error summary mapped from response JSON.
- Requirement coverage: `US-001`.

### Login Modal

- View path: global overlay `?modal=login`
- Main purpose: Authenticate returning users with email and password.
- Key information to display: email and password fields; error messaging for invalid credentials; link back to register.
- Key view components: `AuthModalShell`; `TextInput`; `PasswordInput`; `SubmitButton` invoking `POST /auth/login`; optional `RememberSession` checkbox if supported.
- UX, accessibility, and security considerations: focus-trapped dialog; screen reader labels on fields; do not expose password reset; show generic authentication error; disable submit until fields populated; closes on success and routes to `/app`.
- Requirement coverage: `US-002`.

### Workspace Shell

- View path: `/app`
- Main purpose: Provide an authenticated layout with global header, language sidebar, and main workspace region.
- Key information to display: signed-in identity indicator; logout control; active learning language context; mode toggle visibility; loading states while data fetches.
- Key view components: `AuthGuard` using `GET /auth/session`; `AppHeader`; `Sidebar` (language + category panes); `MainContentArea`; `ResponsiveDrawerToggle` for small screens.
- UX, accessibility, and security considerations: protect route behind Supabase session; offer skip-to-content link; collapse sidebar into drawer under tablet width; ensure logout clears session; surface loader overlay during initial hydration.
- Requirement coverage: `US-003`, `US-011`, `US-015`.

### Learning Languages Dashboard

- View path: `/app` (default state with no language selected)
- Main purpose: Display user learning languages, enable creation, and support deletions with cascade awareness.
- Key information to display: language cards with display name, creation timestamp, category/word counts, delete action, and add-language CTA; empty state guidance when list is empty.
- Key view components: `LanguageList` backed by `GET /learning-languages`; `LanguageCard`; `AddLanguageButton` launching learning-language form; `EmptyStateIllustration`; `LanguageDeleteAction` opening confirmation dialog.
- UX, accessibility, and security considerations: cards keyboard navigable; empty state guides to CTA; deletion warns about cascade and requires confirmation; duplicate creation blocked with inline error from `POST /learning-languages` 409.
- Requirement coverage: `US-003`, `US-004`, `US-005`.

### Learning Language Form Modal

- View path: overlay `?modal=learning-language`
- Main purpose: Allow users to add a new learning language from static list excluding disallowed options.
- Key information to display: dropdown of eligible languages; helper text about immutability and uniqueness; submit/cancel controls.
- Key view components: `ModalShell`; `LanguageSelect` filtered client-side and validated server-side; `SubmitButton` calling `POST /learning-languages`; `ValidationMessage` slot.
- UX, accessibility, and security considerations: focus trap; disables languages already chosen or matching user language; handles 409 conflict by surfacing message; closes on success and optionally auto-navigates to the new language context.
- Requirement coverage: `US-004`.

### Language Workspace

- View path: `/app/[learningLanguageId]`
- Main purpose: Present the selected learning language context with category list management and summary information.
- Key information to display: active language name; categories sorted by newest; per-category word counts; controls for add, rename, delete; empty state messaging if none exist.
- Key view components: `SidebarHeader`; `CategoryListPanel` loaded via `GET /learning-languages/{id}/categories`; `CreateCategoryButton`; `CategoryContextMenu`; `CategoryEmptyState` guidance.
- UX, accessibility, and security considerations: keyboard navigation through categories; highlight active category; rename and delete actions restricted to owner; rename validates uniqueness via `PATCH /categories/{categoryId}`; loading overlay while fetching categories.
- Requirement coverage: `US-006`, `US-007`.

### Category Form Modal

- View path: overlay `?modal=category`
- Main purpose: Create or rename a category within the active learning language.
- Key information to display: category name input; character limit hint; mode indicator (create vs rename); validation feedback.
- Key view components: `ModalShell`; `TextInput`; `HelperText`; `SubmitButton` calling `POST /learning-languages/{learningLanguageId}/categories` or `PATCH /categories/{categoryId}`; optional delete shortcut for edit mode.
- UX, accessibility, and security considerations: focus-first input; trim whitespace before submission; surface duplicate-name 409 errors; confirm rename success with subtle toast; ESC and close buttons accessible.
- Requirement coverage: `US-006`.

### Category Word Table View

- View path: `/app/[learningLanguageId]/[categoryId]`
- Main purpose: Manage words in tabular mode with inline editing and deletion.
- Key information to display: numbered rows ordered by created date; term; translation; created/updated timestamps; accordion trigger for Markdown examples; edit/delete actions.
- Key view components: `ModeToggle` controlling `/study` suffix; `WordTable` populated via `GET /categories/{categoryId}/words?view=table`; `ExamplesAccordion`; `WordActionMenu`; `TableEmptyState`; `PaginationControls` omitted per MVP.
- UX, accessibility, and security considerations: default sort by newest; accordion supports single-open behavior with ARIA attributes; edit opens word form modal with prefilled data; delete triggers confirmation dialog; handles empty state gracefully; ensures keyboard access to actions.
- Requirement coverage: `US-008`, `US-009`, `US-011`, `US-012`.

### Category Slider Study View

- View path: `/app/[learningLanguageId]/[categoryId]/study`
- Main purpose: Offer flashcard-style sequential review with shuffle and navigation controls.
- Key information to display: current word term and translation; rendered Markdown examples; position indicator (e.g., 3 of 12); next/previous buttons; shuffle control.
- Key view components: `SliderDeck` hydrated via `GET /categories/{categoryId}/words?view=slider`; `CardNavigation` with disabled states at bounds; `ShuffleButton` triggering refetch with `orderBy=random`; `ExamplesModal` for focused reading.
- UX, accessibility, and security considerations: maintain focus on card after navigation; disable previous on first and next on last card; shuffle announces reordered deck; persists mode across reload using route; supports keyboard shortcuts; handles empty deck with guidance to add words.
- Requirement coverage: `US-011`, `US-013`.

### Word Form Modal (Create/Edit + AI)

- View path: overlay `?modal=word`
- Main purpose: Create or edit words manually or via AI-assisted generation.
- Key information to display: term input; translation input; Markdown textarea with guidance; difficulty selector (easy/medium/advanced); AI generate button; metadata for last updated when editing.
- Key view components: `ModalShell`; `TextInput` components; `MarkdownTextarea` with live preview toggle; `DifficultySelect`; `AiGenerateButton` calling `POST /categories/{categoryId}/words/ai-generate`; `LoaderOverlay`; `SaveButton` calling `POST /categories/{categoryId}/words` or `PATCH /words/{wordId}`; `InlineErrorList`.
- UX, accessibility, and security considerations: guard against empty fields before enabling save; AI button blocks form with loader overlay and handles invalid JSON by keeping existing form; difficulty defaults to medium; delete shortcut opens confirmation dialog; preview aids Markdown comprehension; ensures ESC/close available without losing unsaved changes warning.
- Requirement coverage: `US-008`, `US-009`, `US-010`.

### Delete Confirmation Dialog

- View path: overlay `?modal=confirm-delete`
- Main purpose: Confirm destructive actions for learning languages, categories, and words with contextual messaging.
- Key information to display: entity name and scope; cascade warning (languages/categories remove descendant data); primary destructive action and cancel button.
- Key view components: `ConfirmationDialog`; `PrimaryButton` invoking relevant `DELETE` endpoint; `SecondaryButton`; optional descriptive icon.
- UX, accessibility, and security considerations: focus defaulted to cancel for safety; ESC closes; screen readers announce consequence; disables background interaction; backs cascade warning with bullet text for clarity.
- Requirement coverage: `US-005`, `US-007`, `US-009`, `US-014`.

### JSON Error Modal

- View path: overlay `?modal=api-error`
- Main purpose: Surface structured API errors (especially AI failures) without interrupting background modals.
- Key information to display: endpoint; status code; parsed JSON payload; copy-to-clipboard control; dismiss instructions.
- Key view components: `JsonErrorModal`; `CodeBlock`; `ClipboardButton`; `DismissButton`.
- UX, accessibility, and security considerations: stackable above other modals with backdrop layering; focus trap; keyboard-accessible copy button; truncates sensitive fields; closes independently without losing form data.
- Requirement coverage: Supports PRD guidance on silent AI failure fallback while providing optional debugging for internal users.

## 3. User Journey Map

- Step 1: User lands on `/`, reviews hero messaging, and opens the register modal via primary CTA.
- Step 2: In the register modal, the user enters email, password (validated to minimum five characters), and selects a user language; submission calls `POST /auth/register`, displays loader, and routes to `/app` on success.
- Step 3: Workspace shell loads, `GET /learning-languages` returns empty, and the dashboard empty state guides the user to add a learning language by launching the learning-language form modal.
- Step 4: The user selects a language from the filtered list, submits, and the new language card appears; selecting the card navigates to `/app/[learningLanguageId]` where categories are fetched.
- Step 5: Category pane shows an empty state prompting creation; the user opens the category form modal, names a category, and upon success the list refreshes with the new entry highlighted.
- Step 6: Selecting the category loads the table view at `/app/[learningLanguageId]/[categoryId]`; the empty table state offers a button to create a word, opening the word form modal.
- Step 7: Inside the word form, the user taps Generate with AI (triggering loader overlay and call to `POST /categories/{categoryId}/words/ai-generate`); valid JSON overwrites the fields, and the user saves to create the word via `POST /categories/{categoryId}/words`.
- Step 8: The table updates instantly with the new word; the user can expand examples, edit via the same modal, or delete using the confirmation dialog which cascades appropriately.
- Step 9: The user switches to slider mode using the mode toggle, moving to `/study`, studies the deck with next/previous controls, and optionally shuffles which reorders words and resets the index.
- Step 10: If an AI request fails or data conflicts occur, the JSON error modal appears with structured feedback; the user dismisses it, adjusts inputs, and retries, maintaining progress without losing form data.

## 4. Layout and Navigation Structure

- Global header displays brand, mode toggle (when category selected), JSON error indicator, and auth actions (login/register or logout) with responsive collapse into menu on smaller screens.
- Sidebar persists in authenticated areas, showing language list at the top and contextual category list beneath; add buttons reside within respective sections and open modals without navigating away.
- Main content area swaps between dashboard cards, table view, and slider view based on route segments, while maintaining route-driven state for reload resilience.
- Modals and dialogs overlay the current view using shared `ModalShell`, retain underlying route for deep-linking, and support stacked presentation (e.g., word form plus JSON error modal).
- Navigation relies on Next.js routing: selecting a language updates pathname to `/app/[learningLanguageId]`, selecting a category appends `/[categoryId]`, and toggling study mode adds `/study`; browser history captures each transition for back/forward behavior.
- Mobile layout collapses sidebar into a drawer activated from header, while mode toggle and primary actions remain accessible in the main pane to prevent buried controls.

## 5. Key Components

- ModalShell Framework: Shared accessible container powering register/login, language and category forms, word form, confirmation dialog, and stackable JSON error overlays; enforces focus management, ESC handling, and background locking to satisfy `US-001`, `US-004`, `US-006`, `US-008`, and `US-014`.
- Language Management Suite: Combines `LanguageList`, `LanguageCard`, `AddLanguageButton`, and `LanguageEmptyState` to interact with `/learning-languages` endpoints, showing ownership counts, cascade warnings, and supporting keyboard navigation for `US-003` to `US-005`.
- Category Navigation Panel: Provides sortable `CategoryListPanel`, context menus, and inline rename triggers backed by `GET/POST/PATCH/DELETE` category endpoints, guarding uniqueness and cascade messaging per `US-006` and `US-007` while remaining operable via keyboard.
- Word Management Views: Includes `ModeToggle`, `WordTable`, `WordRowActions`, `ExamplesAccordion`, and `SliderDeck`, ensuring parity between table and slider modes, enforcing no-loop navigation, shuffle resets, and instant updates aligned with `US-008`, `US-009`, `US-011`, `US-012`, and `US-013`.
- Word Form & AI Pipeline: Encapsulates manual inputs, Markdown preview, difficulty select, AI generate button, loader overlay, and save/delete actions tied to word and AI endpoints to fulfill `US-008`, `US-009`, and `US-010`, with validation and failure handling built in.
- Feedback & Error Handling Layer: Comprises `LoadingOverlay`, `InlineValidation`, `Toast` (optional), and `JsonErrorModal` to communicate progress, conflicts, and AI/parser issues while respecting security (no sensitive data leaks) and supporting Cypress verification for `US-016`.
