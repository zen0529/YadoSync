import React, { useState } from "react";
import { useRoomTypes } from "../hooks/useRoomTypes";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Edit2, Trash2, Users, BedDouble } from "lucide-react";
import { AddRoomTypePanel } from "./AddRoomTypePanel";
import { handleSaveRoomType } from "../utils/handleSaveRoomType";
import { handleDeleteRoomType } from "../utils/handleDeleteRoomType";
import { getRoomTypeById } from "../supabase/getRoomType";

export const RoomTypesTab = ({ propertyId, channexPropertyId }) => {
  const { roomTypes, loading, createRoomType, updateRoomType, deleteRoomType } = useRoomTypes(propertyId, channexPropertyId);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [roomTypeToEdit, setRoomTypeToEdit] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingId, setFetchingId] = useState(null);

  const handleEdit = async (rt) => {
    setFetchingId(rt.id);
    setRoomTypeToEdit(null); // clear stale data
    setIsPanelOpen(true);   // open panel (shows spinner via editLoading)
    try {
      const freshData = await getRoomTypeById(rt.id);
      setRoomTypeToEdit(freshData); // now populate with photos included
    } catch (error) {
      console.error("Failed to fetch fresh room type data:", error);
    } finally {
      setFetchingId(null);
    }
  };

  const handleAdd = () => {
    setRoomTypeToEdit(null);
    setIsPanelOpen(true);
  };

  const handleClose = () => {
    setIsPanelOpen(false);
    setTimeout(() => setRoomTypeToEdit(null), 300); // allow animation to finish
  };

  const handleSave = (formData, localId) => handleSaveRoomType({
    formData,
    localId,
    roomTypes,
    createRoomType,
    updateRoomType,
    setSubmitting,
    handleClose,
  });

  const handleDelete = (rt) => handleDeleteRoomType({
    rt,
    deleteRoomType,
    setSubmitting,
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
        <span className="text-sm text-muted-foreground">Loading room types...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
          Property Room Types
        </p>
        <Button
          size="sm"
          onClick={handleAdd}
          className="h-8 bg-green-500/90 hover:bg-green-600 text-white shadow-sm shadow-green-500/20 text-xs px-3"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Room Type
        </Button>
      </div>

      {roomTypes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-8 flex flex-col items-center justify-center bg-muted/20">
          <BedDouble className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No room types configured.</p>
        </div>
      ) : null}

      {roomTypes.map(rt => (
        <div key={rt.id} className="rounded-xl border border-black/10 bg-white dark:bg-white/5 p-4 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground/90">{rt.title}</h4>
                <span className="text-[10px] font-medium bg-neutral-100 dark:bg-white/10 px-2 py-0.5 rounded capitalize">
                  {rt.room_kind || "Room"}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(rt)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(rt)} className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mt-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center shrink-0">
                <BedDouble className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Rooms</p>
                <p className="font-medium">{rt.count_of_rooms}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Adults</p>
                <p className="font-medium">{rt.occ_adults}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Children</p>
                <p className="font-medium">{rt.occ_children}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Infants</p>
                <p className="font-medium">{rt.occ_infants}</p>
              </div>
            </div>
          </div>
        </div>
      ))}

      <AddRoomTypePanel
        open={isPanelOpen}
        onClose={handleClose}
        roomTypeToEdit={roomTypeToEdit}
        onSave={handleSave}
        submitting={submitting}
        editLoading={!!fetchingId}
      />


    </div>
  );
};
