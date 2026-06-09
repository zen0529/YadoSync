import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/context/AuthContext";
import { toast } from "sonner";

/**
 * Hook to fetch a property owner's inventory (room types) from Supabase.
 */
export const useInventory = () => {
  const { user } = useAuth();
  const [roomTypes, setRoomTypes] = useState([]);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;

  const loadInventory = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // 1. Get the owner's property
      const { data: propData, error: propError } = await supabase
        .from("properties")
        .select("id, name, channex_property_id")
        .eq("user_id", userId)
        .single();
        
      if (propError && propError.code !== 'PGRST116') { // Ignore "no rows returned" error
        throw new Error(`Failed to fetch property: ${propError.message}`);
      }

      if (propData) {
        setProperty(propData);
        
        // 2. Get room types for this property
        const { data: roomsData, error: roomsError } = await supabase
          .from("room_types")
          .select("*")
          .eq("property_id", propData.id)
          .order("created_at", { ascending: true });
          
        if (roomsError) {
          throw new Error(`Failed to fetch room types: ${roomsError.message}`);
        }
        
        setRoomTypes(roomsData || []);
      }
    } catch (err) {
      console.error("[DEBUG] useInventory error:", err);
      toast.error("Failed to load inventory", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  return {
    property,
    roomTypes,
    loading,
    refetch: loadInventory
  };
};
