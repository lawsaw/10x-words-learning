# Delete Learning Language Feature

## Overview
Added functionality to delete learning languages, including all associated categories and words.

## Implementation Date
November 18, 2025

## Changes Made

### 1. UI Components (`app/(app)/app/workspace-client.tsx`)

#### Added Icon Imports
- Imported `MoreHorizontal` icon from `lucide-react` for the menu trigger button (matching word actions menu)
- Imported `FolderPlus` icon for "Add category" action
- Imported `Trash2` icon for "Delete language" action

#### Added DropdownMenu Components
- Imported `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`, `DropdownMenuTrigger` from `@/components/ui/dropdown-menu`

#### New State Management
- `deleteLanguageOpen`: Controls delete confirmation dialog visibility
- `deleteLanguageBusy`: Tracks deletion in progress
- `languageToDelete`: Stores the language being deleted (id and name)
- `deleteLanguageError`: Stores error messages from deletion attempts

#### New Functions
- `closeDeleteLanguageDialog()`: Resets delete dialog state
- `handleOpenDeleteDialog(languageId, languageName)`: Opens delete confirmation dialog
- `handleDeleteLanguage()`: Executes DELETE API call to remove learning language

#### UI Updates to LanguageList Component
- Replaced individual action buttons with a dropdown menu
- Added "..." (MoreHorizontal icon) trigger button next to each learning language label (matching word actions menu)
- Button uses default size from Button component for consistency
- Dropdown menu contains:
  - "Add category" menu item with FolderPlus icon
  - Separator line
  - "Delete language" menu item with Trash2 icon (in red/destructive color)
- Icons are sized at `h-3.5 w-3.5` (matching word actions menu)
- Menu items have `gap-2` for icon-text spacing
- Menu trigger has proper test-id: `language-menu-{code}`
- Both menu items have proper test-ids
- Accessible with aria-labels and aria-hidden on icons

#### New DeleteLearningLanguageDialog Component
- Confirmation dialog with destructive styling
- Shows language name in confirmation message
- Warns user about cascade deletion of categories and words
- Cancel and Confirm buttons
- Error message display
- Loading state during deletion

### 2. E2E Test Support (`e2e/page-objects/components/AddLearningLanguageDialog.ts`)

#### Updated AddLearningLanguageDialog Class
- Added `getLanguageMenuTrigger(languageCode)` - locate menu trigger button
- Added `getDeleteLanguageMenuItem(languageCode)` - locate delete menu item
- Added `getAddCategoryMenuItem(languageCode)` - locate add category menu item
- Added `openLanguageMenu(languageCode)` - open dropdown menu
- Added `deleteLanguageViaMenu(languageCode)` - complete delete flow via menu
- Added `addCategoryViaMenu(languageCode)` - complete add category flow via menu

#### New DeleteLearningLanguageDialog Class
Complete page object for delete confirmation dialog:
- Dialog locators (dialog, title, buttons, error)
- `isVisible()`: Check dialog visibility
- `waitForOpen()`: Wait for dialog to appear
- `waitForClose()`: Wait for dialog to close
- `clickConfirm()`: Click delete confirmation button
- `clickCancel()`: Click cancel button
- `deleteLanguage()`: Complete delete flow
- `hasError()`: Check for error messages
- `getErrorMessage()`: Get error text

### 3. API Endpoint (Already Existed)
- `DELETE /api/learning-languages/{learningLanguageId}` endpoint was already implemented
- Located at: `app/api/learning-languages/[learningLanguageId]/route.ts`
- Uses `LearningLanguageService.deleteLearningLanguage()`

### 4. Database Schema (Already Configured)
Cascade deletion is properly configured in the database:
- `app.categories` references `user_learning_languages(id)` with `ON DELETE CASCADE`
- `app.words` references both:
  - `user_learning_languages(id)` with `ON DELETE CASCADE`
  - `categories(id)` with `ON DELETE CASCADE`

When a learning language is deleted:
1. All categories belonging to that language are automatically deleted
2. All words in those categories are automatically deleted
3. Database handles cascade deletion atomically

## User Flow

