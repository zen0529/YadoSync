# Channex API reference (verified shapes)

Every endpoint, payload, and response shape below was verified by
calling a live Channex staging server (not transcribed from docs) —
request bodies, the `data`/`meta` envelope, the error envelope, and the
read-back shapes for availability and restrictions. Field *availability*
can still vary by account/plan tier, so treat unexpected 422s as a cue
to re-check the live docs. For anything not covered here, fetch the
official docs — every page at
https://docs.channex.io has a markdown variant (append `.md` to the
URL), `https://docs.channex.io/sitemap.md` lists all pages, and
`https://docs.channex.io/llms-full.txt` is the full corpus.

## Basics

- Base URLs: `https://staging.channex.io/api/v1` (sandbox),
  `https://app.channex.io/api/v1` (production)
- Auth: `user-api-key: <key>` header on every request
- Success: 2xx with `{"data": {...}}` or `{"data": [...]}` — unwrap it.
  List/feed responses also carry a sibling `"meta"` object (pagination)
- Errors: `{"errors": {"code": "...", "title": "...", "details": [...]}}`
  with 400/401/404/422. `details` is an array and is OPTIONAL — present
  on validation errors (e.g. 400 → `["restrictions is required"]`),
  absent on auth errors (401 → just `code` + `title`). Don't assume it
  exists when formatting an error
- POST/PUT bodies wrap attributes under the entity name:
  `{"property": {...}}`, `{"room_type": {...}}`, `{"rate_plan": {...}}`
- Keep request payloads under 10 MB; send availability and
  restrictions as SEPARATE messages
- Dates are ISO 8601 `YYYY-MM-DD`; rates are integers in MINOR units
  (cents) on writes, decimal strings ("120.00") on reads and in
  booking payloads

## Content entities

### Property

```
POST /properties            {"property": ATTRS}     → 201, data.id = UUID
PUT  /properties/:id        {"property": ATTRS}
GET  /properties            → data: [{id, attributes: {...}}, ...]
```

ATTRS (all optional except title + currency): `title`, `currency`
(ISO 4217), `email`, `phone`, `website`, `country` (2-letter),
`state`, `city`, `address`, `zip_code`, `timezone` (IANA), `content`.
Omit nulls rather than sending them.

`content` is an OBJECT, not a string:

```json
"content": {
  "description": "Some Property Description Text",
  "important_information": "Notes shown in booking confirmation emails",
  "photos": [
    {"url": "https://img.channex.io/<uuid>/", "position": 0,
     "description": "Room View", "author": "Author Name", "kind": "photo"}
  ]
}
```

- `description` (string), `important_information` (string, property-only)
- `photos` (array): each has `url`, `position` (int; 0 = cover photo),
  `description`, `author`, `kind` ("photo" | "ad" | "menu"). On updates
  a photo may also carry its `id` (UUID); responses add system fields
  (`id`, `property_id`).

### Room type

```
POST /room_types            {"room_type": ATTRS}    → 201
PUT  /room_types/:id
GET  /room_types?filter[property_id]=UUID
```

ATTRS: `property_id` (UUID), `title`, `count_of_rooms` (int),
`occ_adults`, `occ_children`, `occ_infants`, `default_occupancy`
(must be ≤ occ_adults), `room_kind` ("room" | "dorm"), `content`.
New room types start with availability 0 — you must push availability
after creating them.

`content` is an OBJECT (same photo shape as property, but NO
`important_information`):

```json
"content": {
  "description": "Some Room Type Description Text",
  "photos": [
    {"url": "https://img.channex.io/<uuid>/", "position": 0,
     "description": "Room View", "author": "Author Name", "kind": "photo"}
  ]
}
```

`description` (string) and `photos` (array, same fields as property
photos; 0 = cover). Responses add `id`/`property_id`/`room_type_id`
to each photo.

### Rate plan

```
POST /rate_plans            {"rate_plan": ATTRS}    → 201
PUT  /rate_plans/:id
GET  /rate_plans?filter[property_id]=UUID
DELETE /rate_plans/:id
```

ATTRS: `property_id`, `room_type_id` (one rate plan belongs to ONE
room type), `title` (unique per property), `currency`,
`sell_mode` ("per_room" | "per_person"), `rate_mode` ("manual" is the
PMS-driven mode; "derived"/"auto"/"cascade" exist),
`options: [{"occupancy": N, "is_primary": true, "rate": 0}]` — that
minimal write shape is enough to create a plan. Note the asymmetry: on
WRITE `rate` is an integer in minor units (cents); in the RESPONSE each
option comes back richer — `{id, occupancy, rate: "0.00" (decimal
string), is_primary, derived_option, rate_category_id, inherit_* …}`.
The option `id` only matters if you later target one specific occupancy
option; for a single-occupancy plan you can ignore it.

## ARI (availability, rates, restrictions)

### Availability — per room type

```
POST /availability
{"values": [
  {"property_id": UUID, "room_type_id": UUID,
   "date_from": "2026-07-01", "date_to": "2026-07-14",
   "availability": 2},
  {"property_id": UUID, "room_type_id": UUID,
   "date": "2026-07-15", "availability": 0}
]}
```

Single `date` or `date_from`/`date_to` ranges (inclusive) both work.

