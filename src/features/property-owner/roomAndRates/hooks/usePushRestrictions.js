import { useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * usePushRestrictions
 *
 * Calls the pushRestrictions edge function to push per-date rate and
 * restriction values to Channex and upsert them into the local restrictions table.
 *
 * Rate values must be passed in MINOR units (cents). The UI layer converts
 * from major units (pesos/dollars) before calling this hook.
 *
 * @returns { pushRestrictions, loading, error }
 */
export const usePushRestrictions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * @param {object} params
   * @param {string} params.propertyId
   * @param {string} params.ratePlanId
   * @param {string} params.channexPropertyId
   * @param {string} params.channexRatePlanId
   * @param {"per_room"|"per_person"} params.sellMode
   * @param {Array<{
   *   date: string,
   *   rate: number,                 // cents
   *   min_stay_arrival?: number,
   *   stop_sell?: boolean,
   *   closed_to_arrival?: boolean,
   *   closed_to_departure?: boolean
   * }>} params.values
   */
  const pushRestrictions = async ({
    propertyId,
    ratePlanId,
    channexPropertyId,
    channexRatePlanId,
    sellMode = "per_room",
    values,
  }) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        "pushRestrictions",
        {
          body: {
            propertyId,
            ratePlanId,
            channexPropertyId,
            channexRatePlanId,
            sellMode,
            values,
          },
        },
      );

      if (functionError) throw new Error(`Function Error: ${functionError.message}`);
      if (data?.error)   throw new Error(data.error);

      return data; // { pushed, ranges }
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { pushRestrictions, loading, error };
};
