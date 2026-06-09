# YadoSync Phase Implementation Skill

> Read this file in full before starting any phase work.  
> This skill applies to all phases in `ROADMAP.md`.

---

## Project Identity

- **App name:** YadoSync (formerly YadoManagement)
- **Type:** Accommodation channel management platform (Philippines market)
- **Two user roles:** `superadmin` (founder, sees everything) and `owner` (sees only their data)
- **Channel Manager backbone:** Channex (NOT Beds24 — CLAUDE.md is outdated on this point)
- **Database:** Supabase (PostgreSQL + RLS)
- **Frontend:** React + Vite, Tailwind CSS, shadcn/ui, Poppins font
- **Language:** JavaScript (not TypeScript)
- **Data fetching:** React Query (TanStack Query) everywhere

---

## Architecture Rules (Always Follow)

| Layer | Rule |
|---|---|
| Components | Never query Supabase or call APIs directly from components |
| Supabase queries | Always go in `queries/index.js` per feature |
| Channex API calls | Always go in `src/features/superadmin/properties/channex/` — one file per resource |
| Supabase mutations | Always go in `src/features/superadmin/properties/supabase/` — one file per resource |
| Hooks | Custom hooks go in `hooks/` inside the feature folder |
| UI pages | Go in `ui/` subfolder of the feature |
| Shared UI | Use shadcn/ui primitives — never build custom ones if shadcn has it |
| Styling | Tailwind only — no inline styles, no CSS modules |

---

## Feature Folder Pattern

Every new feature MUST follow this exact folder structure:

```
src/features/<role>/<feature-name>/
├── ui/                   # Page components (e.g., RatePlansPage.jsx)
├── components/           # Sub-components used only in this feature
├── hooks/                # Custom React Query hooks (useCreateRatePlan, etc.)
├── queries/
│   └── index.js          # All Supabase reads for this feature
├── supabase/             # Supabase write operations (create, update, delete)
└── channex/              # Channex API calls (if applicable)
```

For the **superadmin/properties** feature, all additions plug into the existing structure:
```
src/features/superadmin/properties/
├── channex/              # ADD new files here for Channex API (e.g., ratePlans.js)
├── supabase/             # ADD new files here for Supabase ops (e.g., ratePlans.js)
├── tabs/                 # ADD new tab UI components here
├── components/           # ADD shared sub-components here
└── hooks/                # ADD new hooks here
```

---

## Standard Checklist for Every Phase

Run through all of these before calling a phase complete:

### 1. Supabase Database
- [ ] SQL migration written (follow schema patterns from ROADMAP.md)
- [ ] Migration file added to `supabase/migrations/` with timestamp prefix
- [ ] RLS policies defined: owners see only their own rows, superadmin sees all
- [ ] Foreign keys and cascade deletes are correct
- [ ] Remind the user to run the migration in Supabase dashboard

### 2. Channex API Layer (`src/features/superadmin/properties/channex/`)
- [ ] One file per Channex resource (e.g., `ratePlans.js`)
- [ ] Exports named functions: `create<Resource>`, `update<Resource>`, `delete<Resource>`, `get<Resource>s`
- [ ] Uses `VITE_CHANNEX_API_KEY` env var (never hardcoded)
- [ ] Proper error handling with descriptive thrown errors
- [ ] No direct calls from React components

### 3. Supabase Operations Layer (`src/features/superadmin/properties/supabase/`)
- [ ] One file per resource (e.g., `ratePlans.js`)
- [ ] Mirrors the Channex data locally for fast queries
- [ ] Uses Supabase client from `src/lib/supabase.js`
- [ ] Syncs `channex_<resource>_id` as the external ID reference

### 4. React Query Hooks (`hooks/`)
- [ ] One hook per mutation/query (e.g., `useCreateRatePlan`, `useRatePlans`)
- [ ] Uses `useMutation` for writes, `useQuery` for reads
- [ ] Invalidates correct query keys on mutation success
- [ ] Handles loading and error states

### 5. Superadmin UI
- [ ] New tab or section added to the property detail view
- [ ] CRUD actions: create, edit, delete (with confirmation modal for delete)
- [ ] Loading skeletons while data fetches
- [ ] Empty state with a clear CTA
- [ ] Success/error toasts using shadcn `sonner` or `toast`
- [ ] Form validation (required fields, sensible defaults)
- [ ] Uses glass card style consistent with the existing UI

### 6. Property Owner UI
- [ ] Read-only view of the relevant data for their property
- [ ] Consistent card/table layout matching other owner pages
- [ ] Shows a helpful empty state if nothing is configured yet
- [ ] No create/edit/delete controls (owners are viewers only for most things)

### 7. Routing (if adding a new page)
- [ ] Route added to `App.jsx` under the correct layout
- [ ] Protected with role check (owner vs superadmin)

### 8. Code Quality
- [ ] Named exports for components, default export for pages
- [ ] camelCase for all variables and functions
- [ ] No hardcoded IDs, credentials, or magic strings
- [ ] Existing `CLAUDE.md` conventions followed

---

## Phase Reference (from ROADMAP.md)

| Phase | Feature | Who builds | Who views | Channex Endpoints |
|---|---|---|---|---|
| 1 ✅ | Room Types | Superadmin CRUD | Owner (read-only) | `/room_types` |
| 2 📍 | Rate Plans | Superadmin CRUD | Owner (read-only) | `/rate_plans` |
| 3 ⏳ | Availability + Rates | Owner manages | Owner | `/availabilities`, `/rates` |
| 4 ⏳ | OTA Connections / Room Mapping | Owner maps | Owner | `/channel_links` or similar |
| 5 ⏳ | Bookings (webhooks) | Automated | Owner + Superadmin | Channex webhooks |
| 6 ⏳ | Dashboard + Analytics | — | Owner + Superadmin | (reads from DB) |

---

## Key Env Vars

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
VITE_CHANNEX_API_KEY=        # Used in Channex API layer
VITE_CHANNEX_BASE_URL=       # https://api.channex.io/api/v1
RESEND_API_KEY=
SEMAPHORE_API_KEY=
```

---

## How to Invoke This Skill

When starting a new phase, say:

> "Implement Phase X using @[yadosync-phase.md]"

I will:
1. Read the ROADMAP.md to understand what Phase X needs
2. Follow the architecture rules above
3. Work through the standard checklist for every deliverable
4. Tell you when to run SQL migrations manually in Supabase
5. Produce a walkthrough summary of everything built
