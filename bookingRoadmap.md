# Booking.com Integration Roadmap

> Last updated: 2026-09-03 (updated with real Postman adapter descriptor)  
> Reference: [`booking.md`](file:///c:/Users/SEJI/YadoSync/booking.md) — 8-step Channex ↔ Booking.com connection flow  
> Real descriptor: [`adapterDescriptor.js`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/OTAs/bookingCom/adapterDescriptor.js)  
> Status key: ✅ Done · 🟡 Partial / Needs Fix · ❌ Missing · 🔬 Needs Live API Test

---

## Quick Summary

| Step | What | Status |
|------|------|--------|
| 1 | Get adapter descriptor | ✅ Done via Postman, stored in `adapterDescriptor.js` |
| 2 | Test connection | ✅ Done — checks result.success and formats errors |
| 3 | Get mapping details | ✅ Done — aligned to id/title & ChannelMapping built |
| 4 | Get connection details (currency) | ✅ Done — retrieved via connection_details & displayed in UI |
| 5 | Fetch Channex rooms/rates (`multi_occupancy`) | 🟡 Partial — rate plans fetched by room type |
| 6 | Build the mapping structure | ✅ Done — room-first cascading mapping with primary_occ & readonly |
| 7 | Create the connection | ✅ Done — fixed payload (properties, channel, primary_occ, occupancy) & deployed |
| 8 | Activate the connection | ✅ Done — activated on creation, wired to Save & Connect UI |
| — | Update / Deactivate / Delete | 🟡 Disconnect wired; Configure opens mapping panel |
| — | Actions (`load_future_reservations`) | ❌ Missing |
| — | BookingComGenSet ↔ ConnectWizard unification | ✅ Unified via ChannelPanel flow |
| — | Mapping tab in ChannelPanel | ✅ Implemented in ChannelMapping.jsx |
| — | Advanced settings / hidden fields | ✅ Dropped — only hotel_id collected per Channex spec |

---

## Real Descriptor — What It Confirms & Reveals

The live `GET /api/v1/channels/adapter?code=BookingCom` response (stored in [`adapterDescriptor.js`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/OTAs/bookingCom/adapterDescriptor.js)) settles several open questions and introduces new ones:

### ✅ Confirmed correct in our code
- `hotel_id` is the only user-fillable `params` field (type `"string"`) — matches `BookingComGenSet.jsx`
- `machine_account` is `type: "hidden"` — Channex fills it, we must never send it — we don't ✅
- `send_email_notifications` (boolean) and `email` (string, conditionally shown) — both in our UI ✅
- `primary_occ` is `type: "boolean"` — confirmed, **not an integer** (fixes the conflation bug in `createChannel`)
- `occupancy` is `type: "integer"` — separate field from `primary_occ` ✅
- `readonly` is `type: "boolean"` — must be copied from OTA rate ✅

### ✅ Adapter code aligned (`"BookingCom"`)
The real `code` in the Channex descriptor is **`"BookingCom"`** (capital C, camelCase).  
[`PLATFORMS.js`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/constants/PLATFORMS.js) has been updated with `id: "BookingCom"`.  
UI components and edge function callers now pass `"BookingCom"`.  
*(Note: In `createChannel/index.ts`, ensure the JSON payload field key is `"channel"` rather than `"channel_id"`).*

### ✅ Only `hotel_id` retained (advanced settings dropped)
All 5 advanced flags (`allow_payout_method_update`, `allow_payout_update`, `allow_vcc_balance`, `allow_vcc_fees_payout`, `allow_virtual_credit_card_update`) have `type: "hidden"` in the real Channex descriptor.  
Channex documentation confirms: *"Fields of type `hidden` are managed by Channex — do not collect or send a value for them. For Booking.com, the only setting to collect from the user is `hotel_id`."*  
**Design decision:** Retain **only `hotel_id`** in the UI. Advanced flags and email notification options have been removed from `BookingComGenSet.jsx`, keeping the connection setup minimal and compliant with Channex guidelines.

### ⚠️ `rate_plan_code` and `room_type_code` are `type: "string"` in descriptor
But `booking.md` explicitly warns: *"room_type_code and rate_plan_code MUST be integers"* and *"Channex will silently place the mapping under 'Removed Rates' on the OTA side"* if sent as strings.  
`createChannel/index.ts` already does `Number(m.room_type_code)` — keep that cast. The `type: "string"` in the descriptor is for UI display/validation only; the wire format is integer.

### ✅ `mapping_mode: "room_rate_multioccupancy"` confirmed
This is the authoritative signal that multi-occupancy expansion in Step 6 is **required**, not optional. One mapping row per (room × rate × occupancy) triplet.

### ✅ `property_mapping: "single"` confirmed
One Channex property per connection — matches our design.

### ✅ `pricing_type` default is `"Standart"` (Channex typo)
The descriptor default is `"Standart"` (misspelled). The valid options are `["Standard", "OBP"]`. When building mapping rows, use the value from the OTA `mapping_details` response, not this default.

---

## Step-by-Step Status

### Step 1 — Get Adapter Descriptor
**Spec:** `GET /api/v1/channels/adapter?code=BookingCom`  
**Status:** ✅ Done — run via Postman, full response stored in [`adapterDescriptor.js`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/OTAs/bookingCom/adapterDescriptor.js)

No need to call this at runtime. The descriptor is stable — use the stored JS object as the source of truth for field definitions. Key values extracted: see the "Real Descriptor" section above.

---

### Step 2 — Test Connection
**Spec:** `POST /api/v1/channels/test_connection` → `{ data: { success: true, errors: null } }`  
**Status:** ✅ Fully implemented (syntax fixed & `success: false` check added)

**What's implemented:**
- Edge function [`testChannelConnection/index.ts`](file:///c:/Users/SEJI/YadoSync/supabase/functions/testChannelConnection/index.ts) ✅
- `try { ... } catch` block properly scoped ✅
- Validates `result.success !== false` and parses `errors` so Booking.com 200 OK failures throw cleanly ✅
- Frontend [`handleTest.js`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/utils/handleTest.js) utility ✅
- UI feedback (spinner, ✅/❌) in both [`Step1Credentials.jsx`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/components/Step1Credentials.jsx) and [`BookingComGenSet.jsx`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/components/BookingComGenSet.jsx) ✅

---

### Step 3 — Get Mapping Details
**Spec:** `POST /api/v1/channels/mapping_details` → `{ data: { pricing_type: "Standard", rooms: [...] } }`  
**Status:** ✅ Done — verified via live Postman data (`mappingDetails.js`) & UI built

**What's implemented:**
- Edge function [`getChannelMappingDetails/index.ts`](file:///c:/Users/SEJI/YadoSync/supabase/functions/getChannelMappingDetails/index.ts) updated with real Channex response keys (`room.id`, `room.title`, `rate.id`, `rate.title`, `pricing_type`, `readonly`) ✅
- Channex `group_id` resolved from `GET /groups` ✅
- Frontend [`ChannelMapping.jsx`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/components/ChannelMapping.jsx) implemented with live spinner, room/rate cards, and YadoSync rate plan mapping dropdowns ✅
- [`ChannelPanel.jsx`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/components/ChannelPanel.jsx) auto-advances from General Settings to Mapping tab upon saving verified Hotel ID ✅

---

### Step 4 — Get Connection Details (Currency)
**Spec:** `POST /api/v1/channels/connection_details` → `{ data: { attributes: { currency: "GBP" } } }`  
**Status:** ✅ Fully implemented

**What's implemented:**
- Integrated `POST /channels/connection_details` call into [`getChannelMappingDetails/index.ts`](file:///c:/Users/SEJI/YadoSync/supabase/functions/getChannelMappingDetails/index.ts) ✅
- Returns `currency` along with `rooms`, `pricing_type`, and `group_id` in a single round-trip ✅
- Displayed in [`ChannelMapping.jsx`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/components/ChannelMapping.jsx) as a badge in the header overview alongside pricing model ✅

---

### Step 5 — Fetch Channex Side (Rooms & Rate Plans)
**Spec:**
```
GET /api/v1/room_types/options?filter[property_id]={id}
GET /api/v1/rate_plans/options?filter[property_id]={id}&multi_occupancy=true
```
**Status:** 🟡 Partial — rate plans fetched by room type

**What's implemented:**
- [`useRatePlansForMapping`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/hooks/useConnections.js#L47) hook fetches both room types and rate plans ✅
- Rates are dynamically filtered per selected Room Type in `ChannelMapping.jsx` ✅

---

### Step 6 — Build the Mapping Structure
**Spec:** Room-first hierarchy, then rate plan mapping per OTA rate, with `primary_occ: true` and `readonly`.  
**Status:** ✅ Fully implemented in `ChannelMapping.jsx`

**What's implemented:**
- Cascading mapping: OTA Room Type mapped to local Room Type before rates unlock ✅
- Dynamically filters local rate plans to matching room type ✅
- Purges invalid child rate selections if parent room type changes ✅
- Passes `primary_occ: true`, `readonly`, and integer room/rate codes to payload ✅

---

### Step 7 — Create the Connection
**Spec:** `POST /api/v1/channels` with `{ channel: { channel, group_id, title, properties: [uuid], settings, rate_plans } }`  
**Status:** ✅ Fully fixed and deployed

**What's implemented:**
- Edge function [`createChannel/index.ts`](file:///c:/Users/SEJI/YadoSync/supabase/functions/createChannel/index.ts) updated & deployed:
  - `properties: [channex_property_id]` (array format) ✅
  - `channel: targetChannel` (e.g. `"BookingCom"`) ✅
  - `settings: { hotel_id }` ✅
  - `settings.primary_occ` (boolean) vs `settings.occupancy` (integer) cleanly separated ✅
  - `settings.readonly` (boolean) carried from OTA rate ✅
  - Automatic fallback `title: "${targetChannel} connection"` ✅
  - Added unique constraint on `platform_connections(property_id, platform)` ✅
  - Wired to `Save & Connect` button in `ChannelMapping.jsx` with loading spinner, error feedback, and success callback ✅

---

### Step 8 — Activate the Connection
**Spec:** `POST /api/v1/channels/{channel_id}/activate` (no body). Requires ≥1 property + ≥1 rate plan mapping.  
**Status:** 🟡 Partial — called inside createChannel, rollback logic has flaws

**What's implemented:**
- Activate called immediately after create ✅
- Attempts rollback (deactivate + delete) on failure ✅

**Problems:**

1. **Rollback calls `deactivate` before `delete`.** A channel that failed activation is still inactive — calling deactivate on an inactive channel may error and suppress the delete.

2. **`load_future_reservations` not called after activation.** Spec recommends this action for hotels with existing reservations. Not implemented.

---

## Missing Features

### Update Connection
**Spec:** `PUT /api/v1/channels/{channel_id}`  
**Status:** ❌ Missing  
Needed to change settings or replace rate plan mappings after initial setup.

### Deactivate / Delete
**Status:** 🟡 Edge function `disconnectChannel` exists but UI disconnect button is not fully wired.

### ChannelMapping Tab
[`ChannelMapping.jsx`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/components/ChannelMapping.jsx) — **❌ Stub (`return null`)**  
Should display current room/rate mappings and allow re-mapping post-connection.

### ChannelSettings Tab
[`ChannelSettings.jsx`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/components/ChannelSettings.jsx) — **❌ Stub (`return null`)**  
Should display/edit notification settings and advanced booleans for an active connection.

---

## Architecture Problem: Two Parallel Flows

There are **two separate connect UIs** that overlap but neither is complete:

| | [`ConnectWizard.jsx`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/components/ConnectWizard.jsx) | [`ChannelPanel.jsx`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/components/ChannelPanel.jsx) + `BookingComGenSet` |
|---|---|---|
| Fields | Hotel ID only | Hotel ID + title + notifications + advanced settings |
| Mapping | `Step2Mapping.jsx` (partial) | `ChannelMapping.jsx` — **stub** |
| Activate | `Step3Activate.jsx` | N/A |
| Missing | title, notifications, advanced settings | full mapping + activate |
| Data fate | Passed to `createChannelConnection` | `onSuccess` output is **thrown away** — never wired to create |

**Decision needed:** Merge them into one flow, or designate `ConnectWizard` for initial connect and `ChannelPanel` for editing an existing connection?

---

## Prioritized Work Queue

### 🔴 P1 — Blockers (connection won't work)

1. **Fix `testChannelConnection` try/catch scope** — ✅ Fixed (added `try {` on line 32)
2. **Fix `properties` array in `createChannel`** — ✅ Fixed (sent as `properties: [channex_property_id]`)
3. **Fix `primary_occ` vs `occupancy` conflation** — ✅ Fixed (`primary_occ` is boolean, `occupancy` is integer)
4. **Fix channel field key in `createChannel`** — ✅ Fixed (`channel: targetChannel` e.g. `"BookingCom"`)
5. **Live-test `mapping_details` response** — ✅ Confirmed (Channex returns `id` and `title`; `getChannelMappingDetails` and `ChannelMapping.jsx` aligned)
6. **Unique constraint on `platform_connections`** — ✅ Added `UNIQUE (property_id, platform)` to prevent upsert crash

### 🟠 P2 — Core Feature Gaps

7. **Room-first mapping hierarchy** — ✅ Fully implemented in `ChannelMapping.jsx`
8. **`primary_occ: true/false` logic** — ✅ Set `primary_occ: true` per mapped rate in payload
9. **`readonly` flag forwarding** — ✅ Copied from OTA rate to mapping settings
10. **Default connection `title` in `createChannel`** — ✅ Set `title: "${targetChannel} connection"` automatically
11. **`pricing_type` pipeline** — ✅ Extracted from `mapping_details` and passed through payload
12. **Currency retrieval (Step 4)** — ✅ Integrated into `getChannelMappingDetails` and badge in `ChannelMapping.jsx`

### 🟡 P3 — UX / Post-Connection Features

13. **Resolve two-flow architecture** — ✅ Unified in `ChannelPanel.jsx` (General Settings → Mapping → Channel Settings)
14. **`ChannelMapping` tab** — ✅ Implemented in `ChannelMapping.jsx` with full live sync and Save & Connect
15. **Configure button on connected platforms** — ✅ Added to `PlatformRow.jsx` to open mapping panel directly
16. **`ChannelSettings` tab** — ❌ Next up: edit notification settings and advanced booleans for live connection

### 🟢 P4 — Nice To Have

17. **Step 1: `GET /channels/adapter`** — drive form fields dynamically from Channex descriptor
18. **`load_future_reservations` action** — call once after first activation
19. **Update connection flow** — `PUT /channels/{id}` for settings changes post-activation

---

## Files Reference

| File | Purpose | Status |
|------|---------|--------|
| [`booking.md`](file:///c:/Users/SEJI/YadoSync/booking.md) | Channex API spec for Booking.com | Reference |
| [`PLATFORMS.js`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/constants/PLATFORMS.js) | Platform list + adapter codes | ✅ |
| [`bookingSettings.js`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/constants/bookingSettings.js) | Advanced settings options | ✅ |
| [`BookingComGenSet.jsx`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/components/BookingComGenSet.jsx) | General settings form (panel flow) | ✅ Verified Hotel ID & test connection |
| [`GeneralSettingsTab.jsx`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/components/GeneralSettingsTab.jsx) | Routes to platform-specific genset | ✅ |
| [`ChannelPanel.jsx`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/components/ChannelPanel.jsx) | Side panel with 3 tabs | ✅ Auto-advances & connects mapping |
| [`ConnectWizard.jsx`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/components/ConnectWizard.jsx) | 3-step connect modal | Superseded by ChannelPanel |
| [`Step1Credentials.jsx`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/components/Step1Credentials.jsx) | Hotel ID + test connection | ✅ Only collects hotel_id per spec |
| [`ChannelMapping.jsx`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/components/ChannelMapping.jsx) | Mapping tab content | ✅ Full live room-first mapping & Save |
| [`ChannelSettings.jsx`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/components/ChannelSettings.jsx) | Channel settings tab content | ❌ Next task |
| [`channelConnections.js`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/supabase/channelConnections.js) | Supabase + edge fn callers | ✅ createChannelConnection wired |
| [`handleTest.js`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/utils/handleTest.js) | Test connection utility | ✅ |
| [`useConnections.js`](file:///c:/Users/SEJI/YadoSync/src/features/property-owner/channels/hooks/useConnections.js) | Property + connections hooks | ✅ Fetches room types & rate plans |
| [`testChannelConnection/index.ts`](file:///c:/Users/SEJI/YadoSync/supabase/functions/testChannelConnection/index.ts) | Edge fn: test credentials | ✅ Fixed, deployed & validated |
| [`getChannelMappingDetails/index.ts`](file:///c:/Users/SEJI/YadoSync/supabase/functions/getChannelMappingDetails/index.ts) | Edge fn: OTA rooms/rates + group_id + currency | ✅ Deployed with currency & clean normalization |
| [`createChannel/index.ts`](file:///c:/Users/SEJI/YadoSync/supabase/functions/createChannel/index.ts) | Edge fn: create + activate | ✅ Deployed with corrected payload |
| [`disconnectChannel/`](file:///c:/Users/SEJI/YadoSync/supabase/functions/disconnectChannel/) | Edge fn: deactivate + delete | ✅ Wired with confirmation dialog |
