# Rate Plan — Missing Fields Implementation Checklist

> Resume point for next session. Context: Channex `POST /api/v1/rate_plans` body had many fields missing from the form.

---

## New Files to Create

- [x] `channex/createTaxSet.js` — POST `/api/v1/tax_sets` (title, currency, property_id)
- [x] `channex/createTax.js` — POST `/api/v1/taxes` (the full tax payload per user spec)
- [x] `components/AddTaxSetPanel.jsx` — slide-over sub-panel for creating a tax set + one tax entry
- [x] `components/AddCancellationPolicyPanel.jsx` — UI-only slide-over sub-panel (no API yet)

---

## Modified Files

- [x] `components/AddRatePlanPanel.jsx`
  - [x] Expand `form` state with all missing fields
  - [x] **Additional Information section**: tax_set_id field (text input + `+` button → AddTaxSetPanel), cancellation policy (text input + `+` button → AddCancellationPolicyPanel), parent rate plan dropdown (only when `rate_mode = "derived"`)
  - [x] **Children / Infant Fees** inputs added to Pricing Configuration section
  - [x] **Advanced Settings** collapsible section: min_stay_arrival, min_stay_through, max_stay, closed_to_arrival, closed_to_departure, stop_sell, all inherit_* booleans
  - [x] `useEffect` — populate new fields when editing existing plan
  - [x] Pass `ratePlans` prop for parent rate plan dropdown

- [x] `channex/createRatePlan.js` — expand payload with all new fields
- [x] `channex/updateRatePlan.js` — expand payload with all new fields
- [x] `supabase/createRatePlan.js` — add new columns to INSERT (children_fee, infant_fee, tax_set_id, parent_rate_plan_id, min_stay_arrival, etc.)
- [x] `supabase/updateRatePlan.js` — add new columns to UPDATE

---

## Deferred / Revisit Later

- [ ] **Occupancy Options** (`options[]` array) — skipped per user request, revisit next session
- [ ] **Tax Set dropdown** — fetch existing tax sets from Channex API; currently a plain text input only
- [ ] **Cancellation Policy API** — UI built, API wiring deferred
- [ ] **Per-day restriction grids** — min/max stay and flags are currently single values broadcast to all 7 days; per-day control is a future enhancement
- [ ] **Supabase schema migration** — new columns (children_fee, infant_fee, tax_set_id, parent_rate_plan_id, min_stay_arrival, min_stay_through, max_stay, closed_to_arrival, closed_to_departure, stop_sell, inherit_*) need to be added to the `rate_plans` table via migration

---

## Notes

- Tax Set creation flow: user fills title + currency in `AddTaxSetPanel`, optionally adds one tax entry (VAT/percent/rate). On save:
  1. `POST /api/v1/tax_sets` → get `tax_set_id`
  2. `POST /api/v1/taxes` with `tax_set_id` → creates tax within that set
  3. `tax_set_id` is auto-filled back into the rate plan form
- Advanced settings default to "all 7 days same value" (`Array(7).fill(value)`) when sending to Channex
- `parent_rate_plan_id` only sent when `rate_mode === "derived"`
