import { useQuery } from "@tanstack/react-query";
import { commissionQueryKeys } from "../tanstack/commissionQueryKeys";
import { getPropertyCommissions } from "../supabase/getPropertyCommissions";

/**
 * Custom hook to fetch all properties and their commission rollups.
 * Bridges UI components with TanStack Query and Supabase.
 *
 * @param {Object} options
 * @param {string} [options.searchQuery='']
 * @param {string} [options.sortBy='commission_desc']
 * @returns {Object} Query result object with filtered properties and aggregate stats
 */
export function usePropertyCommissions({ searchQuery = "", sortBy = "commission_desc" } = {}) {
  const {
    data: properties = [],
    isLoading,
    isError,
    error: rawError,
    refetch,
  } = useQuery({
    queryKey: commissionQueryKeys.properties(),
    queryFn: async () => {
      try {
        return await getPropertyCommissions();
      } catch (err) {
        console.error("[usePropertyCommissions] query failed:", err);
        throw err;
      }
    },
    staleTime: 60_000,
    throwOnError: false,
  });

  const errorMessage = isError
    ? "Failed to load commission data. Please refresh or try again."
    : null;

  // Filter properties by search term (property name, owner name, owner email)
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredProperties = properties.filter((p) => {
    if (!normalizedQuery) return true;
    return (
      (p.name && p.name.toLowerCase().includes(normalizedQuery)) ||
      (p.ownerName && p.ownerName.toLowerCase().includes(normalizedQuery)) ||
      (p.ownerEmail && p.ownerEmail.toLowerCase().includes(normalizedQuery))
    );
  });

  // Sort properties
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case "commission_desc":
        return b.totalCommission - a.totalCommission;
      case "commission_asc":
        return a.totalCommission - b.totalCommission;
      case "volume_desc":
        return b.totalVolume - a.totalVolume;
      case "bookings_desc":
        return b.bookingCount - a.bookingCount;
      case "rate_desc":
        return b.commissionRate - a.commissionRate;
      case "name_asc":
        return a.name.localeCompare(b.name);
      default:
        return b.totalCommission - a.totalCommission;
    }
  });

  // Platform-wide aggregate totals
  const totalCommission = properties.reduce(
    (sum, p) => sum + (p.totalCommission || 0),
    0
  );
  const totalVolume = properties.reduce(
    (sum, p) => sum + (p.totalVolume || 0),
    0
  );
  const totalBookings = properties.reduce(
    (sum, p) => sum + (p.bookingCount || 0),
    0
  );
  const propertiesWithCommission = properties.filter(
    (p) => (p.commissionRate || 0) > 0
  ).length;

  const averageCommissionRate =
    properties.length > 0
      ? properties.reduce((sum, p) => sum + (p.commissionRate || 0), 0) /
        properties.length
      : 0;

  return {
    properties: sortedProperties,
    totalCount: properties.length,
    isLoading,
    isError,
    errorMessage,
    refetch,
    stats: {
      totalCommission,
      totalVolume,
      totalBookings,
      propertiesWithCommission,
      averageCommissionRate,
    },
  };
}
