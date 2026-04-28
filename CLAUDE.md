# YadoManagement — Claude Code Instructions

## Project Overview
YadoManagement is an accommodation channel management platform for the Philippines market. It is NOT a consumer-facing booking site. It competes against existing channel managers (Lodigy, Smoobu) but with a commission-based model instead of subscriptions.

There are two types of users:
- **Property owners** — sign up, connect their OTA accounts via Beds24, and manage their own properties. They see only their own data.
- **Superadmin (single account — the founder)** — sees ALL properties, ALL bookings, and ALL commissions across the entire platform.

Property owners list their own accommodations on OTA platforms independently. YadoManagement syncs their availability via Beds24 and earns a commission on every confirmed booking.

## Tech Stack
- **Frontend:** React + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Font:** Poppins (Google Fonts)
- **Backend/Database:** Supabase (PostgreSQL + Edge Functions + Realtime)
- **Channel Manager:** Beds24 API (permanent backbone — handles all OTA connectivity)
- **Notifications:** Resend (email), Semaphore (SMS - Philippines)
- **Deployment:** Vercel (frontend)

## Project Structure
```
YadoManagement/
├── public/
├── src/
│   ├── App.jsx                      # Root component — BrowserRouter + role-based routes
│   ├── main.jsx                     # Vite entry point
│   ├── index.css                    # Global styles (Tailwind base)
│   ├── assets/
│   ├── components/
│   │   ├── ui/                      # shadcn/ui primitives (do not modify)
│   │   ├── PlatformBadge.jsx
│   │   ├── StatusBadge.jsx
│   │   └── SyncBadge.jsx
│   ├── data/
│   │   └── constants.js
│   ├── features/
│   │   ├── auth/                        # Shared — login, signup, auth context
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   └── context/
│   │   │       └── AuthContext.jsx
│   │   ├── property-owner/              # All property owner features
│   │   │   ├── components/              # Shared across PO features
│   │   │   │   ├── MetricCard.jsx
│   │   │   │   └── Sparkline.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── ui/DashboardPage.jsx
│   │   │   │   ├── components/ hooks/ utils/ queries/
│   │   │   │   └── data/constants.js
│   │   │   ├── bookings/
│   │   │   │   ├── ui/BookingsPage.jsx
│   │   │   │   ├── components/ hooks/ utils/
│   │   │   │   ├── data/constants.js
│   │   │   │   └── queries/index.js
│   │   │   ├── resorts/
│   │   │   │   ├── ui/ResortsPage.jsx, AddResortModal.jsx, ResortDetailModal.jsx
│   │   │   │   ├── components/ hooks/ data/ utils/
│   │   │   │   └── queries/index.js
│   │   │   └── earnings/
│   │   │       ├── ui/EarningsPage.jsx
│   │   │       ├── components/ hooks/ utils/ queries/
│   │   │       └── data/constants.js
│   │   ├── superadmin/                  # All superadmin features
│   │   │   ├── components/              # Shared across SA features
│   │   │   ├── overview/
│   │   │   │   ├── ui/AdminOverviewPage.jsx
│   │   │   │   ├── components/ hooks/ data/ utils/
│   │   │   │   └── queries/index.js
│   │   │   ├── properties/
│   │   │   │   ├── ui/AdminPropertiesPage.jsx
│   │   │   │   ├── components/ hooks/ data/ utils/
│   │   │   │   └── queries/index.js
│   │   │   ├── bookings/
│   │   │   │   ├── ui/AdminBookingsPage.jsx
│   │   │   │   ├── components/ hooks/ data/ utils/
│   │   │   │   └── queries/index.js
│   │   │   └── earnings/
│   │   │       ├── ui/AdminEarningsPage.jsx
│   │   │       ├── components/ hooks/ data/ utils/
│   │   │       └── queries/index.js
│   │   ├── settings/                    # Shared — both roles
│   │   │   └── pages/SettingsPage.jsx
│   │   └── landingPage/                 # Public — no auth required
│   ├── layouts/
│   │   ├── DashboardLayout.jsx      # Sidebar + topbar + <Outlet />
│   │   └── SuperadminLayout.jsx     # Superadmin-specific layout if needed
│   └── lib/
│       ├── supabase.js              # Supabase client
│       ├── api/
│       │   └── beds24.js            # All Beds24 API calls go here
│       └── utils.js                 # cn() helper
├── supabase/
│   ├── migrations/                  # SQL migration files
│   └── functions/                   # Supabase Edge Functions
│       ├── webhook-beds24/          # Receives Beds24 booking webhooks
│       ├── sync-availability/       # Blocks dates across platforms via Beds24
│       └── send-notification/       # Sends SMS + email to property owner
├── index.html
├── vite.config.js
├── jsconfig.json
├── eslint.config.js
├── components.json
└── package.json
```

