import { useState } from "react";
import { supabase } from "@/lib/supabase";

export const useCreateRoomType = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createRoomType = async ({ propertyId, channexPropertyId, form }) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: functionError } = await supabase.functions.invoke("createRoomType", {
        body: { propertyId, channexPropertyId, form },
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

  return { createRoomType, loading, error };
};
