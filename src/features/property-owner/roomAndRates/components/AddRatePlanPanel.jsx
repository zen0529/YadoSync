import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Tag,
  X,
  Loader2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddTaxSetPanel } from "./AddTaxSetPanel";
import { AddCancellationPolicyPanel } from "./AddCancellationPolicyPanel";
import { getRatePlansByRoomType } from "../supabase/getRatePlans";

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const DEFAULT_INHERIT = {
  rate: true,
  min_stay_arrival: false,
  min_stay_through: true,
  max_stay: true,
  closed_to_arrival: true,
  closed_to_departure: true,
  stop_sell: true,
};

const makeDayMap = () => ({
  Mo: false,
  Tu: false,
  We: false,
  Th: false,
  Fr: false,
  Sa: false,
  Su: false,
});

const makeDefaultRestrictions = () => ({
  min_stay_arrival: 1,
  min_stay_through: 1,
  max_stay: 0,
  closed_to_arrival: makeDayMap(),
  closed_to_departure: makeDayMap(),
  stop_sell: makeDayMap(),
});

const DEFAULT_FORM = {
  title: "",
  occupancy: 1,
  primary: true,
  rate: 0,
};

// ─── CascadingRatePlanDropdown ────────────────────────────────────────────────
// Props:
//   roomTypes       – array of room type objects
//   excludeId       – rate plan id to exclude (the plan being edited)
//   selectedMeta    – { id, title, options, roomTypeTitle } of the currently selected plan
//   onSelect        – (id, planRow, roomTypeTitle) => void
//   onClear         – () => void
//   disabled        – bool
function CascadingRatePlanDropdown({
  roomTypes,
  excludeId,
  selectedMeta,
  onSelect,
  onClear,
  disabled,
}) {
  const [open, setOpen] = useState(false);
  const [hoveredRtId, setHoveredRtId] = useState(null);
  const ref = useRef(null);

  // Auto-highlight first room type when opened
  useEffect(() => {
    if (open && roomTypes.length > 0) {
      setHoveredRtId(roomTypes[0].id);
    }
    if (!open) setHoveredRtId(null);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Lazy fetch: only fires when a room type is hovered ──────────────────────
  const { data: plansForHovered = [], isFetching: fetchingPlans } = useQuery({
    queryKey: ["ratePlansByRoomType", hoveredRtId],
    queryFn: () => getRatePlansByRoomType(hoveredRtId),
    enabled: !!hoveredRtId,
    staleTime: 60_000, // keep fresh for 1 min so hover flicker doesn't re-fetch
  });

  // Filter out the plan being edited
  const visiblePlans = excludeId
    ? plansForHovered.filter((rp) => rp.id !== excludeId)
    : plansForHovered;

  const selectedLabel = selectedMeta
    ? `${selectedMeta.roomTypeTitle} / ${selectedMeta.title} (${selectedMeta.options?.length ?? 0})`
    : "";

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <div
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`flex items-center justify-between w-full rounded-lg border border-white/10 bg-white/40 dark:bg-white/5 px-3 py-2 text-sm cursor-pointer transition-all
          ${open ? "ring-2 ring-green-500/50 border-green-500/30" : "hover:border-white/20 dark:hover:border-white/20"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span
          className={
            selectedLabel ? "text-foreground" : "text-muted-foreground"
          }
        >
          {selectedLabel || "Select a parent rate plan…"}
        </span>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {selectedMeta && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {/* Two-panel dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 flex rounded-lg border border-black/5 dark:border-white/10 bg-background dark:bg-[#1e293b] shadow-2xl overflow-hidden">
          {/* Left — Room Types */}
          <div className="w-[145px] shrink-0 border-r border-black/5 dark:border-white/10 py-1 overflow-y-auto max-h-[220px]">
            {roomTypes.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground italic">
                No room types
              </p>
            ) : (
              roomTypes.map((rt) => {
                const isActive = hoveredRtId === rt.id;
                return (
                  <div
                    key={rt.id}
                    onMouseEnter={() => setHoveredRtId(rt.id)}
                    onClick={() => setHoveredRtId(rt.id)}
                    className={`flex items-center justify-between px-3 py-2 cursor-pointer select-none transition-colors text-sm
                      ${
                        isActive
                          ? "bg-green-500/10 text-foreground font-semibold"
                          : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
                      }`}
                  >
                    <span className="truncate">{rt.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 ml-1 opacity-50" />
                  </div>
                );
              })
            )}
          </div>

          {/* Right — Rate Plans (lazy loaded) */}
          <div className="flex-1 py-1 overflow-y-auto max-h-[220px]">
            {fetchingPlans ? (
              <div className="flex items-center justify-center h-10">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : visiblePlans.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground italic">
                No rate plans
              </p>
            ) : (
              visiblePlans.map((rp) => {
                const isSelected = rp.id === selectedMeta?.id;
                const rtTitle =
                  roomTypes.find((rt) => rt.id === hoveredRtId)?.title ?? "";
                return (
                  <div
                    key={rp.id}
                    onClick={() => {
                      onSelect(rp.id, rp, rtTitle);
                      setOpen(false);
                    }}
                    className={`px-3 py-2 cursor-pointer select-none transition-colors text-sm
                      ${
                        isSelected
                          ? "bg-green-500/10 text-green-400 font-semibold"
                          : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
                      }`}
                  >
                    {rp.title} ({rp.options?.length ?? 0})
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DayCheckboxRow ───────────────────────────────────────────────────────────
function DayCheckboxRow({ label, value, onChange, disabled }) {
  return (
    <div
      className={`flex items-start gap-3 transition-opacity ${disabled ? "opacity-40" : ""}`}
    >
      <span className="text-sm text-muted-foreground shrink-0 w-[140px] text-right pt-0.5">
        {label}:
      </span>
      <div className="flex items-center gap-3 flex-wrap">
        {DAYS.map((day) => (
          <label
            key={day}
            className={`flex items-center gap-1.5 select-none group ${
              disabled
                ? "cursor-not-allowed pointer-events-none"
                : "cursor-pointer"
            }`}
          >
            <input
              type="checkbox"
              disabled={disabled}
              checked={value[day] ?? false}
              onChange={(e) => onChange({ ...value, [day]: e.target.checked })}
              className="w-3.5 h-3.5 accent-green-500 cursor-pointer disabled:cursor-not-allowed"
            />
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              {day}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export const AddRatePlanPanel = ({
  open,
  onClose,
  ratePlanToEdit,
  onSave,
  submitting,
  roomTypes = [],
  ratePlans = [],
  defaultRoomTypeId = null,
  channexPropertyId = null,
}) => {
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [roomTypeId, setRoomTypeId] = useState("");

  // Rate Mode
  const [rateMode, setRateMode] = useState("manual");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [parentRatePlanId, setParentRatePlanId] = useState(null);
  const [selectedParentMeta, setSelectedParentMeta] = useState(null);
  const [inherit, setInherit] = useState({ ...DEFAULT_INHERIT });
  const [restrictions, setRestrictions] = useState(makeDefaultRestrictions());

  const [taxSetPanelOpen, setTaxSetPanelOpen] = useState(false);
  const [cancellationPanelOpen, setCancellationPanelOpen] = useState(false);

  // Populate / reset on open
  useEffect(() => {
    if (open && ratePlanToEdit) {
      const opt = ratePlanToEdit.options?.[0] ?? {};
      setRoomTypeId(ratePlanToEdit.room_type_id || "");
      setForm({
        title: ratePlanToEdit.title || "",
        occupancy: opt.occupancy ?? 1,
        primary: opt.is_primary ?? true,
        rate: opt.rate ?? 0,
      });
      setRateMode(ratePlanToEdit.rate_mode ?? "manual");
      setParentRatePlanId(ratePlanToEdit.parent_rate_plan_id ?? null);

      if (ratePlanToEdit.parent_rate_plan_id) {
        const parentPlan = ratePlans.find(
          (rp) => rp.id === ratePlanToEdit.parent_rate_plan_id,
        );
        const parentRt = parentPlan
          ? roomTypes.find((rt) => rt.id === parentPlan.room_type_id)
          : null;
        setSelectedParentMeta(
          parentPlan
            ? {
                id: parentPlan.id,
                title: parentPlan.title,
                options: parentPlan.options,
                roomTypeTitle: parentRt?.title ?? "",
              }
            : null,
        );
      } else {
        setSelectedParentMeta(null);
      }

      const inh = ratePlanToEdit.inherit_settings ?? {};
      setInherit({
        rate: inh.rate ?? false,
        min_stay_arrival: inh.min_stay_arrival ?? false,
        min_stay_through: inh.min_stay_through ?? false,
        max_stay: inh.max_stay ?? false,
        closed_to_arrival: inh.closed_to_arrival ?? false,
        closed_to_departure: inh.closed_to_departure ?? false,
        stop_sell: inh.stop_sell ?? false,
      });
      setRestrictions({
        min_stay_arrival: ratePlanToEdit.min_stay_arrival ?? 1,
        min_stay_through: ratePlanToEdit.min_stay_through ?? 1,
        max_stay: ratePlanToEdit.max_stay ?? 0,
        closed_to_arrival: makeDayMap(),
        closed_to_departure: makeDayMap(),
        stop_sell: makeDayMap(),
      });
      setShowAdvanced(false);
    } else if (open && !ratePlanToEdit) {
      setRoomTypeId(defaultRoomTypeId || "");
      setForm({ ...DEFAULT_FORM });
      setRateMode("manual");
      setShowAdvanced(false);
      setParentRatePlanId(null);
      setSelectedParentMeta(null);
      setInherit({ ...DEFAULT_INHERIT });
      setRestrictions(makeDefaultRestrictions());
    }
  }, [open, ratePlanToEdit, defaultRoomTypeId, ratePlans, roomTypes]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const noInherit = {
      rate: false,
      min_stay_arrival: false,
      min_stay_through: false,
      max_stay: false,
      closed_to_arrival: false,
      closed_to_departure: false,
      stop_sell: false,
    };
    onSave(
      {
        ...form,
        rateMode,
        parentRatePlanId: rateMode === "derived" ? parentRatePlanId : null,
        inherit: rateMode === "derived" ? inherit : noInherit,
        restrictions,
      },
      ratePlanToEdit?.id,
      roomTypeId,
    );
  };

  const isEditing = !!ratePlanToEdit;

  const inheritItems = [
    { key: "rate", label: "Rate" },
    { key: "min_stay_arrival", label: "Min Stay Arrival" },
    { key: "min_stay_through", label: "Min Stay Through" },
    { key: "max_stay", label: "Max Stay" },
    { key: "closed_to_arrival", label: "Closed To Arrival" },
    { key: "closed_to_departure", label: "Closed To Departure" },
    { key: "stop_sell", label: "Stop Sell" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[520px] flex flex-col bg-background/80 dark:bg-[#0F172A]/90 backdrop-blur-2xl border-l border-black/5 dark:border-white/10 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
              <Tag className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-tight">
                {isEditing ? "Edit Rate Plan" : "Add Rate Plan"}
              </h2>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                {isEditing
                  ? "Update pricing plan details"
                  : "Link a pricing plan to a room type"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form
          id="add-rate-plan-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          <div className="space-y-4">
            {/* ── Room Type ───────────────────────────────────────────────── */}
            <Field label="Room Type">
              <select
                value={roomTypeId}
                onChange={(e) => setRoomTypeId(e.target.value)}
                required
                disabled={isEditing}
                className="w-full rounded-lg border border-white/10 bg-white/40 dark:bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled>
                  Select a room type…
                </option>
                {roomTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.title}
                    {!rt.channex_room_type_id ? " (not synced)" : ""}
                  </option>
                ))}
              </select>
            </Field>

            {/* ── Title ──────────────────────────────────────────────────── */}
            <Field label="Plan Title">
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder='e.g. "Best Available Rate"'
                required
              />
            </Field>

            {/* ── SECTION: Rate Mode ──────────────────────────────────────── */}
            {/* <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mt-4 border-t border-black/5 dark:border-white/10 pt-4">
              Rate Mode
            </p> */}

            {/* Manual / Derived toggle buttons */}
            {/* <div className="flex rounded-lg overflow-hidden border border-white/10 dark:border-white/10 w-full">
              {["manual", "derived"].map((mode) => {
                const active = rateMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setRateMode(mode)}
                    className={`flex-1 py-2 text-sm font-medium capitalize transition-all duration-150 focus:outline-none
                      ${active
                        ? "bg-green-500/10 text-green-400 ring-inset ring-1 ring-green-500/40"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5 dark:hover:bg-white/5"
                      }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                );
              })}
            </div> */}

            {/* Show Advanced Settings toggle — always visible */}
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-1.5 text-sm text-green-400 hover:text-green-300 transition-colors select-none"
            >
              {showAdvanced ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  Hide advanced settings
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  Show advanced settings
                </>
              )}
            </button>

            {/* ── Derived Options ─────────────────────────────────────────── */}
            {rateMode === "derived" && (
              <div className="space-y-4 border-t border-black/5 dark:border-white/10 pt-4">
                <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                  Derived Options
                </p>

                {/* Parent Rate Plan — cascading dropdown */}
                <Field
                  label={
                    <span>
                      <span className="text-red-400 mr-0.5">*</span>Parent Rate
                      Plan
                    </span>
                  }
                >
                  <CascadingRatePlanDropdown
                    roomTypes={roomTypes}
                    excludeId={ratePlanToEdit?.id}
                    selectedMeta={selectedParentMeta}
                    onSelect={(id, planRow, rtTitle) => {
                      setParentRatePlanId(id);
                      setSelectedParentMeta({
                        id,
                        title: planRow.title,
                        options: planRow.options,
                        roomTypeTitle: rtTitle,
                      });
                    }}
                    onClear={() => {
                      setParentRatePlanId(null);
                      setSelectedParentMeta(null);
                    }}
                    disabled={false}
                  />
                </Field>

                {/* Inherit from parent checkboxes */}
                <Field label="Inherit from parent">
                  <div className="space-y-2">
                    {inheritItems.map(({ key, label }) => (
                      <label
                        key={key}
                        className="flex items-center gap-2.5 cursor-pointer select-none group"
                      >
                        <input
                          type="checkbox"
                          checked={inherit[key]}
                          onChange={(e) =>
                            setInherit((prev) => ({
                              ...prev,
                              [key]: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 accent-green-500 cursor-pointer"
                        />
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </Field>
              </div>
            )}

            {/* ── Restrictions (Advanced Settings) ────────────────────────── */}
            {showAdvanced && (
              <div className="space-y-4 border-t border-black/5 dark:border-white/10 pt-4">
                <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                  Restrictions
                </p>

                <Field label="Min Stay Arrival">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    disabled={
                      rateMode === "derived" &&
                      Boolean(inherit.min_stay_arrival)
                    }
                    value={restrictions.min_stay_arrival}
                    onChange={(e) =>
                      setRestrictions((r) => ({
                        ...r,
                        min_stay_arrival: Math.max(
                          1,
                          parseInt(e.target.value, 10) || 1,
                        ),
                      }))
                    }
                  />
                </Field>

                <Field label="Min Stay Through">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    disabled={
                      rateMode === "derived" &&
                      Boolean(inherit.min_stay_through)
                    }
                    value={restrictions.min_stay_through}
                    onChange={(e) =>
                      setRestrictions((r) => ({
                        ...r,
                        min_stay_through: Math.max(
                          1,
                          parseInt(e.target.value, 10) || 1,
                        ),
                      }))
                    }
                  />
                </Field>

                <Field label="Max Stay">
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    disabled={
                      rateMode === "derived" && Boolean(inherit.max_stay)
                    }
                    value={restrictions.max_stay}
                    onChange={(e) =>
                      setRestrictions((r) => ({
                        ...r,
                        max_stay: Math.max(
                          0,
                          parseInt(e.target.value, 10) || 0,
                        ),
                      }))
                    }
                  />
                </Field>

                {/* Day checkboxes */}
                <div className="space-y-3 pt-1">
                  <DayCheckboxRow
                    label="Closed To Arrival"
                    disabled={
                      rateMode === "derived" &&
                      Boolean(inherit.closed_to_arrival)
                    }
                    value={restrictions.closed_to_arrival}
                    onChange={(v) =>
                      setRestrictions((r) => ({ ...r, closed_to_arrival: v }))
                    }
                  />
                  <DayCheckboxRow
                    label="Closed To Departure"
                    disabled={
                      rateMode === "derived" &&
                      Boolean(inherit.closed_to_departure)
                    }
                    value={restrictions.closed_to_departure}
                    onChange={(v) =>
                      setRestrictions((r) => ({ ...r, closed_to_departure: v }))
                    }
                  />
                  <DayCheckboxRow
                    label="Stop Sell"
                    disabled={
                      rateMode === "derived" && Boolean(inherit.stop_sell)
                    }
                    value={restrictions.stop_sell}
                    onChange={(v) =>
                      setRestrictions((r) => ({ ...r, stop_sell: v }))
                    }
                  />
                </div>
              </div>
            )}

            {/* ── SECTION: Options ───────────────────────────────────────── */}
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mt-4 border-t border-black/5 dark:border-white/10 pt-4">
              Options
            </p>

            {/* Occupancy */}
            <Field label="Occupancy">
              <Input
                type="number"
                min="1"
                step="1"
                value={form.occupancy}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    occupancy: Math.max(1, parseInt(e.target.value, 10) || 1),
                  }))
                }
                placeholder="e.g. 2"
              />
            </Field>

            {/* Rate */}
            <Field label="Rate">
              <Input
                type="number"
                min="1"
                step="1"
                disabled={rateMode === "derived" && Boolean(inherit.rate)}
                value={form.rate}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    rate: Math.max(1, parseInt(e.target.value, 10) || 1),
                  }))
                }
                placeholder="e.g. 1000"
              />
            </Field>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={submitting}
            className="hover:bg-black/5 dark:hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-rate-plan-form"
            disabled={
              submitting ||
              !form.title ||
              !roomTypeId ||
              (rateMode === "derived" && !parentRatePlanId)
            }
            className="bg-green-500 hover:bg-green-600 text-white min-w-[120px]"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Save Rate Plan"
            )}
          </Button>
        </div>
      </div>

      {/* Sub-panels — stacked on top of this panel */}
      <AddTaxSetPanel
        open={taxSetPanelOpen}
        onClose={() => setTaxSetPanelOpen(false)}
        channexPropertyId={channexPropertyId}
      />

      <AddCancellationPolicyPanel
        open={cancellationPanelOpen}
        onClose={() => setCancellationPanelOpen(false)}
      />
    </>
  );
};
