# View Implementation Plan Landing Page

## 1. Overview

The landing page introduces 10x Words Learning to unauthenticated users, highlighting core features (table vs slider modes, AI vocabulary generation) and providing entry points to the authentication modals. It offers a responsive marketing layout, surfaces supported languages, and routes successful authentication into the protected app experience.

## 2. View Routing

Accessible at the public path `/`. Authentication modals appear via the `?modal=login` and `?modal=register` query parameters managed by the same route segment.

## 3. Component Structure

- `LandingPage` (server component)
  - `PublicHeader` (client)
  - `HeroSection` (client)
    - `SupportedLanguageList`
  - `FeatureGrid`
    - `FeatureCard` ×3
  - `PrivacySection`
  - `PublicFooter`
  - `AuthModalSwitch` (client, conditional)
    - `LoginModal`
      - `LoginForm`
    - `RegisterModal`
      - `RegisterForm`

## 4. Component Details

### LandingPage

- Component description: Server component assembling the full landing layout, fetching any static data (e.g., languages list for SSR) and delegating interactivity to client subcomponents.
- Main elements: `<main>` with hero, features, privacy section; includes header and footer.
- Handled interactions: none directly; passes modal control callbacks to children.
- Handled validation: none.
- Types: `LanguagesListDto` (optional when passing languages to client components).
- Props: none (page-level component).

### PublicHeader

- Component description: Sticky top navigation with logo and authentication triggers.
- Main elements: `<header>`, logo link, CTA buttons using Shadcn `Button`.
- Handled interactions: `onOpenLogin`, `onOpenRegister` events triggered by buttons.
- Handled validation: none.
- Types: `AuthModalControls` (local type exposing functions).
- Props: `{ onOpenLogin: () => void; onOpenRegister: () => void }`.

### HeroSection

- Component description: Hero copy, imagery, primary CTA buttons, and supported language badges.
- Main elements: `<section>` with heading, subheading, CTA buttons, optional illustration, `SupportedLanguageList`.
- Handled interactions: `onOpenRegister`, `onOpenLogin`.
- Handled validation: none.
- Types: `SupportedLanguagesVm`.
- Props: `{ languages: SupportedLanguagesVm; onOpenRegister: () => void; onOpenLogin: () => void }`.

### SupportedLanguageList

- Component description: Presents human-readable names for supported languages drawn from API or fallback list.
- Main elements: `<ul>` of badges/chips.
- Handled interactions: none.
- Handled validation: ensures list is non-empty before render.
- Types: `SupportedLanguagesVm = { items: Array<{ code: LanguageDto["code"]; label: string }> }`.
- Props: `{ languages: SupportedLanguagesVm }`.

### FeatureGrid

- Component description: Grid showcasing three key product features using Shadcn cards.
- Main elements: `<section>` with grid layout, `FeatureCard`.
- Handled interactions: none.
- Handled validation: none.
- Types: `FeatureCardVm`.
- Props: `{ features: FeatureCardVm[] }`.

### FeatureCard

- Component description: Presentational card describing a single feature with icon, title, body.
- Main elements: Shadcn `Card`, icon slot, text content.
- Handled interactions: none.
- Handled validation: ensures title/body strings present.
- Types: `FeatureCardVm = { id: string; icon: ReactNode; title: string; description: string }`.
- Props: `FeatureCardVm`.

### PrivacySection

- Component description: Section reinforcing data privacy and Supabase security messaging.
- Main elements: `<section>` with heading, paragraphs, check-icon list.
- Handled interactions: none.
- Handled validation: none.
- Types: none (static content).
- Props: none.

### PublicFooter

- Component description: Footer with legal links and language referencing.
- Main elements: `<footer>` with navigation links.
- Handled interactions: none.
- Handled validation: none.
- Types: none.
- Props: none.

### AuthModalSwitch

- Component description: Reads the `modal` query param and conditionally renders `LoginModal` or `RegisterModal`. Handles closing by clearing the search param.
- Main elements: logical component returning Shadcn `Dialog`.
- Handled interactions: `handleClose`, `handleSwitch`.
- Handled validation: ensures only supported modal keys allowed.
- Types: `AuthModalKey = "login" | "register" | null`.
- Props: `{ modal: AuthModalKey; onClose: () => void; onSwitch: (next: AuthModalKey) => void }`.

### LoginModal

- Component description: Dialog shell for login flow, composing `LoginForm` and switching link to register.
- Main elements: Shadcn `Dialog`, `LoginForm`, footer link.
- Handled interactions: close, switch to register, submit events bubbled from `LoginForm`.
- Handled validation: none (delegated).
- Types: `LoginFormStatus`.
- Props: `{ onClose: () => void; onSwitch: () => void }`.

### LoginForm

- Component description: Form handling login inputs, validation, submission.
- Main elements: `<form>` with email and password fields (Shadcn `Input`), submit button, error alert.
- Handled interactions: `onSubmit`, field `onChange`, `onBlur`.
- Handled validation:
  - Email required and conforms to HTML email input validity.
  - Password required (non-empty).
- Types: `LoginFormValues`, `LoginCommand`, `AuthError`.
- Props: none (internal hook handles state). Could accept optional `defaultValues`.

### RegisterModal

- Component description: Dialog shell for registration; wraps `RegisterForm`.
- Main elements: Shadcn `Dialog`, `RegisterForm`, login switch link.
- Handled interactions: close, switch to login, submit.
- Handled validation: none (delegated).
- Types: `RegisterFormStatus`.
- Props: `{ onClose: () => void; onSwitch: () => void }`.

### RegisterForm

