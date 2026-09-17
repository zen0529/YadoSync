/**
 * _shared/updatePropertyCommission.ts
 *
 * Single responsibility: recompute and persist `properties.total_commission`
 * after a booking's commission_amount changes.
 *
 * Called explicitly by applyRevision.ts after:
 *   - A successful "new" booking upsert (commission_amount set)
 *   - A successful "cancellation" update (commission_amount zeroed to 0)
 *
 * Approach: re-sums ALL confirmed bookings for the property so the value
 * is always consistent, even if a previous update was missed.
 *
 * This is intentionally NOT a DB trigger — keeping the logic in TypeScript
 * makes it easier to test, trace in logs, and extend later.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * Recomputes `properties.total_commission` for the given property by
 * summing `commission_amount` across all confirmed bookings.
 *
 * Non-fatal: logs errors internally but never throws. A failure here
 * must not roll back the booking that was already saved successfully.
 *
 * @param supabase    A Supabase client with service role (bypasses RLS)
 * @param propertyId  The Supabase `properties.id` UUID to update
 */
export async function updatePropertyCommission(
  supabase: ReturnType<typeof createClient>,
  propertyId: string,
): Promise<void> {
  // Step 1: Sum commission_amount for all active bookings of this property.
  // Both 'new' and 'modified' are included — a modified booking is still a
  // real booking (the guest hasn't cancelled). Only 'cancellation' bookings
  // are excluded from the commission total.
  const { data: agg, error: sumError } = await supabase
    .from("bookings")
    .select("commission_amount")
    .eq("property_id", propertyId)
    .in("status", ["new", "modified"])
    .not("commission_amount", "is", null);

  if (sumError) {
    console.error(
      `[updatePropertyCommission] Failed to aggregate commission for property ${propertyId}:`,
      sumError.message,
    );
    return; // non-fatal
  }

  const total = (agg ?? []).reduce(
    (sum: number, row: { commission_amount: number | null }) =>
      sum + (row.commission_amount ?? 0),
    0,
  );

  // Step 2: Write the new total back to the property row
  const { error: updateError } = await supabase
    .from("properties")
    .update({ total_commission: parseFloat(total.toFixed(2)) })
    .eq("id", propertyId);

  if (updateError) {
    console.error(
      `[updatePropertyCommission] Failed to update total_commission for property ${propertyId}:`,
      updateError.message,
    );
    return; // non-fatal
  }

  console.log(
    `[updatePropertyCommission] property ${propertyId} → total_commission = ${total.toFixed(2)}`,
  );
}
