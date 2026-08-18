# YadoManagement — Claude Code Instructions

## Project Overview

YadoManagement is an accommodation channel management platform. It is NOT a consumer-facing booking site. It competes against existing channel managers (Lodigy, Smoobu) but with a commission-based model instead of subscriptions.

There are two types of users:

- **Property owners** — sign up, connect their OTA accounts via Channex, and manage their own properties. They see only their own data.
- **Superadmin (single account — the founder)** — sees ALL properties, ALL bookings, and ALL commissions across the entire platform.

Property owners list their own accommodations on OTA platforms independently. YadoManagement syncs their availability via Channex and earns a commission on every confirmed booking.

## Tech Stack

- **Frontend:** React + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Font:** Poppins (Google Fonts)
- **Backend/Database:** Supabase (PostgreSQL + Edge Functions + Realtime)
- **Channel Manager:** Channex API (permanent backbone — handles all OTA connectivity)
- **Notifications:** Resend (email)
- **Deployment:** Vercel (frontend)

## Project Architecture (Feature-Sliced Design)

The project separates code into global/shared resources and feature-specific modules. When generating or modifying code, you must place files into their respective directories following this exact structure:

### 1. The Global Shared Layer

This layer contains global, reusable elements that enforce consistent design across the entire project. It has zero knowledge of specific business features or roles.

```
src/
├── components/
│   ├── ui/              # shadcn/ui primitives (@/components/ui/button.jsx, dialog.jsx, dropdown-menu.jsx)
│   ├── PlatformBadge.jsx
│   ├── StatusBadge.jsx
│   ├── SyncBadge.jsx
│   ├── ProtectedRoute.jsx
│   └── SuperadminRoute.jsx
├── layouts/             # Layout shells (DashboardLayout.jsx, SuperadminLayout.jsx)
├── hooks/               # Reusable domain-agnostic hooks (e.g., useDebounce.js, useMediaQuery.js)
├── utils/               # Global pure utilities (e.g., uploadPhotos.js, formatters.js)
└── lib/                 # Base singletons & utilities (supabase.js, utils.js for cn())
```

### 2. The Feature Layer (`src/features/`)

Features are categorized into shared/public features, property-owner features, and superadmin features.

```
src/features/
├── auth/                         # Shared Feature: Login, Signup, AuthContext
├── landingPage/                  # Shared Feature: Public marketing landing page
├── settings/                     # Shared Feature: Account & user settings (shared across roles)
│
├── property-owner/               # Role 1: Property Owner Features
│   ├── components/               # (Optional) Components shared strictly among owner features (e.g., MetricCard.jsx)
│   ├── dashboard/                # Owner overview dashboard
│   ├── inventory/                # Rooms, rate plans, ARI calendar grid, restrictions
│   ├── bookings/                 # Owner booking management
│   ├── resorts/                  # Resort & property configuration
│   ├── rates/                    # Base rates & pricing rules
│   ├── inbox/                    # Guest messaging
│   ├── connections/              # OTA channel connections & mapping
│   ├── analytics/                # Occupancy & revenue analytics
│   └── earnings/                 # Owner earnings & payouts
│
└── superadmin/                   # Role 2: Superadmin Features
    ├── components/               # (Optional) Components shared strictly among admin features
    ├── overview/                 # Platform executive overview
    ├── properties/               # Global platform property approval & oversight
    ├── bookings/                 # Global bookings & commission tracking
    ├── billing/                  # Commission invoices & platform billing
    └── logs/                     # System sync logs & webhook audit trails
```

### 3. Feature Internal Structure (`src/features/[role]/[feature-name]/`)

Every feature module strictly follows this 5-subfolder structure + `index.js` barrel file:

```
[feature-name]/
├── components/      # UI sub-components strictly specific to this feature
├── hooks/           # Custom React hooks (the mandatory bridge between UI and Queries)
├── queries/         # TanStack Query hooks & Supabase data fetching / edge function callers
├── utils/           # Feature-specific helpers, calculations, formatters, and constants
├── page/            # Route Page component(s) (e.g., InventoryPage.jsx)
└── index.js         # Public API entry point exporting the page and public interfaces
```

---

## Row Level Security (RLS)

- **owners** can only read/write their own rows (filter by `user_id`)
- **superadmin** bypasses RLS and can read all rows across all tables
- `role` is set manually in the database — never self-assignable by users
- Always check RLS is enabled before writing new queries

## Channex Integration

