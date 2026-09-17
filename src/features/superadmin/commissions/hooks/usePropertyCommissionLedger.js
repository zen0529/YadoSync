import { useQuery } from "@tanstack/react-query";
import { commissionQueryKeys } from "../tanstack/commissionQueryKeys";
import { getPropertyCommissionLedger } from "../supabase/getPropertyCommissionLedger";

/**
 * Custom hook to fetch the commission booking ledger for a specific property.
 *
 * @param {string|null} propertyId UUID of the property
 * @returns {Object} Query state with ledger rows, totals, loading & error status
 */
export function usePropertyCommissionLedger(propertyId) {
  const {
    data: ledger = [],
    isLoading,
    isError,
    error: rawError,
    refetch,
  } = useQuery({
    queryKey: commissionQueryKeys.propertyLedger(propertyId),
    queryFn: async () => {
      try {
        return await getPropertyCommissionLedger(propertyId);
      } catch (err) {
        console.error("[usePropertyCommissionLedger] query failed:", err);
        throw err;
      }
    },
    enabled: Boolean(propertyId),
    staleTime: 60_000,
    throwOnError: false,
  });

  const errorMessage = isError
    ? "Failed to load booking ledger. Please try again."
    : null;

  const totalCommission = ledger.reduce(
    (sum, row) => sum + (Number(row.commission_amount) || 0),
    0
  );
  const totalVolume = ledger.reduce(
    (sum, row) => sum + (Number(row.amount) || 0),
    0
  );

  return {
    ledger,
    totalCommission,
    totalVolume,
    bookingCount: ledger.length,
    isLoading,
    isError,
    errorMessage,
    refetch,
  };
}
