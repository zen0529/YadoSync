import { useQuery } from "@tanstack/react-query";
import { getBookings } from "../queries";

/**
 * React Query hook for fetching bookings from Supabase.
 *
 * Polls every 60 seconds so new OTA bookings appear without a page refresh.
 * Modified_pending and cancelled bookings are included in the results and
 * the UI can surface them with appropriate styling.
 *
 * @param {Object} options
 * @param {string} [options.propertyId]  Filter to a single property (undefined = all)
 * @param {string} [options.otaName]     Filter by OTA name e.g. "Booking.com"
 */
export function useBookings({ propertyId, otaName } = {}) {
  return useQuery({
    queryKey: ["bookings", { propertyId, otaName }],
    queryFn: () => getBookings({ propertyId, otaName }),
    // Refresh every 60 s so incoming OTA bookings appear without manual reload
    refetchInterval: 60_000,
    // Keep stale data on screen while revalidating
    staleTime: 30_000,
    // Don't throw on error — return empty array and surface via isError
    throwOnError: false,
  });
}
