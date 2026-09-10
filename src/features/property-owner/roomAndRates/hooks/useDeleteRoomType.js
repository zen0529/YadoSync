import { useState } from "react";
import { supabase } from "@/lib/supabase";

export const useDeleteRoomType = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deleteRoomType = async (localId, channexRoomTypeId, propertyId, restoringData) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: functionError } = await supabase.functions.invoke("deleteRoomType", {
        body: { localId, channexRoomTypeId, propertyId, restoringData },
      });

      if (functionError) {
        console.error("[useDeleteRoomType] function error:", functionError);
        throw new Error("Something went wrong while deleting the room type. Please try again.");
      }
      if (data?.error) {
        console.error("[useDeleteRoomType] edge function error:", data.error);
        const message = "Something went wrong while deleting the room type. Please try again.";
        if (data.newChannexId) {
          throw new Error(message, { cause: { newChannexId: data.newChannexId } });
        }
        throw new Error(message);
      }

      return true;
    } catch (err) {
      console.error("[useDeleteRoomType] deleteRoomType failed:", err);
      const message = "Something went wrong while deleting the room type. Please try again.";
      setError(message);
      throw err; // re-throw so callers can read err.cause.newChannexId if present
    } finally {
      setLoading(false);
    }
  };

  return { deleteRoomType, loading, error };
};
