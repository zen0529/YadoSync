import { useState, useEffect, useCallback } from "react";
import { getTaxSets } from "../channex/getTaxSets";

/**
 * useTaxSets — loads tax sets for a Channex property and exposes a refetch.
 *
 * @param {string|null} channexPropertyId
 * @returns {{ taxSets: Array, loading: boolean, refetch: function }}
 */
export const useTaxSets = (channexPropertyId) => {
  const [taxSets, setTaxSets] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!channexPropertyId) return;
    setLoading(true);
    try {
      const data = await getTaxSets(channexPropertyId);
      setTaxSets(data);
    } catch (err) {
      // Non-critical — fail silently; user can still create a new tax set
      console.warn("useTaxSets: failed to load tax sets", err.message);
    } finally {
      setLoading(false);
    }
  }, [channexPropertyId]);

  useEffect(() => {
    load();
  }, [load]);

  return { taxSets, loading, refetch: load };
};