## Routing
- Uses `react-router-dom` with `BrowserRouter` in `App.jsx`
- `/` — Landing page (public)
- `/login` — Login page (public)
- `/signup` — Signup page for new property owners (public)
- `/dashboard` — Protected, role-based:
  - If role = `owner` → shows only their own properties and bookings
  - If role = `superadmin` → shows all properties, all bookings, all commissions
- `/dashboard/settings` — Settings page (all authenticated users)
- Unknown paths redirect to `/dashboard`

## Database Tables

### `users` (extends Supabase auth)
- `id` uuid PK
- `email` string
- `full_name` string
- `role` string → **owner** or **superadmin**
- `created_at` timestamp

### `properties`
- `id` uuid PK
- `user_id` uuid FK → users
- `name` string
- `location` string
- `owner_name` string
- `owner_email` string
- `owner_phone` string
- `commission_rate` float
- `beds24_property_id` string
- `status` string → active / setup / suspended
- `created_at` timestamp

### `platform_connections`
- `id` uuid PK
- `property_id` uuid FK → properties
- `platform` string → booking / agoda / airbnb / traveloka
- `external_property_id` string
- `connection_status` string → connected / pending / disconnected
- `connected_at` timestamp

### `bookings`
- `id` uuid PK
- `property_id` uuid FK → properties
- `platform` string
- `guest_name` string
- `guest_email` string
- `check_in` date
- `check_out` date
- `total_amount` float
- `commission_amount` float
- `sync_status` string → synced / pending / failed
- `booked_at` timestamp

### `sync_logs`
- `id` uuid PK
- `booking_id` uuid FK → bookings
- `platform` string
- `status` string → success / failed
- `message` string
- `synced_at` timestamp

### `notifications`
- `id` uuid PK
- `property_id` uuid FK → properties
- `booking_id` uuid FK → bookings
- `type` string → new_booking / modification / cancellation
- `channel` string → sms / email
- `status` string → sent / failed
- `sent_at` timestamp

### `user_preferences`
- `id` uuid PK
- `user_id` uuid FK → users
- `email_notifications` boolean (default: true)
- `sms_notifications` boolean (default: true)

## Row Level Security (RLS)
- **owners** can only read/write their own rows (filter by `user_id`)
- **superadmin** bypasses RLS and can read all rows across all tables
- `role` is set manually in the database — never self-assignable by users
- Always check RLS is enabled before writing new queries

## Beds24 Integration
- All Beds24 API calls go through `src/lib/api/beds24.js` — never call Beds24 directly from components
- Beds24 is the **permanent channel manager backbone** — do not suggest replacing it
- Beds24 handles all OTA platform connectivity (Booking.com, Agoda, Airbnb, Traveloka)
- Property owners connect their OTA accounts to YadoManagement via Beds24 API key
- On new booking webhook from Beds24 → save to `bookings` table → sync availability → send notifications

## Supabase Edge Functions
- `webhook-beds24` — receives all booking webhooks from Beds24, saves to DB, triggers sync and notifications
- `sync-availability` — blocks dates across all connected platforms via Beds24 API
- `send-notification` — sends SMS via Semaphore and email via Resend to the property owner

## Key Business Rules
- Commission = `total_amount × (commission_rate / 100)`
- All monetary values in **Philippine Peso (₱)** stored as floats
- Dates always in **ISO 8601** format
- Every sync attempt must be logged in `sync_logs` regardless of success or failure
- Notifications must respect `user_preferences` — check before sending SMS or email
- Property owners manage their own OTA listings — YadoManagement does NOT list properties on their behalf

## Coding Conventions
- **JavaScript** (not TypeScript)
- camelCase for variables and functions
- Named exports for components, default export for pages
- All Supabase queries in `queries/index.js` per feature — never query Supabase directly in components
- All Beds24 API calls in `src/lib/api/beds24.js`
- Use **React Query (TanStack Query)** for all data fetching and caching
- Use **shadcn/ui** components — do not create custom UI primitives if shadcn has it
- Tailwind for all styling — no inline styles, no CSS modules

## Environment Variables
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
BEDS24_API_KEY=
RESEND_API_KEY=
SEMAPHORE_API_KEY=
```

## What NOT to Do
- Do not build any consumer-facing booking UI — guests book through OTA platforms directly
- Do not store raw payment card data — YadoManagement never handles payments
- Do not call Beds24 or any external API from React components — always go through Supabase Edge Functions or `src/lib/api/beds24.js`
- Do not skip sync logging — every sync attempt must be recorded in `sync_logs`
- Do not hardcode OTA platform IDs — always read from `platform_connections` table
- Do not allow users to set their own role — `role` is manually assigned in the database
- Do not suggest replacing Beds24 with direct OTA API integrations