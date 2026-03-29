# YadoSync — Claude Code Instructions

## Project Overview
YadoSync is a private accommodation channel management dashboard. It is NOT a consumer-facing booking site. It is a solo internal tool used to manage property listings, sync bookings across OTA platforms (Klook, Booking.com, Agoda), track commissions, and notify property owners when a booking comes in.

## Tech Stack
- **Frontend:** React + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend/Database:** Supabase (PostgreSQL + Edge Functions + Realtime)
- **Notifications:** Resend (email), Semaphore (SMS - Philippines)
- **OTA Integrations:** Klook Partner API, Booking.com Connectivity API

## Project Structure
```
YadoSync/
├── public/                          # Static assets
├── src/
│   ├── App.jsx                      # Root component — BrowserRouter + auth-gated routes
│   ├── main.jsx                     # Vite entry point
│   ├── index.css                    # Global styles (Tailwind base)
│   ├── assets/                      # Images (hero.png, etc.)
│   ├── components/
│   │   ├── ui/                      # shadcn/ui primitives (badge, button, calendar, card, dialog, select, table)
│   │   ├── PlatformBadge.jsx        # OTA platform label badge (Klook, Booking.com, Agoda)
│   │   ├── StatusBadge.jsx          # Property status badge (active, setup)
│   │   └── SyncBadge.jsx            # Sync status badge (synced, pending, failed)
│   ├── data/
│   │   └── constants.js             # Shared constants (RESORTS, BOOKINGS, PLATFORM_LABELS, TIMEFRAMES)
│   ├── features/                    # Each feature follows: pages/ modals/ queries/ hooks/ components/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx        # Login / signup page
│   │   │   └── context/
│   │   │       └── AuthContext.jsx   # Supabase auth provider + useAuth hook
│   │   ├── bookings/
│   │   │   ├── pages/
│   │   │   │   └── BookingsPage.jsx # Bookings table with filters + availability calendar
│   │   │   ├── queries/
│   │   │   │   └── index.js         # Supabase queries: bookings, sync logs, notifications
│   │   │   ├── modals/
│   │   │   ├── hooks/
│   │   │   ├── components/
│   │   │   └── data/constants.js
│   │   ├── dashboard/
│   │   │   ├── pages/
│   │   │   │   └── DashboardPage.jsx # Overview metrics + recent bookings
│   │   │   ├── components/
│   │   │   │   ├── MetricCard.jsx   # Stat card with sparkline (shared with earnings)
│   │   │   │   └── Sparkline.jsx    # Mini SVG sparkline chart
│   │   │   ├── queries/
│   │   │   ├── hooks/
│   │   │   └── data/constants.js
│   │   ├── earnings/
│   │   │   ├── pages/
│   │   │   │   └── EarningsPage.jsx # Commission totals + per-booking/per-resort breakdowns
│   │   │   ├── queries/
│   │   │   ├── hooks/
│   │   │   └── data/constants.js
│   │   └── resorts/
│   │       ├── pages/
│   │       │   └── ResortsPage.jsx  # Property grid (fetches from Supabase)
│   │       ├── modals/
│   │       │   ├── AddResortModal.jsx    # Modal form to onboard a new property
│   │       │   └── ResortDetailModal.jsx # Modal to view/edit property details
│   │       ├── queries/
│   │       │   └── index.js         # Supabase queries: properties CRUD + platform connections
│   │       ├── hooks/
│   │       └── components/
│   ├── layouts/
│   │   └── DashboardLayout.jsx      # Sidebar + topbar + <Outlet /> (uses react-router-dom)
│   └── lib/
│       ├── supabase.js              # Supabase client init (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
│       └── utils.js                 # cn() helper (clsx + tailwind-merge)
├── index.html                       # Vite HTML shell
├── vite.config.js                   # Vite config with @ alias → src/
├── jsconfig.json                    # Path aliases for IDE
├── eslint.config.js                 # ESLint config
├── components.json                  # shadcn/ui config
└── package.json
```

### Routing
- Uses `react-router-dom` with `BrowserRouter` in App.jsx
- Routes: `/overview`, `/bookings`, `/resorts`, `/earnings`
- Unknown paths redirect to `/overview`
- `DashboardLayout` is the shared layout with sidebar nav and `<Outlet />`

## Database Tables
- `users` — Supabase auth users
- `properties` — accommodations being managed (name, location, owner contact, commission rate)
- `platform_connections` — links each property to OTA platforms with their external IDs
- `bookings` — all incoming bookings from OTA platforms
- `sync_logs` — logs of date-blocking sync calls to each platform
- `notifications` — SMS and email notification logs sent to property owners

## Key Business Rules
- When a booking comes in from one platform, the same dates must be blocked on all other connected platforms for that property immediately
- Commission is calculated as: `total_amount * (commission_rate / 100)`
- Sync status must be tracked per platform per booking (synced / pending / failed)
- Property owners must be notified via both SMS and email on every new booking
- The 30-minute acknowledgement window with Booking.com must be respected — Edge Functions must process and acknowledge webhooks within this window

## OTA Integration Notes
- **Booking.com** — uses OTA XML solution for reservations (`GET /OTA_HotelResNotif`). Must acknowledge bookings via `POST /OTA_HotelResNotif`. Uses Rates & Availability API (Standard pricing) to block dates.
- **Klook** — uses Klook Partner API. Most accessible platform for new partners.
- **Agoda** — YCS/Channel Manager API access pending. Not yet integrated.
- Each property has a `booking_com_hotel_id` and `klook_product_id` stored in `platform_connections` — these are required for API calls.

## Supabase Edge Functions
- `webhook-booking-com` — receives Booking.com reservation webhooks, saves booking, triggers sync and notifications
- `webhook-klook` — receives Klook booking webhooks, saves booking, triggers sync and notifications
- `sync-availability` — blocks dates on all connected platforms for a given property and date range
- `send-notification` — sends SMS via Semaphore and email via Resend to the property owner

## Coding Conventions
- Use **Javascript** where possible
- Use camelCase
- Use **named exports** for components, **default export** for pages
- Use **React Query (TanStack Query)** for all data fetching and caching
- Use **shadcn/ui** components for all UI elements — do not create custom UI primitives if a shadcn component exists
- Tailwind for all styling — no inline styles, no CSS modules
- All monetary values stored and calculated in **Philippine Peso (₱)** as floats
- Dates always stored as **ISO 8601** format in the database

## Environment Variables
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
BOOKING_COM_API_KEY=
KLOOK_API_KEY=
RESEND_API_KEY=
SEMAPHORE_API_KEY=
```

## What NOT to Do
- Do not build any consumer-facing booking UI — guests always book through Agoda, Klook, Booking.com directly
- Do not store raw payment card data — YadoSync never handles payments
- Do not call OTA APIs from the React frontend — always go through Supabase Edge Functions
- Do not skip sync logging — every platform sync attempt must be recorded in `sync_logs` regardless of success or failure
- Do not hardcode OTA platform IDs — always read from `platform_connections` table
