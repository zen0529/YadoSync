/**
 * _shared/bookingsPage/resolveProperty.ts
 *
 * Single responsibility: resolve a Channex property UUID (or Supabase UUID)
 * to the corresponding Supabase `properties.id` and `commission_rate`.
 *
 * Channex payloads send `attributes.property_id` as the Channex property UUID,
 * but Supabase `bookings.property_id` has a foreign key to `properties.id` (Supabase UUID).
 * This helper bridges the two IDs and caches lookups in-memory.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export interface ResolvedProperty {
  id: string; // Supabase property UUID (PK)
  commission_rate: number | null;
}

const propertyCache = new Map<string, ResolvedProperty | null>();

/**
 * Resolve a Channex property ID (or Supabase property UUID) to the
 * Supabase property record { id, commission_rate }.
 *
 * Returns null if no matching property exists in YadoSync.
 */
export async function resolveProperty(
  supabase: ReturnType<typeof createClient>,
  propertyId: string,
): Promise<ResolvedProperty | null> {
  if (!propertyId) return null;

  if (propertyCache.has(propertyId)) {
    return propertyCache.get(propertyId) ?? null;
  }

  // 1. Try match by channex_property_id
  const { data: byChannex } = await supabase
    .from("properties")
    .select("id, commission_rate")
    .eq("channex_property_id", propertyId)
    .maybeSingle();

  if (byChannex) {
    const resolved: ResolvedProperty = {
      id: byChannex.id,
      commission_rate: byChannex.commission_rate ?? null,
    };
    propertyCache.set(propertyId, resolved);
    propertyCache.set(byChannex.id, resolved);
    return resolved;
  }

  // 2. Fallback: try match by id (in case propertyId is already a Supabase UUID)
  const { data: byId } = await supabase
    .from("properties")
    .select("id, commission_rate")
    .eq("id", propertyId)
    .maybeSingle();

  if (byId) {
    const resolved: ResolvedProperty = {
      id: byId.id,
      commission_rate: byId.commission_rate ?? null,
    };
    propertyCache.set(propertyId, resolved);
    return resolved;
  }

  propertyCache.set(propertyId, null);
  return null;
}
