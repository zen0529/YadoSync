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

      if (functionError) {
        console.error("[useCreateRoomType] function error:", functionError);
        throw new Error("Something went wrong while creating the room type. Please try again.");
      }

      return data.row;
    } catch (err) {
      console.error("[useCreateRoomType] createRoomType failed:", err);
      const message = "Something went wrong while creating the room type. Please try again.";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return { createRoomType, loading, error };
};
