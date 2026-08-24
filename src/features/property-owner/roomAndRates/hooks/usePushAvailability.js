import { useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * usePushAvailability
 *
 * Calls the pushAvailability edge function to push per-date room counts
 * to Channex and upsert them into the local availability table.
 *
 * @returns { pushAvailability, loading, error }
 */
export const usePushAvailability = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * @param {object} params
   * @param {string} params.propertyId
   * @param {string} params.roomTypeId
   * @param {string} params.channexPropertyId
   * @param {string} params.channexRoomTypeId
   * @param {Array<{date: string, available: number}>} params.values
   */
  const pushAvailability = async ({
    propertyId,
    roomTypeId,
    channexPropertyId,
    channexRoomTypeId,
    values,
  }) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        "pushAvailability",
        {
          body: {
            propertyId,
            roomTypeId,
            channexPropertyId,
            channexRoomTypeId,
            values,
          },
        },
      );

      // functionError covers network/invoke-level failures
      if (functionError) throw new Error(`Function error: ${functionError.message}`);
      // The edge function returns { error } with a 400 status —
      // Supabase client puts the body in `data` even on non-2xx responses.
      if (data?.error) throw new Error(data.error);
      // Guard: if data came back null/undefined for any other reason
      if (!data) throw new Error("pushAvailability returned an empty response — check edge function logs");

      return data; // { pushed, ranges }
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { pushAvailability, loading, error };
};
