import React, { useState, useEffect } from "react";
import { Tag, X, Loader2 } from "lucide-react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddTaxSetPanel } from "./AddTaxSetPanel";
import { AddCancellationPolicyPanel } from "./AddCancellationPolicyPanel";

const DEFAULT_FORM = {
  title: "",
  // Options
  occupancy: 1,
  primary: false,
  rate: 0,
};

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
  const [taxSetPanelOpen, setTaxSetPanelOpen] = useState(false);
  const [cancellationPanelOpen, setCancellationPanelOpen] = useState(false);

  // Populate form when editing or reset when adding
  useEffect(() => {
    if (open && ratePlanToEdit) {
      setRoomTypeId(ratePlanToEdit.room_type_id || "");
      setForm({
        title: ratePlanToEdit.title || "",
        occupancy: ratePlanToEdit.occupancy ?? 1,
        primary: ratePlanToEdit.primary ?? false,
        rate: ratePlanToEdit.rate ?? 0,
      });
    } else if (open && !ratePlanToEdit) {
      setRoomTypeId(defaultRoomTypeId || "");
      setForm({ ...DEFAULT_FORM });
    }
  }, [open, ratePlanToEdit, defaultRoomTypeId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form, ratePlanToEdit?.id, roomTypeId);
  };

  const isEditing = !!ratePlanToEdit;

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

            {/* Primary */}
            <Field label="Primary">
              <div className="flex gap-4">
                {[
                  { value: true, label: "Yes" },
                  { value: false, label: "No" },
                ].map((opt) => (
                  <label
                    key={String(opt.value)}
                    className="flex items-center gap-2 cursor-pointer select-none group"
                  >
                    {/* Custom radio circle matching input bg */}
                    <div
                      onClick={() =>
                        setForm((f) => ({ ...f, primary: opt.value }))
                      }
                      className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center transition-all
                        ${
                          form.primary === opt.value
                            ? "border-green-500 bg-white/40 dark:bg-white/5"
                            : "border-white/30 dark:border-white/10 bg-white/40 dark:bg-white/5"
                        }`}
                    >
                      {form.primary === opt.value && (
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </Field>

            {/* Rate */}
            <Field label="Rate">
              <Input
                type="number"
                min="1"
                step="1"
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
            disabled={submitting || !form.title || !roomTypeId}
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
