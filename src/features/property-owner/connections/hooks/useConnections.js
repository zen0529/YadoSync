import { useState, useEffect, useCallback } from "react";
import { getMyProperty, getConnections } from "../queries";

/** Fetch the current user's property */
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
