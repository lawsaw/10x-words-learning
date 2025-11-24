# Product Requirements Document (PRD) - 10x Words Learning

## 1. Product Overview

10x Words Learning is a web-based vocabulary management tool for independent language learners who operate in an English-language interface but need to master terminology across multiple target languages. The application combines manual curation and AI-assisted generation of vocabulary to help users assemble thematic word lists, review translations, and practice via table or slider modes. Supabase provides persistence with row-level security, while the frontend uses Tailwind 4 and Shadcn/ui to deliver a responsive experience across desktop, tablet, and mobile form factors. The MVP emphasizes streamlined CRUD flows, predictable learning navigation, and seamless AI-powered word suggestions without ancillary analytics or administrative tooling.

## 2. User Problem

- Learners who rely on self-study lack a structured workspace to organize vocabulary by language and subject, leading to fragmented and inefficient study sessions.
- Generating high-quality example sentences and translations requires extra effort, slowing down the acquisition of new terminology.
- Switching between list-based review and flashcard-style practice typically requires multiple tools, increasing friction and reducing consistency.
- Learners want assurance that their personally curated data remains private, accessible only to them, and available across devices without reinstalling apps.

## 3. Functional Requirements

### 3.1 Authentication and User Management

- Provide email and password registration with a minimum five-character password requirement.
- Require every registrant to choose a single user language from the static list {English, German, Polish, Russian, Ukrainian} during signup; the selection becomes immutable after account creation.
- Offer a login form for existing accounts without password reset or email verification flows.
- Persist authenticated sessions to enable seamless navigation between vocabulary features until explicit logout.

### 3.2 Learning Language Management

- Present an overview of learning languages per user, including empty states when none exist.
- Allow users to add learning languages by selecting from the static list, excluding their user language and any languages already added.
- Enforce uniqueness of learning languages per user; attempts to add duplicates must surface a blocking validation message.
- Prevent renaming of learning languages; management actions are limited to add and delete.

### 3.3 Category Management

- Within each learning language, enable users to create categories with editable names describing subject matter.
- Enforce case-sensitive uniqueness of category names within the same learning language.
- Support renaming and deleting categories while updating associated words accordingly.
- Cascade deletions so that removing a category also removes all words linked to it after user confirmation.

### 3.4 Word Management

- Allow users to create and edit words within a category, capturing the word in the learning language, the user’s translation, and Markdown-formatted usage examples.
- Display and edit Markdown content with guidance inline so users can format multi-line examples or emphasis as needed.
- Maintain word-level timestamps to support chronological sorting in views.
- Provide deletion controls for individual words that trigger confirmation flows before data is removed.

### 3.5 AI-Assisted Word Generation

- Integrate with OpenRouter (DeepSeek) to request AI-generated vocabulary using the selected learning language, the user language, category, and difficulty (Easy, Medium default, Advanced).
- Require the AI response to return JSON containing word, translation, and three to four Markdown-formatted example sentences.
- When an AI request is active, block user interaction with a full-screen loader until the response completes.
- Overwrite the in-progress word form with the AI response without additional prompts when successful.
- If the API call fails or returns invalid JSON, remove the loader and leave the form untouched; no error messaging is displayed in this MVP.

### 3.6 Browsing and Learning Modes

- Provide a table view of words within a category, sorted by date added, with inline actions for editing or deleting entries.
- Offer a slider mode that presents one word at a time with next and previous controls for sequential study.
- Include a shuffle action in slider mode that randomizes the word order and resets the session to the first card.
- At the end of the slider sequence, prevent forward looping. At the first slide prevent backward looping.
- Maintain responsive layouts for both modes across desktop, tablet, and mobile breakpoints.

### 3.7 Data Management and Security

- Store all data in Supabase with row-level security that ensures users can only access their own languages, categories, and words.
- Separate authenticated and service roles, reserving elevated privileges for non-interactive operations such as migrations or testing utilities.
- Apply cascading deletes at the database level to reinforce UI-driven cascades and prevent orphan records.
- Logically separate production data from ephemeral databases used during automated testing.

### 3.8 Testing and Quality

- Provide a reproducible local or temporary Supabase database configuration dedicated to Cypress end-to-end tests.
- Cover the following flows in automated tests: registration, adding a learning language, creating a category, manually adding a word, and navigating the slider mode including shuffling.
- Exclude AI generation from automated test coverage to avoid dependency on external services during CI runs.

## 4. Product Boundaries

### 4.1 In Scope

