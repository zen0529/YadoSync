import { getRoomTypesByProperty } from "@/features/property-owner/roomAndRates/supabase/getRoomTypes";
import { getRatePlansByProperty } from "@/features/property-owner/roomAndRates/supabase/getRatePlans";

/**
 * Fetch local YadoSync room types and rate plans for a property in parallel.
 *
 * Rate plans are filtered to only those with a `channex_rate_plan_id` —
 * plans without one cannot be linked to Channex and must not appear in the
 * mapping dropdowns (they would create a silent broken mapping).
 *
 * @param {string} propertyId - Local Supabase property UUID
 * @returns {{ roomTypes: Array, ratePlans: Array }}
 */
export const getLocalInventory = async (propertyId) => {
  const [allRoomTypes, allRatePlans] = await Promise.all([
    getRoomTypesByProperty(propertyId),
    getRatePlansByProperty(propertyId),
  ]);

  // Only rate plans that are already synced to Channex are valid mapping targets.
  const syncedRatePlans = allRatePlans.filter(
    (rp) => Boolean(rp.channex_rate_plan_id),
  );

  return { roomTypes: allRoomTypes, ratePlans: syncedRatePlans };
};
