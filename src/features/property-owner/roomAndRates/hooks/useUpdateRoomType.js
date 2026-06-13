import { useState } from "react";
import { supabase } from "@/lib/supabase";

export const useUpdateRoomType = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateRoomType = async (localId, channexRoomTypeId, propertyId, form) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: functionError } = await supabase.functions.invoke("updateRoomType", {
        body: { localId, channexRoomTypeId, propertyId, form },
      });

      if (functionError) throw new Error(`Function Error: ${functionError.message}`);
      if (data?.error) throw new Error(data.error);

      return data.row;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateRoomType, loading, error };
};
