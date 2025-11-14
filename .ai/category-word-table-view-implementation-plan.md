# View Implementation Plan Category Word Table View

## 1. Overview
- Deliver the table-mode experience for managing vocabulary inside a specific learning language category.
- Enable learners to review, create, edit, delete, and AI-generate words while staying within the category context.
- Provide responsive layout, Markdown example visibility, and access to shared modals and dialogs mandated by the PRD.

## 2. View Routing
- Primary route: `/app/[learningLanguageId]/[categoryId]` rendered via Next.js app router.
- Slider sibling route: `/app/[learningLanguageId]/[categoryId]/study`; the Mode Toggle should navigate between these paths while preserving params.
- Guard the page behind the authenticated workspace shell (`/app`) to ensure Supabase session enforcement.

## 3. Component Structure
- `CategoryWordTablePage` (server component)
  - `CategoryWordTableClient` (client component)
    - `ModeToggle`
    - `WordToolbar`
      - `CreateWordButton`
      - `OrderControls`
    - `WordTable`
      - `WordTableRow` (repeated)
        - `ExamplesAccordion`
        - `WordActionMenu`
    - `TableEmptyState` (conditional)
    - `PaginationHint` (optional placeholder for future pagination)
  - Portals / overlays
    - `WordFormModal`
    - `ConfirmDeleteDialog`
    - `AiLoaderOverlay`

## 4. Component Details

### CategoryWordTablePage
- Component description: Server entry that resolves route params, preloads metadata (category name, active language), and renders the client component inside the authenticated layout.
- Main elements: `AppShellLayout`, header breadcrumb, suspense boundary wrapping `CategoryWordTableClient`.
- Handled interactions: none (server component).
- Handled validation: ensure `learningLanguageId` and `categoryId` params exist; redirect or notFound on missing data fetched via server actions.
- Types: uses `CategoryDto`, `CategoriesListDto`, `CategoryWordsListDto` (initial fetch), `WordViewMode`.
- Props: passes `{ categoryId, learningLanguageId, initialWords, categoryName, userLanguage }` to client.

### CategoryWordTableClient
- Component description: Client coordinator handling state, fetching, and interactions for the table view.
- Main elements: wraps `ModeToggle`, `WordToolbar`, conditional `WordTable` or `TableEmptyState`, modals via portals.
- Handled interactions: data refresh, open/close modals, mode toggle navigation, sort/order adjustments.
- Handled validation: ensures query params stay within allowed values before issuing API calls.
- Types: `CategoryWordsListDto`, `WordListMetaDto`, `WordViewMode`, `WordTableViewModel`.
- Props: `{ categoryId: string, learningLanguageId: string, categoryName: string, userLanguage: string, initialWords: CategoryWordsListDto }`.

### ModeToggle
- Component description: Segmented control switching between table and slider modes.
- Main elements: Shadcn ToggleGroup or Tabs with two options (`table`, `slider`).
- Handled interactions: `onValueChange` triggers Next.js router push to `/study` or base route.
- Handled validation: guards against redundant navigation by checking current mode.
- Types: accepts `WordViewMode`.
- Props: `{ value: WordViewMode, onChange: (mode: WordViewMode) => void }`.

### WordToolbar
- Component description: Top-level actions for the table (create word, sorting/display controls, category metadata).
- Main elements: Primary button (`CreateWordButton`), optional text for category name + word count, dropdown/order controls.
- Handled interactions: Open create modal, change ordering, trigger data refetch.
- Handled validation: disable create button when modal already open; restrict order fields to `createdAt` or `term` (table view requirement).
- Types: uses `WordOrderField`, `SortDirection`.
- Props: `{ onCreate: () => void, orderBy: WordOrderField, direction: SortDirection, onOrderChange: (orderBy: WordOrderField) => void, onDirectionToggle: () => void, wordCount: number }`.

### CreateWordButton
- Component description: Shadcn button launching the word form modal in create mode.
- Main elements: Button with icon.
- Handled interactions: click -> `onClick` callback.
- Handled validation: disabled state while modal open or while AI loader active.
- Types: none beyond standard.
- Props: `{ onClick: () => void, disabled?: boolean }`.

