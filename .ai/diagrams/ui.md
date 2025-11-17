<architecture_analysis>
1. Komponenty z dokumentacji:
   - Layouty i strony: `app/layout.tsx`, `app/(public)/page.tsx`, `app/(app)/layout.tsx`, `components/app/app-shell-layout.tsx`.
   - Publiczne komponenty React: `LandingPageClient`, `HeroSection`, `FeatureGrid`, `PrivacySection`.
   - Moduły autoryzacji UI: `AuthModalSwitch`, `RegisterModal`, `LoginModal`, `useModalState`.
   - Kontrolki workspace: `LogoutButton`, dashboard języków, widoki kategorii i słów (tabela, slider), formularz słowa, generator AI, zunifikowane `ConfirmationDialog`.
   - Warstwa API: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/session`, `/api/languages`.
   - Warstwa usług: `AuthService`, `lib/validation.ts`, `lib/errors.ts`, `lib/supabase/server`, `middleware.ts`.
   - Zewnętrzne zależności: Supabase Auth, lista statycznych języków, OpenRouter (dla generatora słów zgodnie z PRD).
2. Główne strony i odpowiadające komponenty:
   - Landing (`app/(public)/page.tsx`) → ładuje dane i przekazuje je do `LandingPageClient`, który składa sekcje marketingowe oraz steruje `AuthModalSwitch`.
   - Workspace (`app/(app)/layout.tsx`) → pilnuje sesji, wykorzystuje `AppShellLayout` (nagłówek, `LogoutButton`, slot na dashboard języków, zarządzanie kategoriami i trybami nauki).
3. Przepływ danych:
   - Żądanie landing pobiera status sesji (`/api/auth/session`) i listę języków → dane trafiają do `LandingPageClient`.
   - `AuthModalSwitch` wykorzystuje `useModalState` do przełączania `RegisterModal`/`LoginModal`.
   - Formularze wykonują walidację lokalną, następnie wywołują odpowiednie endpointy `/api/auth/*`, które delegują do `AuthService`.
   - `AuthService` używa `lib/validation`, mapuje błędy i komunikuje się z Supabase; middleware synchronizuje cookies, dzięki czemu `app/(app)/layout.tsx` może odczytać sesję.
   - Po autoryzacji `AppShellLayout` udostępnia dane komponentom zarządzającym językami, kategoriami i trybami nauki (tabela, slider, generator AI) opisanymi w PRD.
4. Opisy funkcjonalności:
   - `app/(public)/page.tsx`: serwerowa strona publiczna, przekierowuje zalogowanych do `/app`.
   - `LandingPageClient`: klient sterujący sekcjami marketingowymi i otwieraniem modali.
   - `AuthModalSwitch` + `useModalState`: zarządzanie stanem widoczności formularzy logowania/rejestracji.
   - `RegisterModal`/`LoginModal`: formularze z walidacją i komunikacją z API; rejestracja wymusza wybór języka użytkownika (PRD 3.1).
   - `/api/auth/*` + `AuthService`: obsługa logiki Supabase (signUp/signIn/signOut), tworzenie profilu z niezmiennym językiem, mapowanie błędów.
   - `middleware.ts`: synchronizacja cookies Supabase dla SSR i API.
   - `app/(app)/layout.tsx` + `AppShellLayout`: ochrona tras, wspólny UI workspace, wstrzyknięcie `LogoutButton`.
   - Dashboard języków, zarządzanie kategoriami, CRUD słów, tryby tabela/slider, generator AI oraz dialogi potwierdzeń: funkcjonalności opisane w PRD, korzystające z uwierzytelnionej sesji.
</architecture_analysis>

<mermaid_diagram>
```mermaid
flowchart TD
  classDef updated fill:#fef3c7,stroke:#b45309,stroke-width:2px;
  classDef api fill:#e0f2fe,stroke:#0369a1,stroke-width:1px;
  classDef state fill:#ede9fe,stroke:#5b21b6,stroke-width:1px;

  U((Użytkownik))

  subgraph PublicznyLanding["Segment publiczny / landing"]
    LandingServer["app/(public)/page.tsx\n(serwer)"]
    LandingClient["LandingPageClient\n(klient)"]:::updated
    Hero["HeroSection"]
    Feature["FeatureGrid"]
    Privacy["PrivacySection"]
  end

  subgraph ModalyAuth["Moduł modali autoryzacji"]
    AuthSwitch["AuthModalSwitch"]:::updated
    ModalState["useModalState\n(zarządzanie stanem)"]:::state
    Register["RegisterModal\n(email+hasło+język)"]:::updated
    Login["LoginModal"]:::updated
  end

  subgraph APIAuth["API autoryzacji (Next.js)"]
    RegisterAPI["POST /api/auth/register"]:::api
    LoginAPI["POST /api/auth/login"]:::api
    LogoutAPI["POST /api/auth/logout"]:::api
    SessionAPI["GET /api/auth/session"]:::api
  end

  subgraph Usługi["Usługi i middleware"]
    AuthService["AuthService\n(Supabase)"]:::updated
    Validation["lib/validation.ts"]
    Errors["lib/errors.ts"]
    Supabase["Supabase Auth\n(createClient)"]
    Middleware["middleware.ts /\nlib/supabase/middleware"]:::updated
  end

  subgraph Workspace["Segment aplikacji / workspace"]
    AppLayout["app/(app)/layout.tsx"]:::updated
    Shell["AppShellLayout\n+ Layout globalny"]:::updated
    Logout["LogoutButton"]:::updated
    subgraph Widoki["Specyficzne widoki PRD"]
      Languages["Dashboard języków\n(add/delete)"]
      Categories["Zarządzanie kategoriami\n(create/rename/delete)"]
      Words["Formularz słowa\n+ tabela"] 
      Slider["Tryb slider"] 
      AI["Generator słów AI\n(OpenRouter)"]
      Confirm["ConfirmationDialog\n(shared)"]
    end
  end

  U -->|żądanie strony| LandingServer
  LandingServer -->|prefetch sesja + języki| LandingClient
  LandingClient --> Hero
  LandingClient --> Feature
  LandingClient --> Privacy
  LandingClient --> AuthSwitch
  AuthSwitch --> ModalState
  AuthSwitch --> Register
  AuthSwitch --> Login
  Register -.stan formularza.-> ModalState
  Login -.stan formularza.-> ModalState
  Register -->|POST| RegisterAPI
  Login -->|POST| LoginAPI
  Logout -->|POST| LogoutAPI
  LandingServer -->|sprawdzenie sesji| SessionAPI

  RegisterAPI --> AuthService
  LoginAPI --> AuthService
  LogoutAPI --> AuthService
  SessionAPI --> AuthService
  AuthService --> Validation
  AuthService --> Errors
  AuthService --> Supabase
  Supabase -.synchronizacja tokenów.-> Middleware
  Middleware --> AppLayout
  Supabase -->|sesja| AppLayout
  AppLayout --> Shell
  Shell --> Logout
  Shell --> Languages
  Shell --> Categories
  Shell --> Words
  Shell --> Slider
  Shell --> AI
  Shell --> Confirm
  Languages -->|selekcja języka| Categories
  Categories -->|ustawienia kontekstu| Words
  Words -->|przełącz widok| Slider
  Words -->|żądanie AI| AI
  Confirm -->|potwierdza kasowanie| Languages
  Confirm --> Categories
  Confirm --> Words
```
</mermaid_diagram>

