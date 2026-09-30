import { useQuery } from "@tanstack/react-query";
import { getTapeChartInventory } from "../supabase/getTapeChartInventory";
import { tapeChartKeys } from "../tanstack/tapeChartKeys";

export const useTapeChartInventory = (propertyId) =>
  useQuery({
    queryKey: tapeChartKeys.inventory(propertyId),
    queryFn: async () => {
      try {
        return await getTapeChartInventory(propertyId);
      } catch (error) {
        console.error("[useTapeChartInventory] load failed:", error);
        throw error;
      }
    },
    enabled: Boolean(propertyId),
    staleTime: 60_000,
  });
