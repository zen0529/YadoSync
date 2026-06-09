# YadoSync — What to Build Next

## Where You Are Now ✅

| Done | Feature |
|---|---|
| ✅ | Superadmin: Create / Update / View All Properties (Channex + Supabase) |
| ✅ | Property owner account auto-created on property creation |
| ✅ | Property owner can log in |
| ✅ | Connections page (OTA platform connect/disconnect UI) |
| ✅ | Inventory page shell (UI exists, uses dummy data) |
| ✅ | Channex as backbone (property API done) |
| ✅ | **Phase 1: Room Types** (CRUD via Channex + Supabase, Owner Dashboard UI) |

---

## 📍 Where We Are Currently At: **Phase 2 (Rate Plans)**

We have successfully completed **Phase 1 (Room Types)**. You now have a working Channex integration for Room Types and a beautiful glass UI in the Property Owner dashboard to manage them. 

*(Reminder: You just need to run the `room_types` SQL migration in your Supabase dashboard to finalize the database connection).*

Our next major milestone is **Phase 2: Rate Plans**. Without Rate Plans, room types cannot have prices or availability in Channex.

You can't have real bookings, rates, or availability management until **Room Types** exist in Channex. In Channex's data model:

```
Property → Room Types → Rate Plans → Bookings
```

A booking always belongs to a Room Type. A Rate Plan belongs to a Room Type. You cannot sync availability without Room Types. This is the hard dependency.

---

## The 6-Phase Roadmap

### ✅ Phase 1 — Room Types (COMPLETED)

> **Goal: Allow properties to have physical rooms configured.**

**Why not import from OTA first?**
- Channex's "import from OTA" feature requires the property to already have Room Types set up in Channex — it maps OTA listings *to* existing room types, not the other way around.
- Importing from OTA via Channex is a **mapping operation**, not a creation operation.
- Building manually first gives you full control and teaches you the Channex Room Type API before dealing with OTA mapping complexity.

**What to build:**
- **Superadmin side**: Ability to add/edit/delete Room Types per property (since superadmin sets up properties)
- **Channex API calls**: `POST /api/v1/room_types`, `PUT /api/v1/room_types/:id`, `DELETE /api/v1/room_types/:id`
- **Supabase table**: `room_types` — mirrors the Channex data locally for fast queries
- **Property Owner side**: View-only list of their room types (they don't create rooms, superadmin does)

**Channex Room Type fields you'll need:**
| Field | Description |
|---|---|
| `title` | Room type name (e.g., "Deluxe Room", "Studio Suite") |
| `property_id` | Channex property ID |
| `count_of_rooms` | Number of physical rooms of this type |
| `occ_adults` | Max adult occupancy | 
| `occ_children` | Max children occupancy | 
| `occ_infants` | Max infant occupancy | 
| `default_occupancy` | Default occupancy | 
| `capacity` | Total capacity |

---

### 📍 Phase 2 — Rate Plans (CURRENT FOCUS)

After room types exist, you need Rate Plans — because Channex requires at least one Rate Plan per Room Type before availability/pricing can be managed.

**What to build:**
- Superadmin creates Rate Plans linked to Room Types
- Channex API: `POST /api/v1/rate_plans`, `PUT /api/v1/rate_plans/:id`
- Supabase table: `rate_plans`
- Property owner can view Rate Plans for their property

**Minimum viable Rate Plan fields:**
| Field | Description |
|---|---|
| `title` | e.g., "Standard Rate", "Non-refundable" |
| `room_type_id` | Linked room type (Channex ID) |
| `currency` | ISO currency code |
| `sell_mode` | `per_room` or `per_person` |
| `rate_mode` | `manual` or `derived` |
| `cancellation_policy_id` | From Channex |

---

### 🥉 Phase 3 — Availability & Rates (Inventory page becomes real)

Once Room Types + Rate Plans exist, the **Inventory page** and a new **Rates page** become meaningful:

- **Inventory page** (already has UI shell): wire up real Channex data for room availability per date
- **Rates page** (already has route in `App.jsx`): property owner sets prices per room type per date range
- **Channex API**: `POST /api/v1/availabilities` (set availability), `POST /api/v1/rates` (set prices)

---

### Phase 4 — OTA Connections (Make the Connections page functional)

The Connections page UI exists but is wired to Beds24, not Channex. Once rooms + rates exist:

- Map your Channex Room Types to OTA Room Type IDs
- This is the "import from OTA" workflow you were thinking of — it's actually a **room type mapping**, not a room import
- Channex handles the OTA sync automatically once mapping is done

---

### Phase 5 — Bookings

Once the above is done, bookings will start flowing from OTAs via Channex webhooks. Build:

- Channex webhook endpoint (Supabase Edge Function) to receive bookings
- Save to `bookings` table
- Property owner Bookings page (route already exists)
- Superadmin Bookings page (route already exists)
- Notifications (email/SMS) on new booking

---

### Phase 6 — Dashboard & Analytics

With real bookings data, the Dashboard and Analytics pages become meaningful:

- Revenue metrics
- Occupancy rate
- Commission tracking
- Platform breakdown

---

## Summary Table

| Phase | Feature | Who | Unblocks | Status |
|---|---|---|---|---|
| **1** | Room Types | Property Owner creates/views | Everything else | ✅ Done |
| **2** | Rate Plans | Superadmin creates, Owner views | Availability & Pricing | 📍 **Current** |
| **3** | Availability + Rates | Owner manages | Real Inventory page | ⏳ Pending |
| **4** | OTA Connections / Room Mapping | Owner maps | OTA sync | ⏳ Pending |
| **5** | Bookings (webhooks) | Automated + Owner views | Revenue data | ⏳ Pending |
| **6** | Dashboard + Analytics | Owner views | Business insights | ⏳ Pending |

---

## Supabase Tables to Add

```sql
-- room_types
CREATE TABLE room_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  channex_room_type_id text NOT NULL,
  title text NOT NULL,
  count_of_rooms integer DEFAULT 1,
  occ_adults integer DEFAULT 2,
  occ_children integer DEFAULT 0,
  occ_infants integer DEFAULT 0,
  default_occupancy integer DEFAULT 2,
  capacity integer DEFAULT 2,
  created_at timestamptz DEFAULT now()
);

-- rate_plans
CREATE TABLE rate_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  room_type_id uuid REFERENCES room_types(id) ON DELETE CASCADE,
  channex_rate_plan_id text NOT NULL,
  title text NOT NULL,
  currency text NOT NULL DEFAULT 'PHP',
  sell_mode text DEFAULT 'per_room',
  rate_mode text DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);
```

---

## Immediate Next Action

**Start with Phase 2: Rate Plans**

1. Run the `room_types` SQL script in Supabase (if you haven't yet).
2. Design the `rate_plans` SQL schema.
3. Add Channex API calls for rate plans in `src/features/superadmin/properties/channex/`
4. Build the Rate Plans UI for Superadmins to attach pricing plans to properties.
