import React, { useState, useMemo, useEffect } from "react";
import { useRoomTypes } from "../hooks/useRoomTypes";
import { useGetRatePlans } from "../hooks/useGetRatePlans";
import { useCreateRatePlan } from "../hooks/useCreateRatePlan";
import { useUpdateRatePlan } from "../hooks/useUpdateRatePlan";
import { useDeleteRatePlan } from "../hooks/useDeleteRatePlan";
import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Users,
  BedDouble,
  Tag,
  ChevronDown,
  CreditCard,
  ChevronsDownUp,
  ChevronsUpDown,
  CalendarDays,
} from "lucide-react";
import { AddRoomTypePanel } from "./AddRoomTypePanel";
import { AddRatePlanPanel } from "./AddRatePlanPanel";
import { handleSaveRoomType } from "../utils/handleSaveRoomType";
import { handleDeleteRoomType } from "../utils/handleDeleteRoomType";
import { handleSaveRatePlan } from "../utils/handleSaveRatePlan";
import { handleDeleteRatePlan } from "../utils/handleDeleteRatePlan";
import { getRoomTypeById } from "../supabase/getRoomType";

export const RoomTypesTab = ({
  propertyId,
  channexPropertyId,
  initialRoomTypes,
  onOpenARIEditor,
  onRoomTypesLoaded,
  onRatePlansLoaded,
}) => {
  /* ── Room type state ─────────────────────────────────────────────────── */
  const {
    roomTypes,
    loading: rtLoading,
    createRoomType,
    updateRoomType,
    deleteRoomType,
  } = useRoomTypes(propertyId, channexPropertyId, initialRoomTypes);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [roomTypeToEdit, setRoomTypeToEdit] = useState(null);
  const [rtSubmitting, setRtSubmitting] = useState(false);
  const [fetchingId, setFetchingId] = useState(null);

  /* ── Rate plan state ─────────────────────────────────────────────────── */
  const { ratePlans, loading: rpLoading } = useGetRatePlans(propertyId);
  const { createRatePlan } = useCreateRatePlan();
  const { updateRatePlan } = useUpdateRatePlan();
  const { deleteRatePlan } = useDeleteRatePlan();

  const [isRpPanelOpen, setIsRpPanelOpen] = useState(false);
  const [ratePlanToEdit, setRatePlanToEdit] = useState(null);
  const [rpSubmitting, setRpSubmitting] = useState(false);
  const [defaultRoomTypeId, setDefaultRoomTypeId] = useState(null);

  /* ── Delete dialog state ─────────────────────────────────────────── */
  const [deleteRtTarget, setDeleteRtTarget] = useState(null); // rt object to delete
  const [deleteRpTarget, setDeleteRpTarget] = useState(null); // rp object to delete

  /* ── Lift loaded data to parent (InventoryPage holds it for ARIEditorPanel) ─ */
  useEffect(() => {
    if (onRoomTypesLoaded) onRoomTypesLoaded(roomTypes);
  }, [roomTypes]); // eslint-disable-line

  useEffect(() => {
    if (onRatePlansLoaded) onRatePlansLoaded(ratePlans);
  }, [ratePlans]); // eslint-disable-line

  /* ── Expand / collapse state ─────────────────────────────────────────── */
  const [expandedIds, setExpandedIds] = useState(new Set());

  const allExpanded =
    roomTypes.length > 0 && expandedIds.size === roomTypes.length;

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(roomTypes.map((rt) => rt.id)));
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /* ── Rate plans indexed by room type ─────────────────────────────────── */
  const ratePlansByRoomType = useMemo(() => {
    const map = {};
    for (const rp of ratePlans) {
      if (!map[rp.room_type_id]) map[rp.room_type_id] = [];
      map[rp.room_type_id].push(rp);
    }
    return map;
  }, [ratePlans]);

  /* ── Room type handlers ──────────────────────────────────────────────── */
  const handleEditRt = async (rt) => {
    setFetchingId(rt.id);
    setRoomTypeToEdit(null);
    setIsPanelOpen(true);
    try {
      const freshData = await getRoomTypeById(rt.id);
      setRoomTypeToEdit(freshData);
    } catch (error) {
      console.error("Failed to fetch fresh room type data:", error);
    } finally {
      setFetchingId(null);
    }
  };

  const handleAddRt = () => {
    setRoomTypeToEdit(null);
    setIsPanelOpen(true);
  };

  const handleCloseRt = () => {
    setIsPanelOpen(false);
    setTimeout(() => setRoomTypeToEdit(null), 300);
  };

  const handleSaveRt = (formData, localId) =>
    handleSaveRoomType({
      formData,
      localId,
      roomTypes,
      createRoomType,
      updateRoomType,
      setSubmitting: setRtSubmitting,
      handleClose: handleCloseRt,
    });

  const handleDeleteRt = (rt) => setDeleteRtTarget(rt);

  const handleConfirmDeleteRt = () =>
    handleDeleteRoomType({
      rt: deleteRtTarget,
      deleteRoomType,
      setSubmitting: setRtSubmitting,
    }).finally(() => setDeleteRtTarget(null));

  /* ── Rate plan handlers ──────────────────────────────────────────────── */
  const handleAddRp = (roomTypeId) => {
    setRatePlanToEdit(null);
    setDefaultRoomTypeId(roomTypeId);
    setIsRpPanelOpen(true);
    // Auto-expand so user sees the new plan appear
    setExpandedIds((prev) => new Set([...prev, roomTypeId]));
  };

  const handleEditRp = (rp) => {
    setRatePlanToEdit(rp);
    setDefaultRoomTypeId(null);
    setIsRpPanelOpen(true);
  };

  const handleCloseRp = () => {
    setIsRpPanelOpen(false);
    setTimeout(() => {
      setRatePlanToEdit(null);
      setDefaultRoomTypeId(null);
    }, 300);
  };

  const handleSaveRp = (form, localId, roomTypeId) =>
    handleSaveRatePlan({
      form,
      localId,
      roomTypeId,
      ratePlans,
      roomTypes,
      propertyId,
      channexPropertyId,
      createRatePlan,
      updateRatePlan,
      setSubmitting: setRpSubmitting,
      handleClose: handleCloseRp,
    });

  const handleDeleteRp = (rp) => setDeleteRpTarget(rp);

  const handleConfirmDeleteRp = () =>
    handleDeleteRatePlan({
      rp: deleteRpTarget,
      deleteRatePlan,
      setSubmitting: setRpSubmitting,
    }).finally(() => setDeleteRpTarget(null));

  /* ── Loading ─────────────────────────────────────────────────────────── */
  if (rtLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
        <span className="text-sm text-muted-foreground">
          Loading room types...
        </span>
      </div>
    );
  }

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-4 border border-black">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
          Property Room Types
        </p>
        <div className="flex items-center gap-2">
          {roomTypes.length > 0 && (
            <button
              onClick={toggleExpandAll}
              className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border border-border/60 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
              title={
                allExpanded
                  ? "Collapse all rate plans"
                  : "Expand all rate plans"
              }
            >
              {allExpanded ? (
                <ChevronsDownUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronsUpDown className="w-3.5 h-3.5" />
              )}
              {allExpanded ? "Collapse All" : "Expand All"}
            </button>
          )}
          <Button
            size="sm"
            onClick={handleAddRt}
            className="h-8 bg-green-500/90 hover:bg-green-600 text-white shadow-sm shadow-green-500/20 text-xs px-3"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Room Type
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {roomTypes.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-8 flex flex-col items-center justify-center bg-muted/20">
          <BedDouble className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            No room types configured.
          </p>
        </div>
      )}

      {/* Room type cards */}
      {roomTypes.map((rt) => {
        const isExpanded = expandedIds.has(rt.id);
        const plans = ratePlansByRoomType[rt.id] || [];

        return (
          <div
            key={rt.id}
            className="rounded-xl border border-black/10 bg-white dark:bg-white/5 overflow-hidden"
          >
            {/* Card body */}
            <div className="p-4 flex flex-col gap-3">
              {/* Title row */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-foreground/90">
                      {rt.title}
                    </h4>
                    <span className="text-[10px] font-medium bg-neutral-100 dark:bg-white/10 px-2 py-0.5 rounded capitalize">
                      {rt.room_kind || "Room"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {/* Add Rate Plan */}
                  <button
                    onClick={() => handleAddRp(rt.id)}
                    className="p-1.5 rounded hover:bg-green-500/10 text-muted-foreground hover:text-green-500 transition-colors"
                    title="Add rate plan"
                  >
                    <Tag className="w-4 h-4" />
                  </button>
                  {/* Edit Room Type */}
                  <button
                    onClick={() => handleEditRt(rt)}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit room type"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {/* Delete Room Type */}
                  <button
                    onClick={() => handleDeleteRt(rt)}
                    className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                    title="Delete room type"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
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

            {/* Rate plans toggle bar */}
            <button
              onClick={() => toggleExpand(rt.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold border-t transition-colors
                ${
                  isExpanded
                    ? "border-green-500/20 bg-green-500/5 text-green-600 dark:text-green-400"
                    : "border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                }`}
            >
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" />
                <span>Rate Plans</span>
                {rpLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin opacity-60" />
                ) : (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold
                    ${
                      isExpanded
                        ? "bg-green-500/15 text-green-600 dark:text-green-400"
                        : "bg-black/5 dark:bg-white/10 text-muted-foreground"
                    }`}
                  >
                    {plans.length}
                  </span>
                )}
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
              />
            </button>

            {/* Expandable rate plans section */}
            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                maxHeight: isExpanded ? "320px" : "0px",
              }}
            >
              <div className="flex flex-col bg-black/[0.015] dark:bg-white/[0.015]">
                {/* Scrollable plans list — max 3 visible (~3 × 52px + padding) */}
                <div
                  className="overflow-y-auto px-4 pt-3 space-y-2"
                  style={{ maxHeight: "180px" }}
                >
                  {plans.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      No rate plans yet.
                    </p>
                  )}
                  {plans.map((rp) => (
                    <div
                      key={rp.id}
                      className="flex items-center justify-between rounded-lg border border-black/5 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-green-100 dark:bg-green-500/20 flex items-center justify-center shrink-0">
                          <CreditCard className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground/90 truncate">
                            {rp.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60 capitalize">
                            {rp.currency} ·{" "}
                            {rp.sell_mode?.replace("_", " ") || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() =>
                            onOpenARIEditor &&
                            onOpenARIEditor({
                              roomTypes,
                              ratePlans,
                              defaultRoomTypeId: rp.room_type_id,
                              defaultRatePlanId: rp.id,
                            })
                          }
                          className="p-1.5 rounded hover:bg-blue-500/10 text-muted-foreground hover:text-blue-500 transition-colors"
                          title="Set prices for this rate plan"
                        >
                          <CalendarDays className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEditRp(rp)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit rate plan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRp(rp)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                          title="Delete rate plan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Always-visible Add Rate Plan button */}
                <div className="px-4 py-2.5 border-t border-black/5 dark:border-white/10">
                  <button
                    onClick={() => handleAddRp(rt.id)}
                    className="flex items-center gap-1.5 text-xs text-green-500 hover:text-green-600 font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Rate Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Room type slide-over panel */}
      <AddRoomTypePanel
        open={isPanelOpen}
        onClose={handleCloseRt}
        roomTypeToEdit={roomTypeToEdit}
        onSave={handleSaveRt}
        submitting={rtSubmitting}
        editLoading={!!fetchingId}
      />

      {/* Rate plan slide-over panel */}
      <AddRatePlanPanel
        open={isRpPanelOpen}
        onClose={handleCloseRp}
        ratePlanToEdit={ratePlanToEdit}
        onSave={handleSaveRp}
        submitting={rpSubmitting}
        roomTypes={roomTypes}
        defaultRoomTypeId={defaultRoomTypeId}
      />

      {/* Delete room-type confirmation dialog */}
      <DeleteDialog
        open={!!deleteRtTarget}
        onOpenChange={(open) => !open && setDeleteRtTarget(null)}
        title="Delete Room Type"
        description={
          deleteRtTarget
            ? `Are you sure you want to delete "${deleteRtTarget.title}"? This action cannot be undone.`
            : undefined
        }
        loading={rtSubmitting}
        onConfirm={handleConfirmDeleteRt}
      />

      {/* Delete rate-plan confirmation dialog */}
      <DeleteDialog
        open={!!deleteRpTarget}
        onOpenChange={(open) => !open && setDeleteRpTarget(null)}
        title="Delete Rate Plan"
        description={
          deleteRpTarget
            ? `Are you sure you want to delete "${deleteRpTarget.title}"? This action cannot be undone.`
            : undefined
        }
        loading={rpSubmitting}
        onConfirm={handleConfirmDeleteRp}
      />
    </div>
  );
};
