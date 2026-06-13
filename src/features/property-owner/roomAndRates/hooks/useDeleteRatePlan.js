import { useState } from "react";
import { supabase } from "@/lib/supabase";

export const useDeleteRatePlan = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deleteRatePlan = async (localId, channexRatePlanId) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: functionError } = await supabase.functions.invoke("deleteRatePlan", {
        body: { localId, channexRatePlanId },
      });

      if (functionError) throw new Error(`Function Error: ${functionError.message}`);
      if (data?.error) throw new Error(data.error);

      return true;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { deleteRatePlan, loading, error };
};
