import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getRatePlansByProperty } from "../supabase/getRatePlans";
import { useCreateRatePlan } from "./useCreateRatePlan";
import { useUpdateRatePlan } from "./useUpdateRatePlan";
import { useDeleteRatePlan } from "./useDeleteRatePlan";

/**
 * useRatePlans — manages rate plan state for a given property.
 *
 * Loads rate plans from Supabase (source of truth for the UI).
 * All mutations go to Channex first, then mirror to Supabase.
 *
 * @param {string|null} propertyId          - Local Supabase property UUID
 * @param {string|null} channexPropertyId   - Channex property UUID
 */
export const useRatePlans = (propertyId, channexPropertyId) => {
  const [ratePlans, setRatePlans] = useState([]);
  const [loading, setLoading] = useState(false);

  const { createRatePlan: createViaEdge } = useCreateRatePlan();
  const { updateRatePlan: updateViaEdge } = useUpdateRatePlan();
  const { deleteRatePlan: deleteViaEdge } = useDeleteRatePlan();

  /* ── Load ──────────────────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const rows = await getRatePlansByProperty(propertyId);
      setRatePlans(rows);
    } catch (err) {
      toast.error("Failed to load rate plans", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    load();
  }, [load]);

  /* ── Create ────────────────────────────────────────────────────────────── */
  /**
   * @param {object} form           - Rate plan form values
   * @param {string} roomTypeId     - Local Supabase room_type UUID
   * @param {string} channexRoomTypeId - Channex room type UUID
   */
  const createRatePlan = async (form, roomTypeId, channexRoomTypeId) => {
    if (!channexPropertyId) throw new Error("No Channex property ID available.");
    if (!channexRoomTypeId) throw new Error("No Channex room type ID available.");

    try {
      // Create via Edge Function (handles Channex + Supabase + Rollback atomically)
      const row = await createViaEdge({
        propertyId,
        roomTypeId,
        channexPropertyId,
        channexRoomTypeId,
        form,
      });

      // Update local state
      setRatePlans(prev => [...prev, row]);
      return row;
    } catch (error) {
      throw error;
    }
  };

  /* ── Update ────────────────────────────────────────────────────────────── */
  const updateRatePlan = async (localId, channexRatePlanId, form) => {
    // Call Edge Function
    const row = await updateViaEdge(localId, channexRatePlanId, form);

    // Update local state
    setRatePlans(prev => prev.map(rp => rp.id === localId ? row : rp));
    return row;
  };

  /* ── Delete ────────────────────────────────────────────────────────────── */
  const deleteRatePlan = async (localId, channexRatePlanId) => {
    await deleteViaEdge(localId, channexRatePlanId);
    // Update local state
    setRatePlans(prev => prev.filter(rp => rp.id !== localId));
  };

  return {
    ratePlans,
    loading,
    refetch: load,
    createRatePlan,
    updateRatePlan,
    deleteRatePlan,
  };
};
