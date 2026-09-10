import { useState, useEffect, useCallback } from "react";
import { getConnections } from "../supabase";

/** Fetch all platform connections for a property, with a refetch callback */
export const useConnections = (propertyId) => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const data = await getConnections(propertyId);
      setConnections(data);
    } catch (err) {
      console.error("Failed to load connections:", err);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { connections, loading, refetch };
};