- Email/password authentication without recovery or verification flows.
- CRUD operations for learning languages (add, delete), categories (create, rename, delete), and words (create, edit, delete).
- AI-assisted generation that replaces the current word form when invoked.
- Table and slider modes for browsing category vocabulary, including shuffle functionality.
- Confirmation dialogs for deletions that leverage a standardized template across entity types.
- Supabase-backed data storage with row-level security and role separation.
- Cypress end-to-end coverage of primary CRUD and study flows using an isolated database.

### 4.2 Out of Scope

- Word learning progress tracking or spaced-repetition algorithms.
- Administrative dashboards for managing other users.
- Error tracking, analytics, rate limiting, or quota enforcement.
- Mobile-native applications; only a responsive web experience is delivered.
- Password reset, multi-factor authentication, or email verification workflows.
- AI prompt customization beyond the predefined parameters of language, user language, category, and difficulty selection.

### 4.3 Assumptions and Dependencies

- The static language list (English, German, Polish, Russian, Ukrainian) remains sufficient for both registration and learning language selection during the MVP.
- OpenRouter (DeepSeek) maintains availability and returns structured JSON that fits the expected schema.
- Users accept that AI failures silently revert to manual control without explicit messaging.
- Tailwind 4 and Shadcn/ui components are available and compatible with the responsive layouts described.
- Supabase row-level security policies are correctly configured before launch to prevent cross-user data exposure.

## 5. User Stories

### US-001 Registration with Fixed User Language

ID: US-001
Title: Registration with Fixed User Language
Description: As a new learner, I want to register with my email, password, and a fixed user language so that the system tailors AI prompts and translations to my native context.
Acceptance Criteria:

- When the email and password (minimum five characters) are valid and a user language is selected from the static list, the account is created and the user is signed in.
- The chosen user language is stored on the profile and cannot be changed after registration.
- If the password is shorter than five characters or the user language is not selected, the form blocks submission with a clear validation message.

### US-002 Login to Existing Account

ID: US-002
Title: Login to Existing Account
Description: As a returning learner, I want to log in with my email and password so that I can continue managing my vocabulary.
Acceptance Criteria:

- Providing valid credentials signs the user in and routes them to their learning languages dashboard.
- Invalid credentials keep the user on the login page and display an authentication error without exposing system details.
- No password reset or email verification options appear on the login screen.

### US-003 View Learning Languages Dashboard

ID: US-003
Title: View Learning Languages Dashboard
Description: As a signed-in learner, I want to see all learning languages I have added so I can decide which vocabulary set to manage.
Acceptance Criteria:

- The dashboard lists each learning language created by the user with controls to add or delete languages.
- When no learning languages exist, an empty state explains how to add the first language.
- The list updates immediately after language additions or deletions without requiring a full page refresh.

### US-004 Add Learning Language from Static List

ID: US-004
Title: Add Learning Language from Static List
Description: As a learner, I want to add a learning language from the supported catalog so that I can organize vocabulary for that language.
Acceptance Criteria:

- The add language flow displays only languages from the static list excluding the user language and any languages already added by the user.
- Selecting a language and confirming adds it to the dashboard and creates an empty container for categories.
- Attempting to add a duplicate language blocks the action and shows a validation alert.

### US-005 Remove Learning Language with Cascade

ID: US-005
Title: Remove Learning Language with Cascade
Description: As a learner, I want to delete a learning language I no longer study so that my workspace stays focused.
Acceptance Criteria:

- Choosing to delete a learning language opens the shared confirmation dialog with language-specific messaging.
- Confirming deletion removes the learning language along with all associated categories and words from both the UI and database.
- Canceling the confirmation dialog leaves the learning language and related data unchanged.

### US-006 Manage Categories per Learning Language

ID: US-006
Title: Manage Categories per Learning Language
Description: As a learner, I want to create and rename categories within a learning language so that I can group vocabulary by topic.
Acceptance Criteria:

- Users can add a new category name for the selected learning language and see it appear instantly in the category list.
- Editing a category name updates the label everywhere it appears, including in word forms and tables.
- Creating or renaming a category to a name already used within the same learning language surfaces a validation error and prevents duplication.

### US-007 Remove Category with Cascade

ID: US-007
Title: Remove Category with Cascade
Description: As a learner, I want to delete a category I no longer need so the associated words are also cleaned up.
Acceptance Criteria:

- Deleting a category triggers the standard confirmation dialog with category-specific text.
- Confirming deletion removes the category and all child words from both the UI and database.
- Canceling the dialog preserves the category and its words.

### US-008 Manage Word Details Manually

ID: US-008
Title: Manage Word Details Manually
Description: As a learner, I want to manually add and edit words within a category so that the vocabulary reflects my needs.
Acceptance Criteria:

- The word form captures the word in the learning language, the user’s translation, and Markdown-formatted example sentences.
- Saving the form with all required fields persists the word and displays it in both table and slider views.
- Editing an existing word updates the stored values and reflects the changes immediately in all views.

### US-009 Delete Word with Confirmation

ID: US-009
Title: Delete Word with Confirmation
Description: As a learner, I want to remove a word I added by mistake so that my lists stay relevant.
Acceptance Criteria:

- Selecting delete on a word opens the shared confirmation dialog referencing the word to be removed.
- Confirming deletion removes the word from the database and all UI views.
- Canceling the dialog keeps the word intact.

### US-010 Generate Word via AI

ID: US-010
Title: Generate Word via AI
Description: As a learner, I want to auto-populate a word entry using AI so that I can quickly add curated vocabulary.
Acceptance Criteria:

- The AI generation control requires the user to select difficulty (defaulting to Medium) before sending the request.
- While the request is in flight, a blocking loader appears and prevents other form interactions.
- On success, the word, translation, and three to four Markdown examples returned by AI overwrite the current form values.
- On failure or invalid JSON, the loader disappears, the form stays unchanged, and no success message is shown.

### US-011 Switch Between Table and Slider Views

ID: US-011
Title: Switch Between Table and Slider Views
Description: As a learner, I want to toggle between tabular and flashcard-style views so that I can choose how to review words.
Acceptance Criteria:

- A control within each category lets the user switch between table mode and slider mode without leaving the page.
- The application preserves the selected category and currently highlighted word when switching views.
- The chosen view persists during the session until the user selects a different mode.

### US-012 Browse Words in Table View

ID: US-012
Title: Browse Words in Table View
Description: As a learner, I want to review and manage words in a sortable table so I can quickly edit or delete entries.
Acceptance Criteria:

- The table lists all words within the category sorted by date added (most recent first).
- Each row exposes actions to edit or delete the corresponding word.
- The table layout remains usable on desktop, tablet, and mobile screen widths.

### US-013 Learn Words in Slider View

ID: US-013
Title: Learn Words in Slider View
Description: As a learner, I want to study words one at a time with navigation controls so I can focus on each example.
Acceptance Criteria:

- Next and previous controls move through the current deck one card at a time.
- When on the first card, the Previous button is disabled (no backward looping). When on the last card, the Next button is disabled (no forward navigation).
- Activating shuffle randomizes the order of all cards and resets the slider to the first card in the new sequence.

### US-014 Standardized Confirmation Dialogs

ID: US-014
Title: Standardized Confirmation Dialogs
Description: As a learner, I want consistent confirmation dialogs so that destructive actions feel predictable.
Acceptance Criteria:

- All delete actions (language, category, word) invoke the same dialog component with contextual copy and primary/secondary button labels.
- The dialog blocks background interactions until the user confirms or cancels.
- Keyboard and pointer interactions behave consistently across entity types.

### US-015 Enforce Data Isolation and Row-Level Security

ID: US-015
Title: Enforce Data Isolation and Row-Level Security
Description: As a security-conscious platform owner, I want to prevent data leakage between users so each learner’s vocabulary remains private.
Acceptance Criteria:

- Authenticated queries only return languages, categories, and words tied to the requesting user’s identifier.
- Attempts to access another user’s data via API calls or direct URL manipulation are rejected with authorization errors.
- Service role credentials are never exposed to the client application and are confined to backend processes.

### US-016 Run Cypress End-to-End Tests Against Ephemeral Database

ID: US-016
Title: Run Cypress End-to-End Tests Against Ephemeral Database
Description: As a QA engineer, I want automated tests to run against an isolated database so that test data does not pollute production.
Acceptance Criteria:

- The project includes configuration scripts that provision and tear down a local or temporary Supabase database for Cypress runs.
- Cypress executes the flows for registration, adding a learning language, adding a category, adding a manual word, and navigating the slider without relying on AI responses.
- Test runs complete without requiring manual cleanup of production datasets.

## 6. Success Metrics

- 100 percent of pilot users can register, add a learning language, create a category, and add a word without assistance during usability testing.
- Automated Cypress suites covering registration, language/category creation, manual word entry, and slider navigation pass on every CI run.
- At least 90 percent of AI generation requests return valid JSON responses that fully populate the word form during MVP evaluation.
- Zero confirmed incidents of cross-user data exposure in production or staging environments.
- Mobile, tablet, and desktop breakpoints maintain layout integrity with fewer than five UI defects reported during QA.