### OrderControls
- Component description: Dropdown + toggle for order field/direction.
- Main elements: Select for `createdAt` vs `term`, icon button for asc/desc.
- Handled interactions: change select, click direction toggle -> triggers data refetch.
- Handled validation: lock direction control when orderBy is `random` (not available in table mode) by disabling.
- Types: `WordOrderField`, `SortDirection`.
- Props: `{ orderBy: WordOrderField, direction: SortDirection, onOrderChange: (value: WordOrderField) => void, onDirectionToggle: () => void }`.

### WordTable
- Component description: Responsive table displaying words with actions per row.
- Main elements: Shadcn `Table`, header row (Term, Translation, Examples, Created/Updated, Actions), body mapping rows.
- Handled interactions: row-level events forwarded via callbacks (edit, delete, expand examples).
- Handled validation: ensures `rows` array exists; shows placeholder row if loading.
- Types: `WordTableViewModel`, `WordTableRowVm`.
- Props: `{ rows: WordTableRowVm[], onEdit: (wordId: string) => void, onDelete: (context: DeleteWordContext) => void }`.

### WordTableRow
- Component description: Represents a single word entry with accordion for examples and action menu.
- Main elements: Table cells, formatted timestamps, `ExamplesAccordion`, `WordActionMenu`.
- Handled interactions: toggle accordion, select edit/delete from menu.
- Handled validation: ensures Markdown string is not empty before rendering accordion; hide accordion trigger if missing.
- Types: `WordTableRowVm`, `DeleteWordContext`.
- Props: `{ row: WordTableRowVm, onEdit: (id: string) => void, onDelete: (context: DeleteWordContext) => void }`.

### ExamplesAccordion
- Component description: Collapsible region rendering Markdown examples.
- Main elements: Accordion trigger, panel with Markdown renderer (e.g., remark/rehype pipeline).
- Handled interactions: open/close accordion.
- Handled validation: sanitize Markdown if renderer lacks built-in sanitation; fallback text when Markdown invalid.
- Types: accepts `examplesMd: string`.
- Props: `{ markdown: string }`.

### WordActionMenu
- Component description: Dropdown menu with edit and delete actions per word.
- Main elements: Shadcn `DropdownMenu`, items for Edit, Delete (delete styled destructive).
- Handled interactions: click edit -> callback, click delete -> open confirm dialog with context.
- Handled validation: disable actions if word mutation in progress.
- Types: uses `DeleteWordContext`.
- Props: `{ onEdit: () => void, onDelete: () => void, busy?: boolean }`.

### TableEmptyState
- Component description: Empty state when no words exist.
- Main elements: Illustration or icon, explanatory copy, CTA button to add first word.
- Handled interactions: CTA -> open create modal.
- Handled validation: none beyond hiding when data present.
- Types: none.
- Props: `{ onCreate: () => void }`.

### PaginationHint
- Component description: Simple footer indicating auto-pagination or `meta.hasMore`; optionally a “Load more” button when cursor-based pagination later.
- Main elements: Text or button.
- Handled interactions: optional future load more (currently display only).
- Handled validation: show only when `meta.hasMore` true.
- Types: uses `WordListMetaDto`.
- Props: `{ meta: WordListMetaDto }`.

### WordFormModal
- Component description: Modal for create/edit word, embedding form and AI controls.
- Main elements: Dialog shell, fields for term/translation/examples, `DifficultySelect`, `AiGenerateButton`, save/cancel actions.
- Handled interactions: input change, submit, close, invoke AI, prefill when editing.
- Handled validation: required `term`, `translation`, `examplesMd`; trim whitespace; block save until valid; enforce 3+ lines for examples if required by UX (optional). On submit, call correct mutation (POST vs PATCH).
- Types: `WordFormState`, `CreateWordCommand`, `UpdateWordCommand`, `DifficultyLevel`, `GeneratedWordSuggestionDto`.
- Props: `{ open: boolean, mode: "create" | "edit", initialValue?: WordFormState, onClose: () => void, onSubmit: (payload: CreateWordCommand | UpdateWordCommand, wordId?: string) => Promise<void>, onAiGenerate: (difficulty: DifficultyLevel) => Promise<GeneratedWordSuggestionDto | null>, busy: boolean, aiBusy: boolean }`.