- Component description: Form for email, password, user language select; fetches languages on open.
- Main elements: `<form>` with email input, password input displaying min-length hint, Shadcn `Select`, submit button, inline errors.
- Handled interactions: `onSubmit`, input change, select change.
- Handled validation:
  - Email required and valid.
  - Password required, min length 5 (block submit until satisfied).
  - User language required (must match available options).
- Types: `RegisterFormValues`, `RegisterCommand`, `LanguagesListDto`, `AuthError`.
- Props: `{ languages: SupportedLanguagesVm | null }` (optional pre-fetched data).

## 5. Types

- `AuthModalKey = "login" | "register" | null`.
- `AuthModalControls = { onOpenLogin: () => void; onOpenRegister: () => void }`.
- `LoginFormValues = { email: string; password: string }`.
- `RegisterFormValues = { email: string; password: string; userLanguage: LanguageDto["code"] | "" }`.
- `AuthError = { code: string; message: string }`.
- `AuthFormStatus = "idle" | "submitting" | "success" | "error"`.
- `LoginFormStatus = { status: AuthFormStatus; error: AuthError | null }`.
- `RegisterFormStatus = { status: AuthFormStatus; error: AuthError | null }`.
- `SupportedLanguagesVm = { items: Array<{ code: LanguageDto["code"]; label: string }> }`.
- `FeatureCardVm = { id: string; icon: React.ReactNode; title: string; description: string }`.
- `AuthSessionStatusDto`, `LoginCommand`, `RegisterCommand`, `LanguagesListDto`, `LanguageDto`, `RegisterResponseDto`, `LoginResponseDto` imported from `@/lib/types`.

## 6. State Management

- `useModalState` (new hook): wraps `useSearchParams` and `useRouter` to read/set `modal` query parameter. Provides `modalKey`, `openLogin`, `openRegister`, `closeModal`, `switchModal`.
- `useAuthForm` (optional shared hook) managing form status, submit handler, and server error parsing for both login/register forms.
- `useLanguages(scope: "registration")`: fetch languages list; caches results; exposes loading/error states. Triggered on register modal mount. Uses `fetch("/api/languages?scope=registration")`.
- Form state managed via React Hook Form or controlled components. For this plan, assume React Hook Form to leverage validation rules.

## 7. API Integration

- `GET /api/auth/session`: On page load (server) optionally fetch session; if session exists, redirect to `/app`.
  - Response type: `AuthSessionStatusDto`.
- `POST /api/auth/login`: Called from `LoginForm` submit with `LoginCommand`. Expect `LoginResponseDto`. On success, call `router.replace("/app")` and refresh.
- `POST /api/auth/register`: Called from `RegisterForm` submit with `RegisterCommand`. Expect `RegisterResponseDto`. On success, route to `/app`.
- `GET /api/languages?scope=registration`: Fetched within `RegisterForm` to populate select. Response `LanguagesListDto`. Transform into `SupportedLanguagesVm`.
- All requests use `fetch` with `credentials: "include"` to retain Supabase cookies. Handle non-OK responses by parsing JSON `ErrorResponseDto`.

## 8. User Interactions

- Header/Register CTA click → open register modal via query param.
- Header/Login CTA click → open login modal.
- Hero CTA buttons mirror header interactions.
- Link inside modals toggles between login/register (`switchModal`).
- Form submit:
  - Validate client-side.
  - Display loader (disable form, show spinner).
  - On success: close modal, redirect to `/app`.
  - On failure: show `AuthError` message, keep values.
- Modal close (X button, overlay click, ESC) → clears query param.
- Register modal select change updates `userLanguage`.

## 9. Conditions and Validation

- Email inputs marked `type="email"` and require non-empty; use React Hook Form pattern to enforce format.
- Password min length 5 (per PRD + `registerCommandSchema`). Display inline helper and error message.
- `userLanguage` mandatory; options derived from API; disable submit until selected.
- Ensure modal query param only allows known keys; otherwise auto-close.
- Disable submit buttons while status `submitting`.
- For API-specific conditions:
  - Pass languages codes exactly as returned (lowercase names).
  - Use `await response.ok` check; if not, parse error message from `ErrorResponseDto`.

## 10. Error Handling

- Network/server errors: show generic banner “Something went wrong. Please try again.”
- Validation errors from API (`400`, `409`): display `error.message` within form (e.g., duplicate email).
- Invalid credentials (login) → show non-specific message per PRD to avoid leaking details.
- Language fetch failure: show fallback message and disable registration (or provide static list) until retry. Retry button optional.
- Modal state mismatch (unsupported key) → close modal automatically.

## 11. Implementation Steps

1. Create `LandingPage` route component at `app/(public)/page.tsx` (or existing structure), performing session check and rendering layout stubs.
2. Implement `useModalState` hook to manage modal query parameter.
3. Build `PublicHeader` with CTA buttons wired to modal state.
4. Implement `HeroSection` including CTA buttons and `SupportedLanguageList` placeholder data.
5. Create `FeatureGrid` and `FeatureCard` components with static content and responsive Tailwind grid.
6. Add `PrivacySection` and `PublicFooter` content blocks.
7. Implement `AuthModalSwitch` component to read modal state and render relevant modal.
8. Develop `LoginModal` and `LoginForm`: form fields, validation rules, `POST /api/auth/login` integration, error display, success redirect.
9. Develop `RegisterModal` and `RegisterForm`: fetch languages (`useLanguages`), validation, `POST /api/auth/register` integration, success redirect.
10. Wire modals into `LandingPage`, ensure route `?modal` toggling works from CTA buttons and internal links.
11. Style all sections with Tailwind 4 and Shadcn tokens; ensure responsive behavior at mobile/tablet/desktop breakpoints.
12. Manually test flows: open modals, validation errors, API errors, successful registration/login redirect to `/app`.
