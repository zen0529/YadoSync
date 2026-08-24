import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getRoomTypesByProperty } from "../supabase/getRoomTypes";
import { uploadPhotos } from "@/utils/uploadPhotos";
import { supabase } from "@/lib/supabase";
import { useCreateRoomType } from "./useCreateRoomType";
import { useUpdateRoomType } from "./useUpdateRoomType";
import { useDeleteRoomType } from "./useDeleteRoomType";

/**
 * useRoomTypes — manages room type state for a given property.
 *
 * Loads room types from Supabase (source of truth for the UI).
 * All mutations go to Channex first, then mirror to Supabase.
 *
 * @param {string|null} propertyId          - Local Supabase property UUID
 * @param {string|null} channexPropertyId   - Channex property UUID
 * @param {Array}       initialRoomTypes     - Pre-fetched room types (skips first load when provided)
 */
export const useRoomTypes = (propertyId, channexPropertyId, initialRoomTypes) => {
  const [roomTypes, setRoomTypes] = useState(initialRoomTypes ?? []);
  const [loading, setLoading] = useState(false);

  const { createRoomType: createViaEdge } = useCreateRoomType();
  const { updateRoomType: updateViaEdge } = useUpdateRoomType();
  const { deleteRoomType: deleteViaEdge } = useDeleteRoomType();

  /* ── Load ──────────────────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const rows = await getRoomTypesByProperty(propertyId);
      setRoomTypes(rows);
    } catch (err) {
      toast.error("Failed to load room types", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    // Skip the initial fetch if the parent already supplied room types.
    if (initialRoomTypes && initialRoomTypes.length > 0) return;
    load();
  }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Create ────────────────────────────────────────────────────────────── */
  const createRoomType = async (form) => {
    if (!channexPropertyId) throw new Error("No Channex property ID available.");

    let processedForm = { ...form };
    if (form.content?.photos?.length > 0) {
      const uploadedPhotos = await uploadPhotos(form.content.photos);
      processedForm.content.photos = uploadedPhotos;
    }

    const row = await createViaEdge({
      propertyId,
      channexPropertyId,
      form: processedForm,
    });

    setRoomTypes(prev => [...prev, row]);
    return row;
  };

  /* ── Update ────────────────────────────────────────────────────────────── */
  const updateRoomType = async (localId, channexId, form) => {
    let processedForm = { ...form };
    if (form.content?.photos?.length > 0) {
      const uploadedPhotos = await uploadPhotos(form.content.photos);
      processedForm.content.photos = uploadedPhotos;
    }

    const row = await updateViaEdge(localId, channexId, propertyId, processedForm);

    setRoomTypes(prev => prev.map(rt => rt.id === localId ? row : rt));
    return row;
  };

  /* ── Delete ────────────────────────────────────────────────────────────── */
  const deleteRoomType = async (localId, channexId) => {
    const rtToRestore = roomTypes.find(rt => rt.id === localId);
    let restoringData = null;
    
    if (rtToRestore && channexPropertyId) {
      restoringData = {
         channexPropertyId: channexPropertyId,
         title: rtToRestore.title,
         count_of_rooms: rtToRestore.count_of_rooms,
         occ_adults: rtToRestore.occ_adults,
         occ_children: rtToRestore.occ_children,
         occ_infants: rtToRestore.occ_infants,
         default_occupancy: rtToRestore.default_occupancy,
         capacity: rtToRestore.capacity,
         room_kind: rtToRestore.room_kind,
         content_description: rtToRestore.content_description
      };
    }

    try {
      await deleteViaEdge(localId, channexId, propertyId, restoringData);
    } catch (error) {
      if (error.cause?.newChannexId) {
        setRoomTypes(prev => prev.map(rt => rt.id === localId ? { ...rt, channex_room_type_id: error.cause.newChannexId } : rt));
      }
      throw error; 
    }

    // Update local state
    setRoomTypes(prev => prev.filter(rt => rt.id !== localId));
  };

  return {
    roomTypes,
    loading,
    refetch: load,
    createRoomType,
    updateRoomType,
    deleteRoomType,
  };
};