Read back:

```
GET /availability?filter[property_id]=UUID&filter[room_type_id]=UUID
                  &filter[date_from]=YYYY-MM-DD&filter[date_to]=YYYY-MM-DD
```

Response: `{"data": {"[room_type_id]": {"[date]": N, ...}}, "meta": {...}}`

### Restrictions — per rate plan

```
POST /restrictions
{"values": [
  {"property_id": UUID, "rate_plan_id": UUID,
   "date_from": "2026-07-01", "date_to": "2026-07-14",
   "rate": 13800,                  // cents
   "min_stay_arrival": 2,
   "stop_sell": false,
   "closed_to_arrival": false,
   "closed_to_departure": false}
]}
```

**Partial updates are applied as partial**: a value containing only
`{rate}` changes the rate and leaves min-stay/closures untouched. This
is what makes field-level delta pushes possible — exploit it.

**Past dates are rejected** — filter `date >= today` before sending.

Read back (filter param REQUIRED — you get 400 without it):

```
GET /restrictions?filter[property_id]=UUID&filter[rate_plan_id]=UUID
                  &filter[date_from]=YYYY-MM-DD&filter[date_to]=YYYY-MM-DD
                  &filter[restrictions]=rate
```

Response: `{"data": {"[rate_plan_id]": {"[date]": {"rate": "138.00", ...}}}, ...}`

Note: rates come back as DECIMAL STRINGS in reads ("138.00"), not
integers. Don't compare them directly to the integer you sent; multiply
by 100 or use a decimal library.

### Per-person (occupancy-based) rates

For a `sell_mode: "per_person"` rate plan, restrictions carry a `rates`
ARRAY keyed by occupancy — NOT a scalar `rate`, and NOT an object keyed
by occupancy:

```json
POST /restrictions
{"values": [
  {"property_id": UUID, "rate_plan_id": UUID,
   "date_from": "2026-07-01", "date_to": "2026-07-14",
   "rates": [
     {"occupancy": 1, "rate": 9000},
     {"occupancy": 2, "rate": 11000},
     {"occupancy": 3, "rate": 13000}
   ]}
]}
```

## Bookings & revisions

### Feed polling

```
GET /booking_revisions/feed[?property_id=UUID]
```

Returns a list of unacknowledged revisions for the property (or all
properties if omitted). Each revision has:

```json
{
  "id": "revision-uuid",
  "revision_type": "new" | "modification" | "cancellation",
  "booking": {
    "id": "booking-uuid",
    "status": "new" | "modified" | "cancelled",
    "rooms": [...],
    "services": [...],
    "guest": {"name": "...", "email": "...", "phone": "..."},
    "arrival_date": "YYYY-MM-DD",
    "departure_date": "YYYY-MM-DD",
    "amount": "123.00",           // decimal string, MAJOR units
    "currency": "USD",
    "ota_name": "Booking.com",
    "ota_reservation_code": "...",
    "property_id": UUID,
    "channel_id": UUID
  }
}
```

Each room in `rooms` includes `room_type_id`, `checkin_date`,
`checkout_date`, `rate_plan_id`, and `days` (per-night breakdown).

Ack after applying:

```
POST /booking_revisions/:id/ack     (no body required)
→ 200, {"data": {}}
```

Unacknowledged revisions expire after 30 minutes and re-surface.

### Webhook registration

```
POST /webhooks
{
  "webhook": {
    "callback_url": "https://your-server.com/channex-webhook",
    "event_mask": "booking_new;booking_modification;booking_cancellation",
    "property_id": UUID | null,     // null = account-wide
    "is_active": true,
    "send_data": false              // true to include full payload inline
  }
}
→ 201, data.id = UUID

GET  /webhooks
PUT  /webhooks/:id
DELETE /webhooks/:id
```

Webhook POST body (from Channex to your server):

```json
{
  "event": "booking_new",
  "payload": {
    "booking_id": UUID,
    "property_id": UUID,
    "revision_id": UUID
  },
  "user_id": UUID,
  "timestamp": "ISO8601"
}
```

Flow: receive webhook → extract `revision_id` → `GET /booking_revisions/:id`
→ apply → `POST /booking_revisions/:id/ack`.

### Fetch a single revision

```
GET /booking_revisions/:id
→ {"data": { ...revision object... }}
```

## Properties listing (for multi-property setups)

```
GET /properties
→ {"data": [{"id": UUID, "attributes": {"title": "...", ...}}, ...],
   "meta": {"total_count": N, "page": 1, "limit": 15}}
```

Paginate with `?page=N&limit=M` if you have many properties.

## Error examples

**401 Unauthorized** (no `details` field):
```json
{"errors": {"code": "unauthorized", "title": "Unauthorized"}}
```

**400 Bad Request** (with `details`):
```json
{"errors": {"code": "bad_request", "title": "Bad Request",
            "details": ["restrictions is required"]}}
```

**422 Validation error** (with `details`):
```json
{"errors": {"code": "unprocessable_entity", "title": "Unprocessable Entity",
            "details": {"title": ["can't be blank"]}}}
```

Note: `details` shape varies — array of strings for simple validation,
object keyed by field for attribute-level errors. Handle both.