1. User sees a "..." (three dots) menu button next to each learning language
2. Clicks the menu button to open dropdown
3. Dropdown menu shows two options:
   - "Add category"
   - "Delete language" (in red/destructive color)
4. User clicks "Delete language"
5. Confirmation dialog appears with:
   - Language name highlighted
   - Warning about deleting all categories and words
   - Cancel and Delete buttons
6. User clicks "Delete language" in dialog
7. API call is made to delete the language
8. On success:
   - Dialog closes
   - Success feedback message appears
   - Page refreshes to show updated list
9. On error:
   - Error message displays in dialog
   - User can retry or cancel

## Test IDs for E2E Testing

- Menu trigger button: `language-menu-{languageCode}` (e.g., `language-menu-german`)
- Add category menu item: `add-category-{languageCode}` (e.g., `add-category-german`)
- Delete menu item: `delete-language-{languageCode}` (e.g., `delete-language-german`)
- Delete dialog: `delete-learning-language-dialog`
- Confirm button: `dialog-confirm-delete`
- Cancel button: `dialog-cancel`

## Security & Authorization

- API endpoint requires authentication (via `AuthService.getCurrentUserId()`)
- Row-Level Security (RLS) ensures users can only delete their own learning languages
- Ownership verified by matching `user_id` in delete query

## Design Decisions

1. **Dropdown Menu**: Consolidated actions into a single "..." menu to reduce UI clutter and follow common UX patterns
2. **Consistent Styling**: Matches the word actions menu styling for visual consistency across the app
3. **Icons with Text**: Menu items include icons alongside text for better visual recognition and accessibility
4. **Icon Sizing**: Uses `h-3.5 w-3.5` to match word actions menu
5. **Destructive Styling**: "Delete language" menu item in red to indicate danger
6. **Menu Separator**: Visual separator between "Add category" and "Delete language" to group actions by severity
7. **Confirmation Dialog**: Required to prevent accidental deletions
8. **Cascade Warning**: Explicitly warns user about data loss in confirmation dialog
9. **Feedback Messages**: Success message after deletion completes
10. **Page Refresh**: Automatically refreshes to show updated state

## Accessibility

- Menu trigger button has proper `aria-label` for screen readers ("Actions for {language name}")
- Dropdown menu follows ARIA best practices (from Radix UI)
- Dialog follows ARIA best practices (from Radix UI)
- Keyboard navigation supported:
  - Tab to navigate to menu button
  - Enter/Space to open menu
  - Arrow keys to navigate menu items
  - Enter to select menu item
  - Escape to close menu or dialog
- Focus management handled automatically by Radix UI components

## Visual Layout

### Before (Language List Item)
```
┌─────────────────────────────────────────────┐
│  Learning Language Name (code)          ⋯   │
│  X categories available                     │
│                                             │
│  [Category 1]  [Category 2]                │
└─────────────────────────────────────────────┘
```

### Dropdown Menu Open
```
┌─────────────────────────────────────────────┐
│  Learning Language Name (code)          ⋯   │
│  X categories available            ┌────────┴────────┐
│                                    │ 📁 Add category  │
│  [Category 1]  [Category 2]       ├─────────────────┤
└────────────────────────────────────│ 🗑️  Delete language │ (red)
                                     └─────────────────┘
```

### Delete Confirmation Dialog
```
┌──────────────────────────────────────────┐
│  Delete learning language                 │
│                                           │
│  Are you sure you want to delete          │
│  **German**? This will permanently        │
│  remove all categories and words          │
│  associated with this language.           │
│                                           │
│            [Cancel]  [Delete language]    │
└──────────────────────────────────────────┘
```

## Files Modified

1. `app/(app)/app/workspace-client.tsx` - Main UI component
2. `components/ui/dropdown-menu.tsx` - New dropdown menu component (added)
3. `e2e/page-objects/components/AddLearningLanguageDialog.ts` - E2E test support
4. `.ai/helpers-and-history/features/delete-learning-language.md` - Documentation

## Future Enhancements (Optional)

- Add "undo" functionality with temporary soft delete
- Show count of categories/words that will be deleted
- Add bulk delete for multiple languages
- Export language data before deletion

