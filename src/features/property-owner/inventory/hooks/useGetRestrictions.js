import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getRestrictions } from "../supabase";
import { inventoryKeys } from "../tanstack";
import { toDateStr, firstOfMonth, daysInMonth } from "../utils/dateUtils";

/**
 * Custom React Query hook to load and manage restrictions state with caching.
 *
 * @param {Object} params
 * @param {Object} [params.property] Property object
 * @param {string} [params.propertyId] Property UUID
 * @param {Array} [params.roomTypes] List of room types
 * @param {Array} [params.ratePlanIds] List of rate plan IDs
 * @param {number} params.viewYear Current selected year
 * @param {number} params.viewMonth Current selected month (0-indexed)
 * @param {boolean} [params.enabled=true] Whether restrictions should be loaded
 */
export const useGetRestrictions = ({
  property,
  propertyId: propId,
  roomTypes = [],
  ratePlanIds = [],
  viewYear,
  viewMonth,
  enabled = true,
}) => {
  const propertyId = propId || property?.id;
  const queryClient = useQueryClient();

  const queryKey = useMemo(
    () => inventoryKeys.restrictions(propertyId, viewYear, viewMonth),
    [propertyId, viewYear, viewMonth],
  );

  const hasTargets = Boolean(
    propertyId || (roomTypes && roomTypes.length > 0) || (ratePlanIds && ratePlanIds.length > 0),
  );

  const {
    data = { roomTypeMap: {}, ratePlanMap: {} },
    isLoading,
    isFetching,
    refetch: loadRestrictions,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const from = toDateStr(firstOfMonth(viewYear, viewMonth));
        const lastDay = daysInMonth(viewYear, viewMonth);
        const to = toDateStr(new Date(Date.UTC(viewYear, viewMonth, lastDay)));
        const roomTypeIds = roomTypes.map((r) => r.id);

        return await getRestrictions({
          propertyId,
          ratePlanIds,
          roomTypeIds,
          from,
          to,
        });
      } catch (err) {
        console.warn("Failed to load restrictions:", err);
        return { roomTypeMap: {}, ratePlanMap: {} };
      }
    },
    enabled: Boolean(enabled && propertyId && hasTargets),
    staleTime: 5 * 60 * 1000, // 5 minutes fresh
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
    throwOnError: false,
  });

  const restrMap = data?.roomTypeMap ?? {};
  const ratePlanRestrMap = data?.ratePlanMap ?? {};

  /**
   * Optimistically / directly update restriction cells for a rate plan in the TanStack Query cache
   */
  const handleRestrictionSaved = useCallback(
    (ratePlanId, dateOrDates, valueObj) => {
      const dates = Array.isArray(dateOrDates) ? dateOrDates : [dateOrDates];
      if (!dates.length) return;

      queryClient.setQueryData(
        queryKey,
        (oldData = { roomTypeMap: {}, ratePlanMap: {} }) => {
          const prevRatePlanMap = oldData.ratePlanMap ?? {};
          const planMap = { ...(prevRatePlanMap[ratePlanId] ?? {}) };
          for (const d of dates) {
            planMap[d] = { ...(planMap[d] ?? {}), ...valueObj };
          }
          const nextRatePlanMap = {
            ...prevRatePlanMap,
            [ratePlanId]: planMap,
          };

          // Also patch the room-type-level map
          const prevRoomTypeMap = oldData.roomTypeMap ?? {};
          const nextRoomTypeMap = { ...prevRoomTypeMap };
          for (const rtId of Object.keys(nextRoomTypeMap)) {
            let modified = false;
            const rtMap = { ...nextRoomTypeMap[rtId] };
            for (const d of dates) {
              if (rtMap[d]) {
                rtMap[d] = { ...rtMap[d], ...valueObj };
                modified = true;
              }
            }
            if (modified) {
              nextRoomTypeMap[rtId] = rtMap;
            }
          }

          return {
            roomTypeMap: nextRoomTypeMap,
            ratePlanMap: nextRatePlanMap,
          };
        },
      );
    },
    [queryClient, queryKey],
  );

  return {
    restrMap,
    ratePlanRestrMap,
    restrLoading: isLoading,
    isLoading,
    isFetching,
    loadRestrictions,
    handleRestrictionSaved,
  };
};
