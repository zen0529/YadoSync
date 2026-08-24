import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getRatePlansByProperty } from "../supabase/getRatePlans";

/**
 * useGetRatePlans — fetches rate plans for a given property from Supabase.
 *
 * Uses TanStack Query so the list automatically re-fetches whenever the
 * ["ratePlans", propertyId] query key is invalidated (e.g. after a mutation).
 *
 * @param {string|null} propertyId - Local Supabase property UUID
 */
export const useGetRatePlans = (propertyId) => {
  const { data: ratePlans = [], isLoading: loading } = useQuery({
    queryKey: ["ratePlans", propertyId],
    queryFn: () => getRatePlansByProperty(propertyId),
    enabled: !!propertyId,
    throwOnError: false,
    meta: {
      onError: (err) =>
        toast.error("Failed to load rate plans", { description: err.message }),
    },
  });

  return { ratePlans, loading };
};
