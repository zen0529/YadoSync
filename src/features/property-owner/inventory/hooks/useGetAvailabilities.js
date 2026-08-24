import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAvailabilities } from "../supabase";
import { inventoryKeys } from "../tanstack";
import { toDateStr, firstOfMonth, daysInMonth } from "../utils/dateUtils";

/**
 * Custom React Query hook to load and manage room type availability state with caching.
 *
 * @param {Object} params
 * @param {string} [params.propertyId] Property UUID
 * @param {Array} [params.roomTypes] List of room types
 * @param {number} params.viewYear Current selected year
 * @param {number} params.viewMonth Current selected month (0-indexed)
 * @param {boolean} [params.enabled=true] Whether query is enabled
 */
export const useGetAvailabilities = ({
  propertyId,
  roomTypes = [],
  viewYear,
  viewMonth,
  enabled = true,
}) => {
  const queryClient = useQueryClient();

  const queryKey = useMemo(
    () => inventoryKeys.availabilities(propertyId, viewYear, viewMonth),
    [propertyId, viewYear, viewMonth],
  );

  const hasRooms = Boolean(roomTypes && roomTypes.length > 0);

  const {
    data: availMap = {},
    isLoading,
    isFetching,
    refetch: loadAvailability,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const from = toDateStr(firstOfMonth(viewYear, viewMonth));
        const lastDay = daysInMonth(viewYear, viewMonth);
        const to = toDateStr(new Date(Date.UTC(viewYear, viewMonth, lastDay)));
        const roomTypeIds = roomTypes.map((r) => r.id);

        return await getAvailabilities({ roomTypeIds, from, to });
      } catch (err) {
        toast.error("Failed to load availability", { description: err.message });
        throw err;
      }
    },
    enabled: Boolean(enabled && propertyId && hasRooms),
    staleTime: 5 * 60 * 1000, // 5 minutes fresh
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
    throwOnError: false,
  });

  /**
   * Optimistically / directly update the availability cache for this month & room type
   */
  const handleCellSaved = useCallback(
    (roomTypeId, date, value) => {
      queryClient.setQueryData(queryKey, (prev = {}) => ({
        ...prev,
        [roomTypeId]: {
          ...(prev[roomTypeId] ?? {}),
          [date]: value,
        },
      }));
    },
    [queryClient, queryKey],
  );

  return {
    availMap,
    gridLoading: isLoading,
    isLoading,
    isFetching,
    loadAvailability,
    handleCellSaved,
  };
};
