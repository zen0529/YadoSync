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

      if (functionError) {
        console.error("[useUpdateRoomType] function error:", functionError);
        throw new Error("Something went wrong while updating the room type. Please try again.");
      }

      return data.row;
    } catch (err) {
      console.error("[useUpdateRoomType] updateRoomType failed:", err);
      const message = "Something went wrong while updating the room type. Please try again.";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return { updateRoomType, loading, error };
};
