import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/context/AuthContext";

const PropertyContext = createContext(null);

const STORAGE_KEY = "yadosync_active_property_id";

/**
 * PropertyProvider — Provides global active property state for property owner features.
 * Caches all owner properties via TanStack Query and synchronizes active selection.
 */
export const PropertyProvider = ({ children }) => {
  const { user } = useAuth();

  const [selectedPropertyId, setSelectedPropertyIdState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  const {
    data: properties = [],
    isLoading,
    isFetching,
    refetch: refetchProperties,
  } = useQuery({
    queryKey: ["owner-properties", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("properties")
        .select("id, name, location, channex_property_id, status, commission_rate, currency")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
  });

  // Sync selectedPropertyId when properties load
  useEffect(() => {
    if (properties.length > 0) {
      const exists = properties.some((p) => p.id === selectedPropertyId);
      if (!selectedPropertyId || !exists) {
        const firstId = properties[0].id;
        setSelectedPropertyIdState(firstId);
        try {
          localStorage.setItem(STORAGE_KEY, firstId);
        } catch {}
      }
    } else if (!isLoading && properties.length === 0) {
      setSelectedPropertyIdState(null);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }, [properties, selectedPropertyId, isLoading]);

  const setSelectedPropertyId = (id) => {
    setSelectedPropertyIdState(id);
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEY, id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  };

  const selectedProperty = useMemo(() => {
    if (!properties.length) return null;
    return properties.find((p) => p.id === selectedPropertyId) || properties[0] || null;
  }, [properties, selectedPropertyId]);

  const value = useMemo(
    () => ({
      properties,
      selectedProperty,
      selectedPropertyId: selectedProperty?.id || null,
      setSelectedPropertyId,
      isLoading,
      isFetching,
      refetchProperties,
    }),
    [properties, selectedProperty, isLoading, isFetching],
  );

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
};

export const usePropertyContext = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error("usePropertyContext must be used within a PropertyProvider");
  }
  return context;
};

export const useActiveProperty = usePropertyContext;
