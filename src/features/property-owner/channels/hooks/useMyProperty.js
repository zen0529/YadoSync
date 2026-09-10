import { useState, useEffect } from "react";
import { getMyProperty } from "../supabase";

/** Fetch the current user's property (id + channex_property_id) */
export const useMyProperty = (userId) => {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getMyProperty(userId)
      .then(setProperty)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  return { property, loading };
};
