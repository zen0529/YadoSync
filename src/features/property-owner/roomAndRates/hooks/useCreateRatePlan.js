import { useState } from "react";
import { supabase } from "@/lib/supabase";

export const useCreateRatePlan = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createRatePlan = async ({
    propertyId,
    roomTypeId,
    channexPropertyId,
    channexRoomTypeId,
    form,
  }) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        "createRatePlan",
        {
          body: {
            propertyId,
            roomTypeId,
            channexPropertyId,
            channexRoomTypeId,
            form,
          },
        },
      );

      if (functionError)
        throw new Error(`Function Error: ${functionError.message}`);
      if (data?.error) throw new Error(data.error);

      return data.row;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createRatePlan, loading, error };
};