- Channex is the **permanent channel manager backbone** — handles all OTA platform connectivity (Booking.com, Agoda, Airbnb, Traveloka).
- **Zero Frontend Direct Calls**: The frontend NEVER calls Channex API directly. All Channex interactions are routed exclusively through **Supabase Edge Functions** to keep the `CHANNEX_API_KEY` secure and ensure database consistency.
- **Frontend Flow**: Frontend triggers operations (creating rate plans, updating inventory, pushing ARI) by invoking Supabase Edge Functions (`supabase.functions.invoke(...)`) and reads synced data directly from Supabase PostgreSQL tables.
- **Inbound Webhooks**: Channex pushes booking notifications to the `channex-webhook` Edge Function → saves to `bookings` table → updates availability → sends notifications.

## Supabase Edge Functions

Edge Functions serve as the secure bridge between YadoManagement and the Channex API:

- `_shared/` — Common Channex client helpers, retry/exponential backoff (`retryBackoff.ts`), ARI payload compression (`compressRestrictions.ts`), and TypeScript types.
- **Property & Room Management**: `createProperty`, `updateProperty`, `delete-property`, `createRoomType`, `updateRoomType`, `deleteRoomType`
- **Rate Plans & Pricing**: `createRatePlan`, `updateRatePlan`, `deleteRatePlan`
- **ARI & Availability Sync**: `pushAvailability`, `pushRestrictions`, `fullSyncARI`
- **Channel Mapping & Webhooks**: `createChannel`, `disconnectChannel`, `testChannelConnection`, `getChannelMappingDetails`, `channex-webhook`, `registerWebhook`
- **Notifications**: `send-notification` (email via Resend / SMS via Semaphore)

## Key Business Rules

- Commission = `total_amount × (commission_rate / 100)`
- Dates always in **ISO 8601** format
- Every sync attempt must be logged in `sync_logs` regardless of success or failure
- Notifications must respect `user_preferences` — check before sending SMS or email

## Coding Conventions

- **Feature Architecture**: Strictly adhere to the 5-subfolder + `index.js` feature structure defined in the Architecture section above.
- **Single Responsibility Principle (SRP)**:
  - **Components (`components/`, `page/`)**: Responsible _strictly for presentation and rendering_. Break complex forms/views into small, focused sub-components. Never put data-fetching logic or heavy data transformations inside UI components.
  - **Hooks (`hooks/`)**: Each hook manages _one specific workflow or state machine_ (e.g., `useRatePlanForm`, `useInventoryCalendar`), acting as the dedicated bridge to queries and mutations.
  - **Queries (`queries/`)**: Responsible _strictly for data access_ (calling Supabase tables or invoking edge functions). No UI state or form handling.
  - **Utils (`utils/`)**: Pure, side-effect-free helper functions that do one thing (formatting, calculations, matrix transformations). No React dependencies or hooks.
  - **Edge Functions**: Each function handles _one discrete business operation_ (e.g., `createRatePlan`, `pushRestrictions`, `createProperty`).
- **Hook Bridge Rule**: Custom React hooks in `hooks/` are the **mandatory bridge** between UI components (`page/`, `components/`) and the data layer (`queries/`). UI components must never query Supabase or external APIs directly.
- **Import Rules & Boundaries**:
  - Global layers (`src/components/`, `src/layouts/`, `src/lib/`, `src/utils/`, `src/hooks/`) can never import from `src/features/`.
  - Feature components must never directly import internal/private files of another feature. If cross-feature access is necessary, import via the feature's `index.js` barrel or elevate the shared logic to global (`src/components/`) or role-shared (`src/features/[role]/components/`).
- **JavaScript** (not TypeScript for frontend React components)
- camelCase for variables and functions, PascalCase for components
- Named exports for components and hooks, default export for pages
- Use **React Query (TanStack Query)** for all data fetching and caching
- Use **shadcn/ui** components — do not create custom UI primitives if shadcn has it (e.g., use shadcn `DropdownMenu` from `@/components/ui/dropdown-menu`, `Dialog` from `@/components/ui/dialog`, `Button` from `@/components/ui/button`, `Select` from `@/components/ui/select`, `Input` from `@/components/ui/input`, `DeleteDialog` from `@/components/ui/delete-dialog`)
- Tailwind for all styling — no inline styles, no CSS modules
- **Design Tokens**: Always refer to `token.json` in the project root for colors, fonts, shadows, and spacing tokens to ensure visual consistency. Do not introduce arbitrary colors outside the palette.

## What NOT to Do

- Do not build any consumer-facing booking UI — guests book through OTA platforms directly
- Do not store raw payment card data — YadoManagement never handles payments
- Do not call Channex or any external API from React components — all Channex operations must go through Supabase Edge Functions
- Do not skip sync logging — every sync attempt must be recorded in `sync_logs`
- Do not hardcode OTA platform IDs — always read from `platform_connections` table
- Do not allow users to set their own role — `role` is manually assigned in the database
- Do not suggest replacing Channex with direct OTA API integrations
- Do not build custom UI primitives when a shadcn/ui equivalent is available
