import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getBookings } from "../queries";

/**
 * React Query hook for fetching bookings from Supabase.
 *
 * Polls every 60 seconds as a backstop and subscribes to Supabase Realtime
 * so new OTA bookings, cancellations, and modifications appear instantly.
 *
 * @param {Object} options
 * @param {string} [options.propertyId]  Filter to a single property (undefined = all)
 * @param {string} [options.otaName]     Filter by OTA name e.g. "Booking.com"
 */
export function useBookings({ propertyId, otaName } = {}) {
  const queryClient = useQueryClient();

  // Realtime subscription alongside polling
  useEffect(() => {
    const channel = supabase
      .channel("bookings-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["bookings"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["bookings", { propertyId, otaName }],
    queryFn: () => getBookings({ propertyId, otaName }),
    // Refresh every 60 s as backstop
    refetchInterval: 60_000,
    // Keep stale data on screen while revalidating
    staleTime: 30_000,
    // Don't throw on error — return empty array and surface via isError
    throwOnError: false,
  });
}
