import { useQuery } from "@tanstack/react-query";
import { getCommissionLedger } from "../supabase/getCommissionLedger";

/**
 * Hook for fetching the commission ledger rows shown on the AnalyticsPage.
 *
 * @param {Object}  options
 * @param {string}  [options.propertyId]  Restrict to a single property
 * @param {number}  [options.limit=50]    Max rows to return
 */
export function useCommissionLedger({ propertyId, limit = 50 } = {}) {
  return useQuery({
    queryKey: ["commission-ledger", { propertyId, limit }],
    queryFn: () => getCommissionLedger({ propertyId, limit }),
    staleTime: 60_000,
    throwOnError: false,
  });
}