### AiGenerateButton
- Component description: Button within form that triggers AI generation and displays loader overlay during request.
- Main elements: Button, spinner overlay when `aiBusy` true.
- Handled interactions: click -> calls `onGenerate` with current form state (difficulty, category context, languages).
- Handled validation: ensure difficulty selected (default `medium`) before enabling; disable when mandatory fields missing (if requirement) or when `aiBusy`.
- Types: uses `DifficultyLevel`, `AiGeneratedWordsDto` (response processing).
- Props: `{ difficulty: DifficultyLevel, onGenerate: () => void, disabled?: boolean, busy: boolean }`.

### ConfirmDeleteDialog
- Component description: Shared dialog confirming destructive actions for words.
- Main elements: Dialog heading/body, cancel and destructive confirm button.
- Handled interactions: confirm -> triggers DELETE API call, cancel -> closes dialog.
- Handled validation: ensures word identifier exists before allowing confirm; disable confirm while API call pending.
- Types: `DeleteWordContext`.
- Props: `{ open: boolean, context: DeleteWordContext | null, onConfirm: (context: DeleteWordContext) => Promise<void>, onCancel: () => void, busy: boolean }`.

### AiLoaderOverlay (within modal)
- Component description: Full-screen (modal-scoped) overlay blocking interactions during AI request per PRD.
- Main elements: semi-transparent backdrop, spinner, message.
- Handled interactions: none (blocks input).
- Handled validation: display only when `aiBusy` true.
- Types: none; leverages `aiBusy` boolean.
- Props: `{ visible: boolean }`.

## 5. Types
- Reuse DTOs from `lib/types.ts`:
  - `CategoryWordsListDto`, `WordDto`, `WordListMetaDto`, `WordViewMode`, `WordOrderField`, `SortDirection`, `CreateWordCommand`, `UpdateWordCommand`, `DifficultyLevel`, `GeneratedWordSuggestionDto`, `AiGeneratedWordsDto`.
- New view models:
  - `WordTableRowVm`:
    - `id: string`
    - `term: string`
    - `translation: string`
    - `examplesMd: string`
    - `createdAt: string`
    - `updatedAt: string`
    - `createdAtLabel: string` (preformatted)
    - `updatedAtLabel: string`
  - `WordTableViewModel`:
    - `rows: WordTableRowVm[]`
    - `meta: WordListMetaDto`
    - `count: number`
    - `isEmpty: boolean`
  - `WordFormState`:
    - `wordId?: string`
    - `term: string`
    - `translation: string`
    - `examplesMd: string`
    - `difficulty: DifficultyLevel`
  - `DeleteWordContext`:
    - `wordId: string`
    - `term: string`
  - `AiGenerationRequest`:
    - `difficulty: DifficultyLevel`
    - `learningLanguageId: string`
    - `userLanguage: string`
    - `categoryContext?: string`
    - `temperature?: number`
    - `count?: number`

## 6. State Management
- Introduce `useCategoryWords` custom hook built on SWR or React Query to fetch `/api/categories/${categoryId}/words` with `view=table`, `orderBy`, `direction` query params; returns data, loading, error, `mutate`/`refetch`.
- Maintain component state via `useState`:
  - `orderBy`, `direction` (default `createdAt`, `desc`).
  - `isWordModalOpen`, `modalMode` (`create` | `edit`).
  - `formState` managed inside `WordFormModal` leveraging `useReducer` or controlled inputs.
  - `aiBusy`, `aiError` managed in modal/hook.
  - `deleteDialogContext` storing selected word.
