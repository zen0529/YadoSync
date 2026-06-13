import React, { useState, useEffect } from "react";
import cc from "currency-codes";
import { Tag, X, Loader2, ChevronDown, ChevronUp, Plus, RefreshCw } from "lucide-react";
import { Field } from "@/components/ui/field";
import { inputCls } from "@/components/ui/input-cls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AddTaxSetPanel } from "./AddTaxSetPanel";
import { AddCancellationPolicyPanel } from "./AddCancellationPolicyPanel";
import { useTaxSets } from "../hooks/useTaxSets";

const CURRENCIES = cc.codes();

const DEFAULT_FORM = {
  title: "",
  roomTypeId: "",
  currency: "PHP",
  sell_mode: "per_room",
  rate_mode: "manual",
  // Additional Information
  tax_set_id: "",
  parent_rate_plan_id: "",
  // Fees
  children_fee: "0.00",
  infant_fee: "0.00",
  // Advanced restrictions (single value → broadcast to all 7 days)
  min_stay_arrival: 1,
  min_stay_through: 1,
  max_stay: 0,
  closed_to_arrival: false,
  closed_to_departure: false,
  stop_sell: false,
  // Inherit flags
  inherit_rate: false,
  inherit_closed_to_arrival: false,
  inherit_closed_to_departure: false,
  inherit_stop_sell: false,
  inherit_min_stay_arrival: false,
  inherit_min_stay_through: false,
  inherit_max_stay: false,
  inherit_max_sell: false,
  inherit_max_availability: false,
  inherit_availability_offset: false,
};

