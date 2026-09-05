import { useState, useEffect, useCallback } from "react";
import { getMyProperty, getConnections } from "../supabase";
import { getRatePlansByProperty } from "@/features/property-owner/roomAndRates/supabase/getRatePlans";
import { getRoomTypesByProperty } from "@/features/property-owner/roomAndRates/supabase/getRoomTypes";

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

export const useRatePlansForMapping = (propertyId) => {
  const [roomTypes, setRoomTypes] = useState([]);
  const [ratePlans, setRatePlans] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!propertyId) return;
    setLoading(true);
    Promise.all([
      getRoomTypesByProperty(propertyId),
      getRatePlansByProperty(propertyId),
    ])
      .then(([rt, rp]) => {
        setRoomTypes(rt || []);
        setRatePlans(rp || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [propertyId]);

  return { roomTypes, ratePlans, loading };
};

