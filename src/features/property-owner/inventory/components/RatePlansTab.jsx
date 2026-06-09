import React, { useState } from "react";
import { useRatePlans } from "../hooks/useRatePlans";
import { useRoomTypes } from "../hooks/useRoomTypes";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Edit2, Trash2, Tag, CreditCard, Layers } from "lucide-react";
import { AddRatePlanPanel } from "./AddRatePlanPanel";
import { handleSaveRatePlan } from "../utils/handleSaveRatePlan";
import { handleDeleteRatePlan } from "../utils/handleDeleteRatePlan";

/**
 * RatePlansTab — manages rate plans for a given property.
 *
 * Mirrors RoomTypesTab.jsx structure exactly.
 *
 * Props:
 *  - propertyId        {string} Local Supabase property UUID
 *  - channexPropertyId {string} Channex property UUID
 */
export const RatePlansTab = ({ propertyId, channexPropertyId }) => {
  const { ratePlans, loading, createRatePlan, updateRatePlan, deleteRatePlan } = useRatePlans(propertyId, channexPropertyId);
  const { roomTypes } = useRoomTypes(propertyId, channexPropertyId);

  const [isPanelOpen, setIsPanelOpen]     = useState(false);
  const [ratePlanToEdit, setRatePlanToEdit] = useState(null);
  const [submitting, setSubmitting]       = useState(false);

  const handleEdit = (rp) => {
    setRatePlanToEdit(rp);
    setIsPanelOpen(true);
  };

  const handleAdd = () => {
    setRatePlanToEdit(null);
    setIsPanelOpen(true);
  };

  const handleClose = () => {
    setIsPanelOpen(false);
    setTimeout(() => setRatePlanToEdit(null), 300); // allow animation to finish
  };

  const handleSave = (form, localId) => handleSaveRatePlan({
    form,
    localId,
    ratePlans,
    roomTypes,
    createRatePlan,
    updateRatePlan,
    setSubmitting,
    handleClose,
  });

  const handleDelete = (rp) => handleDeleteRatePlan({
    rp,
    deleteRatePlan,
    setSubmitting,
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
        <span className="text-sm text-muted-foreground">Loading rate plans...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
          Rate Plans
        </p>
        <Button
          size="sm"
          onClick={handleAdd}
          className="h-8 bg-green-500/90 hover:bg-green-600 text-white shadow-sm shadow-green-500/20 text-xs px-3"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Rate Plan
        </Button>
      </div>

      {/* Empty state */}
      {ratePlans.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-8 flex flex-col items-center justify-center bg-muted/20 gap-2">
          <Tag className="w-8 h-8 text-muted-foreground/40 mb-1" />
          <p className="text-sm text-muted-foreground">No rate plans configured.</p>
          <p className="text-xs text-muted-foreground/60 text-center max-w-xs">
            Add at least one rate plan per room type before managing availability.
          </p>
        </div>
      )}

      {/* Rate Plan cards — mirrors RoomTypesTab card structure */}
      {ratePlans.map(rp => (
        <div key={rp.id} className="rounded-xl border border-border bg-white dark:bg-white/5 p-4 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-foreground/90">{rp.title}</h4>
                <span className="text-[10px] font-bold bg-green-100/70 dark:bg-green-500/15 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full border border-green-200/50">
                  {rp.currency}
                </span>
              </div>
              <p className="text-xs text-muted-foreground/70 mt-0.5 font-mono">
                Channex ID: {rp.channex_rate_plan_id}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(rp)}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(rp)}
                className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Metadata grid — same 2-col layout as RoomTypesTab */}
          <div className="grid grid-cols-2 gap-4 text-sm mt-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Room Type</p>
                <p className="font-medium text-sm">{rp.room_types?.title || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sell Mode</p>
                <p className="font-medium text-sm capitalize">{rp.sell_mode?.replace("_", " ") || "—"}</p>
              </div>
            </div>
          </div>
        </div>
      ))}

      <AddRatePlanPanel
        open={isPanelOpen}
        onClose={handleClose}
        ratePlanToEdit={ratePlanToEdit}
        onSave={handleSave}
        submitting={submitting}
        roomTypes={roomTypes}
      />
    </div>
  );
};
