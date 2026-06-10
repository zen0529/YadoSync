import React, { useState, useEffect } from "react";
import { Tag, X, Loader2 } from "lucide-react";
import { Field } from "@/components/ui/field";
import { inputCls } from "@/components/ui/input-cls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const CURRENCIES = ["PHP", "USD", "EUR", "SGD", "AUD", "GBP", "JPY"];

/**
 * AddRatePlanPanel — slide-over panel for creating / editing a Rate Plan.
 *
 * Mirrors AddRoomTypePanel structure exactly.
 *
 * Props:
 *  - open            {boolean}    whether the panel is visible
 *  - onClose         {function}   called to close the panel
 *  - ratePlanToEdit  {object|null} populated when editing an existing plan
 *  - onSave          {function}   async (form, localId) => void
 *  - submitting      {boolean}    shows spinner on submit button
 *  - roomTypes       {Array}      list of room types for this property
 */
export const AddRatePlanPanel = ({ open, onClose, ratePlanToEdit, onSave, submitting, roomTypes = [], defaultRoomTypeId = null }) => {
  const [form, setForm] = useState({
    title:      "",
    roomTypeId: "",
    currency:   "PHP",
    sell_mode:  "per_room",
    rate_mode:  "manual",
  });

  // Populate form when editing or reset when adding
  useEffect(() => {
    if (open && ratePlanToEdit) {
      setForm({
        title:      ratePlanToEdit.title,
        roomTypeId: ratePlanToEdit.room_type_id,
        currency:   ratePlanToEdit.currency,
        sell_mode:  ratePlanToEdit.sell_mode,
        rate_mode:  ratePlanToEdit.rate_mode,
      });
    } else if (open && !ratePlanToEdit) {
      setForm({
        title:      "",
        roomTypeId: defaultRoomTypeId ?? "",
        currency:   "PHP",
        sell_mode:  "per_room",
        rate_mode:  "manual",
      });
    }
  }, [open, ratePlanToEdit, defaultRoomTypeId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form, ratePlanToEdit?.id);
  };

  const isEditing = !!ratePlanToEdit;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
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
                {isEditing ? "Update pricing plan details" : "Link a pricing plan to a room type"}
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
        <form id="add-rate-plan-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">

            {/* Title */}
            <Field label="Plan Title (e.g. Standard Rate, Non-refundable)">
              <input
                className={inputCls}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder='e.g. "Standard Rate"'
                required
              />
            </Field>

            {/* Room Type — only shown when creating */}
            {!isEditing && (
              <Field label="Room Type">
                {roomTypes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/20 py-4 px-3 text-xs text-muted-foreground/60 text-center">
                    No room types found. Add room types first.
                  </div>
                ) : (
                  <Select
                    value={form.roomTypeId}
                    onValueChange={v => setForm(f => ({ ...f, roomTypeId: v }))}
                    disabled={!!defaultRoomTypeId}
                    required
                  >
                    <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                      <SelectValue placeholder="Select a room type..." />
                    </SelectTrigger>
                    <SelectContent className="glass-dropdown rounded-xl border-white/30">
                      {roomTypes.map(rt => (
                        <SelectItem key={rt.id} value={rt.id} className="text-sm rounded-lg">
                          {rt.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Field>
            )}

            {/* Currency */}
            <Field label="Currency">
              <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-dropdown rounded-xl border-white/30">
                  {CURRENCIES.map(c => (
                    <SelectItem key={c} value={c} className="text-sm rounded-lg">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mt-4 border-t border-black/5 dark:border-white/10 pt-4">
              Pricing Configuration
            </p>

            {/* Sell Mode */}
            <Field label="Sell Mode">
              <div className="flex gap-2">
                {[
                  { value: "per_room",   label: "Per Room" },
                  { value: "per_person", label: "Per Person" },
                ].map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, sell_mode: m.value }))}
                    className={`flex-1 py-2.5 px-3 text-xs font-semibold rounded-xl border transition-all duration-200
                      ${form.sell_mode === m.value
                        ? "bg-green-500/10 border-green-500/40 text-green-600 dark:text-green-400"
                        : "border-white/20 text-muted-foreground hover:border-green-300/50 hover:text-green-500 bg-white/10 dark:bg-white/5"
                      }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* Rate Mode */}
            <Field label="Rate Mode">
              <div className="flex gap-2">
                {[
                  { value: "manual",  label: "Manual" },
                  { value: "derived", label: "Derived" },
                ].map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, rate_mode: m.value }))}
                    className={`flex-1 py-2.5 px-3 text-xs font-semibold rounded-xl border transition-all duration-200
                      ${form.rate_mode === m.value
                        ? "bg-green-500/10 border-green-500/40 text-green-600 dark:text-green-400"
                        : "border-white/20 text-muted-foreground hover:border-green-300/50 hover:text-green-500 bg-white/10 dark:bg-white/5"
                      }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {form.rate_mode === "derived" && (
                <p className="text-[11px] text-amber-600/80 bg-amber-50 dark:bg-amber-500/10 rounded-lg px-3 py-2 mt-2">
                  Derived rates inherit pricing from a parent rate plan.
                </p>
              )}
            </Field>

          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-end gap-3 shrink-0">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting} className="hover:bg-black/5 dark:hover:bg-white/10">
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-rate-plan-form"
            disabled={submitting || !form.title || (!isEditing && !form.roomTypeId)}
            className="bg-green-500 hover:bg-green-600 text-white min-w-[120px]"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Rate Plan"}
          </Button>
        </div>
      </div>
    </>
  );
};