- Provide `useWordMutations` hook encapsulating POST, PATCH, DELETE requests and invalidating `useCategoryWords` cache on success.
- Provide `useAiWordGeneration` hook for calling AI endpoint, handling loader toggling and response parsing before returning `GeneratedWordSuggestionDto`.

## 7. API Integration
- Fetch words: `GET /api/categories/${categoryId}/words?view=table&orderBy=${orderBy}&direction=${direction}` expecting `CategoryWordsListDto` response.
- Create word: `POST /api/categories/${categoryId}/words` with `CreateWordCommand` body; response `WordDto`.
- Update word: `PATCH /api/words/${wordId}` with `UpdateWordCommand`; response `WordDto`.
- Delete word: `DELETE /api/words/${wordId}`; expect `204 No Content`.
- AI generate: `POST /api/categories/${categoryId}/words/ai-generate` with `AiGenerationRequest`; response `AiGeneratedWordsDto`.
- Optional `GET /api/words/${wordId}` when entering edit mode if full detail required; response `WordDetailDto`.
- All authenticated calls should leverage fetch abstraction that injects Supabase session token.
- Handle response errors by reading standard error shape `{ error: { code, message } }`.

## 8. User Interactions
- Mode toggle changes route and triggers data fetch for target view.
- Create button opens modal; submit adds word and closes modal with toast feedback.
- Row edit opens modal prefilled with selected word data; submit sends PATCH.
- Row delete opens confirmation; confirm executes DELETE and refreshes table.
- Expand examples reveals Markdown-rendered sentences; collapse hides them.
- AI generate button locks form with overlay, performs request, then overwrites form fields on success.
- Order controls adjust server query and re-fetch data.
- Empty state CTA opens create modal.

## 9. Conditions and Validation
- Ensure required fields (`term`, `translation`, `examplesMd`) are non-empty (trimmed) before enabling Save.
- Difficulty defaults to `medium`; block AI generate if unset (should never be unset).
- Restrict `orderBy` to `createdAt` or `term` in table mode; `direction` limited to `asc`/`desc`.
- Confirm delete requires `DeleteWordContext` before enabling confirm button.
- Prevent duplicate submissions by disabling buttons while mutations pending.
- Markdown field should maintain guidance text; optionally validate minimum length or bullet count (align with UX guidance).

## 10. Error Handling
- Display toast or inline alert when fetch/mutation fails, using message from backend error payload.
- For initial fetch errors, render fallback state with retry button.
- On AI failure or invalid JSON, close loader overlay and leave form untouched; optionally show non-blocking toast per PRD (silent failure allowed but internal debugging may use console/logging).
- Handle 409 conflicts (duplicate term) by surfacing validation message near term field.
- Handle 401 by redirecting to login via global error boundary.
- Ensure Markdown renderer handles malformed input by showing fallback text rather than breaking layout.

## 11. Implementation Steps
1. Scaffold `CategoryWordTablePage` under `app/(app)/[learningLanguageId]/[categoryId]/page.tsx`, ensuring server-side param validation and authenticated layout.
2. Implement `CategoryWordTableClient` as a client component that consumes initial data and wires hooks.
3. Create `useCategoryWords`, `useWordMutations`, and `useAiWordGeneration` hooks for data fetching and mutations with proper typing.
4. Build `ModeToggle` linked to router navigation between table and slider routes.
5. Implement `WordToolbar` with create button and order controls; connect to hook state updates.
6. Implement `WordTable`, `WordTableRow`, `ExamplesAccordion`, and `WordActionMenu`, ensuring responsive layout via Tailwind classes.
7. Add `TableEmptyState` and `PaginationHint` to handle empty and hasMore scenarios.
8. Build `WordFormModal` with controlled inputs, validation logic, AI button integration, and loader overlay per PRD.
9. Wire modal and delete dialog interactions within client component, ensuring mutations refresh the word list and show toasts.
10. Add error states and skeleton loaders for initial fetch and mutation states.
11. Conduct responsive QA across breakpoints and verify alignment with PRD and user stories.
12. Write unit/integration tests for hooks and critical components (e.g., order control, modal validation) as time permits.
