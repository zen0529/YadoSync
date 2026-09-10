import { useQuery } from "@tanstack/react-query";
import { getChannexInventory } from "../supabase/getChannexInventory";
import { channelKeys } from "../tanstack/channelKeys";

/**
 * Fetch Channex-side room types and rate plans for a property.
 *
 * Calls the `getChannexInventory` edge function which makes two Channex GET
 * requests in parallel:
 *   GET /room_types/options?filter[property_id]={channex_property_id}
 *   GET /rate_plans/options?filter[property_id]={channex_property_id}&multi_occupancy=true
 *
 * Uses TanStack Query for caching - switching between tabs in ChannelPanel
 * will NOT re-fetch; data is served from the 5-minute cache.
 *
 * @param {{ propertyId: string|null, channexPropertyId: string|null }} ids
 * @returns {{
 *   roomTypes: Array,   // { id, title, count_of_rooms }
 *   ratePlans: Array,   // { id, title, room_type_id, occupancy, sell_mode, rate_mode }
 *   loading: boolean,
 *   error: Error|null,
 * }}
 */
export const useRatePlansForMapping = ({ propertyId, channexPropertyId } = {}) => {
  const enabled = Boolean(propertyId) && Boolean(channexPropertyId);

  const { data, isLoading, error } = useQuery({
    queryKey: channelKeys.localInventory(propertyId),
    queryFn: () => getChannexInventory(channexPropertyId),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 min - inventory rarely changes mid-session
  });

  return {
    roomTypes: data?.roomTypes ?? [],
    ratePlans: data?.ratePlans ?? [],
    loading: isLoading && enabled,
    error: error ?? null,
  };
};