/** Small toggle switch */
const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2.5 cursor-pointer group select-none">
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${checked ? "bg-green-500" : "bg-muted-foreground/30"
        }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0"
          }`}
      />
    </button>
    {label && <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>}
  </label>
);

/** Small checkbox row for inherit flags */
const InheritCheck = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2.5 cursor-pointer select-none group">
    <input
      type="checkbox"
      checked={checked}
      onChange={e => onChange(e.target.checked)}
      className="w-3.5 h-3.5 accent-green-500 rounded shrink-0"
    />
    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
  </label>
);

/**
 * AddRatePlanPanel — slide-over panel for creating / editing a Rate Plan.
 *
 * Props:
 *  - open                {boolean}
 *  - onClose             {function}
 *  - ratePlanToEdit      {object|null}
 *  - onSave              {function}   async (form, localId) => void
 *  - submitting          {boolean}
 *  - roomTypes           {Array}
 *  - ratePlans           {Array}      needed for parent rate plan dropdown
 *  - defaultRoomTypeId   {string|null}
 *  - channexPropertyId   {string}     passed through to AddTaxSetPanel
 */
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [taxSetPanelOpen, setTaxSetPanelOpen] = useState(false);
  const [cancellationPanelOpen, setCancellationPanelOpen] = useState(false);

  const { taxSets, loading: taxSetsLoading, refetch: refetchTaxSets } = useTaxSets(channexPropertyId);

  // Populate form when editing or reset when adding
  useEffect(() => {
    if (open && ratePlanToEdit) {
      setForm({
        title: ratePlanToEdit.title || "",
        roomTypeId: ratePlanToEdit.room_type_id || "",
        currency: ratePlanToEdit.currency || "PHP",
        sell_mode: ratePlanToEdit.sell_mode || "per_room",
        rate_mode: ratePlanToEdit.rate_mode || "manual",
        tax_set_id: ratePlanToEdit.tax_set_id || "",
        parent_rate_plan_id: ratePlanToEdit.parent_rate_plan_id || "",
        children_fee: ratePlanToEdit.children_fee || "0.00",
        infant_fee: ratePlanToEdit.infant_fee || "0.00",
        // Arrays are stored per-day; read [0] as the representative value
        min_stay_arrival: ratePlanToEdit.min_stay_arrival?.[0] ?? 1,
        min_stay_through: ratePlanToEdit.min_stay_through?.[0] ?? 1,
        max_stay: ratePlanToEdit.max_stay?.[0] ?? 0,
        closed_to_arrival: ratePlanToEdit.closed_to_arrival?.[0] ?? false,
        closed_to_departure: ratePlanToEdit.closed_to_departure?.[0] ?? false,
        stop_sell: ratePlanToEdit.stop_sell?.[0] ?? false,
        inherit_rate: ratePlanToEdit.inherit_settings?.rate ?? false,
        inherit_closed_to_arrival: ratePlanToEdit.inherit_settings?.closed_to_arrival ?? false,
        inherit_closed_to_departure: ratePlanToEdit.inherit_settings?.closed_to_departure ?? false,
        inherit_stop_sell: ratePlanToEdit.inherit_settings?.stop_sell ?? false,
        inherit_min_stay_arrival: ratePlanToEdit.inherit_settings?.min_stay_arrival ?? false,
        inherit_min_stay_through: ratePlanToEdit.inherit_settings?.min_stay_through ?? false,
        inherit_max_stay: ratePlanToEdit.inherit_settings?.max_stay ?? false,
        inherit_max_sell: ratePlanToEdit.inherit_settings?.max_sell ?? false,
        inherit_max_availability: ratePlanToEdit.inherit_settings?.max_availability ?? false,
        inherit_availability_offset: ratePlanToEdit.inherit_settings?.availability_offset ?? false,
      });
      setShowAdvanced(false);
    } else if (open && !ratePlanToEdit) {
      setForm({ ...DEFAULT_FORM, roomTypeId: defaultRoomTypeId ?? "" });
      setShowAdvanced(false);
    }
  }, [open, ratePlanToEdit, defaultRoomTypeId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form, ratePlanToEdit?.id);
  };

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));
  const isEditing = !!ratePlanToEdit;

  // Rate plans that can be a parent (same room type, excluding self)
  const parentCandidates = ratePlans.filter(rp =>
    rp.id !== ratePlanToEdit?.id &&
    (form.roomTypeId ? rp.room_type_id === form.roomTypeId : true)
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[520px] flex flex-col bg-background/80 dark:bg-[#0F172A]/90 backdrop-blur-2xl border-l border-black/5 dark:border-white/10 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "translate-x-0" : "translate-x-full"
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

            {/* ── Title ──────────────────────────────────────────────────── */}
            <Field label="Plan Title">
              <input
                className={inputCls}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder='e.g. "Best Available Rate"'
                required
              />
            </Field>

            {/* ── Room Type — only on create ──────────────────────────── */}
            {!isEditing && (
              <Field label="Room Type">
                {roomTypes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/20 py-4 px-3 text-xs text-muted-foreground/60 text-center">
                    No room types found. Add room types first.
                  </div>
                ) : (
                  <Select
                    value={form.roomTypeId}
                    onValueChange={set("roomTypeId")}
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

            {/* ── SECTION: Pricing Configuration ─────────────────────── */}
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mt-4 border-t border-black/5 dark:border-white/10 pt-4">
              Pricing Configuration
            </p>

            {/* Currency */}
            <Field label="Currency">
              <Select value={form.currency} onValueChange={set("currency")}>
                <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-dropdown rounded-xl border-white/30 w-64">
                  {CURRENCIES.map(c => (
                    <SelectItem key={c} value={c} className="text-sm rounded-lg">
                      <span className="font-semibold">{c}</span>
                      <span className="text-muted-foreground ml-1.5">— {cc.code(c)?.currency}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Sell Mode */}
            <Field label="Sell Mode">
              <div className="flex gap-2">
                {[
                  { value: "per_room", label: "Per Room" },
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
                  { value: "manual", label: "Manual" },
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

            {/* Children / Infant Fees */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Children Fee">
                <div className="relative">
                  <input
                    className={`${inputCls} pr-12`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.children_fee}
                    onChange={e => setForm(f => ({ ...f, children_fee: e.target.value }))}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/50">
                    {form.currency}
                  </span>
                </div>
              </Field>
              <Field label="Infant Fee">
                <div className="relative">
                  <input
                    className={`${inputCls} pr-12`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.infant_fee}
                    onChange={e => setForm(f => ({ ...f, infant_fee: e.target.value }))}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/50">
                    {form.currency}
                  </span>
                </div>
              </Field>
            </div>

            {/* ── SECTION: Additional Information ───────────────────────── */}
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mt-4 border-t border-black/5 dark:border-white/10 pt-4">
              Additional Information
            </p>

            {/* Tax Set */}
            {/* <Field label="Tax Set">
              <div className="flex gap-2">
                <Select
                  value={form.tax_set_id || ""}
                  onValueChange={v => setForm(f => ({ ...f, tax_set_id: v === "__none__" ? "" : v }))}
                  disabled={taxSetsLoading}
                >
                  <SelectTrigger className="flex-1 glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
                    {taxSetsLoading
                      ? <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" /> Loading…
                      </span>
                      : <SelectValue placeholder="Select a tax set…" />
                    }
                  </SelectTrigger>
                  <SelectContent className="glass-dropdown rounded-xl border-white/30">
                    <SelectItem value="__none__" className="text-sm rounded-lg text-muted-foreground italic">
                      — None —
                    </SelectItem>
                    {taxSets.map(ts => (
                      <SelectItem key={ts.id} value={ts.id} className="text-sm rounded-lg">
                        {ts.attributes?.title ?? ts.title ?? ts.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <button
                  type="button"
                  onClick={refetchTaxSets}
                  disabled={taxSetsLoading}
                  className="shrink-0 w-10 h-10 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors disabled:opacity-40"
                  title="Refresh tax sets"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${taxSetsLoading ? "animate-spin" : ""}`} />
                </button>

            
                <button
                  type="button"
                  onClick={() => setTaxSetPanelOpen(true)}
                  className="shrink-0 w-10 h-10 rounded-xl border border-white/20 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-colors"
                  title="Create new tax set"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </Field> */}

            {/* Cancellation Policy — UI only */}
            {/* <Field label="Cancellation Policy">
              <div className="flex gap-2">
                <input
                  className={`${inputCls} flex-1`}
                  value=""
                  readOnly
                  placeholder="Select or create cancellation policy"
                />
                <button
                  type="button"
                  onClick={() => setCancellationPanelOpen(true)}
                  className="shrink-0 w-10 h-10 rounded-xl border border-white/20 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors"
                  title="Create cancellation policy"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/50 mt-1">API integration pending</p>
            </Field> */}

            {/* Parent Rate Plan — only when rate_mode = "derived" */}
            {form.rate_mode === "derived" && (
              <Field label="Parent Rate Plan">
                {parentCandidates.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/20 py-3 px-3 text-xs text-muted-foreground/60 text-center">
                    No rate plans available as parent. Create another rate plan first.
                  </div>
                ) : (
                  <Select
                    value={form.parent_rate_plan_id || ""}
                    onValueChange={set("parent_rate_plan_id")}
                  >
                    <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
                      <SelectValue placeholder="Select a parent rate plan..." />
                    </SelectTrigger>
                    <SelectContent className="glass-dropdown rounded-xl border-white/30">
                      {parentCandidates.map(rp => (
                        <SelectItem key={rp.id} value={rp.id} className="text-sm rounded-lg">
                          {rp.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Field>
            )}

            {/* ── SECTION: Advanced Settings (collapsible) ──────────────── */}
            <div className="border border-black/5 dark:border-white/10 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvanced(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-black/3 dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/8 transition-colors text-sm font-semibold text-foreground/80"
              >
                <span>Advanced Settings</span>
                {showAdvanced
                  ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                }
              </button>

              {showAdvanced && (
                <div className="p-4 space-y-5 border-t border-black/5 dark:border-white/10">

                  {/* Stay Restrictions */}
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-3">
                      Stay Restrictions
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Min Stay Arrival">
                        <input
                          className={inputCls}
                          type="number"
                          min="1"
                          value={form.min_stay_arrival}
                          onChange={e => setForm(f => ({ ...f, min_stay_arrival: Number(e.target.value) }))}
                        />
                      </Field>
                      <Field label="Min Stay Through">
                        <input
                          className={inputCls}
                          type="number"
                          min="1"
                          value={form.min_stay_through}
                          onChange={e => setForm(f => ({ ...f, min_stay_through: Number(e.target.value) }))}
                        />
                      </Field>
                      <Field label="Max Stay">
                        <input
                          className={inputCls}
                          type="number"
                          min="0"
                          value={form.max_stay}
                          onChange={e => setForm(f => ({ ...f, max_stay: Number(e.target.value) }))}
                          placeholder="0 = none"
                        />
                      </Field>
                    </div>
                    <p className="text-[10px] text-muted-foreground/50 mt-1.5">
                      Values applied to all 7 days of the week.
                    </p>
                  </div>

                  {/* Boolean Flags */}
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-3">
                      Availability Flags
                    </p>
                    <div className="space-y-3">
                      <Toggle
                        checked={form.closed_to_arrival}
                        onChange={set("closed_to_arrival")}
                        label="Closed to Arrival"
                      />
                      <Toggle
                        checked={form.closed_to_departure}
                        onChange={set("closed_to_departure")}
                        label="Closed to Departure"
                      />
                      <Toggle
                        checked={form.stop_sell}
                        onChange={set("stop_sell")}
                        label="Stop Sell"
                      />
                    </div>
                  </div>

                  {/* Inherit Flags */}
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-3">
                      Inherit from Parent
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                      <InheritCheck checked={form.inherit_rate} onChange={set("inherit_rate")} label="Rate" />
                      <InheritCheck checked={form.inherit_min_stay_arrival} onChange={set("inherit_min_stay_arrival")} label="Min Stay Arrival" />
                      <InheritCheck checked={form.inherit_min_stay_through} onChange={set("inherit_min_stay_through")} label="Min Stay Through" />
                      <InheritCheck checked={form.inherit_max_stay} onChange={set("inherit_max_stay")} label="Max Stay" />
                      <InheritCheck checked={form.inherit_closed_to_arrival} onChange={set("inherit_closed_to_arrival")} label="Closed to Arrival" />
                      <InheritCheck checked={form.inherit_closed_to_departure} onChange={set("inherit_closed_to_departure")} label="Closed to Departure" />
                      <InheritCheck checked={form.inherit_stop_sell} onChange={set("inherit_stop_sell")} label="Stop Sell" />
                      <InheritCheck checked={form.inherit_max_sell} onChange={set("inherit_max_sell")} label="Max Sell" />
                      <InheritCheck checked={form.inherit_max_availability} onChange={set("inherit_max_availability")} label="Max Availability" />
                      <InheritCheck checked={form.inherit_availability_offset} onChange={set("inherit_availability_offset")} label="Availability Offset" />
                    </div>
                  </div>
                </div>
              )}
            </div>

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

      {/* Sub-panels — stacked on top of this panel */}
      <AddTaxSetPanel
        open={taxSetPanelOpen}
        onClose={() => setTaxSetPanelOpen(false)}
        channexPropertyId={channexPropertyId}
        currency={form.currency}
        onCreated={(taxSetId) => {
          setForm(f => ({ ...f, tax_set_id: taxSetId }));
          setTaxSetPanelOpen(false);
          // Refresh the dropdown so the new set appears
          refetchTaxSets();
        }}
      />

      <AddCancellationPolicyPanel
        open={cancellationPanelOpen}
        onClose={() => setCancellationPanelOpen(false)}
      />
    </>
  );
};
