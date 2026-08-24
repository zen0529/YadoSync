import React, { useState, useEffect, useMemo } from "react";
import {
  CalendarDays, X, Loader2, RefreshCw, ChevronDown,
  BedDouble, Tag, TrendingUp, AlertCircle, CheckCircle2,
} from "lucide-react";
import { Field } from "@/components/ui/field";
import { inputCls } from "@/components/ui/input-cls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useARI } from "../hooks/useARI";

/** Small toggle — reuse same style as AddRatePlanPanel */
const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2.5 cursor-pointer group select-none">
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none shrink-0
        ${checked ? "bg-green-500" : "bg-muted-foreground/30"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
          ${checked ? "translate-x-4" : "translate-x-0"}`}
      />
    </button>
    {label && (
      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
        {label}
      </span>
    )}
  </label>
);

/** Section heading */
const SectionHeading = ({ children }) => (
  <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider border-t border-black/5 dark:border-white/10 pt-4 mt-4">
    {children}
  </p>
);

/**
 * ARIEditorPanel — slide-over panel for setting availability and rates.
 *
 * Props:
 *  open              {boolean}
 *  onClose           {function}
 *  propertyId        {string}
 *  channexPropertyId {string}
 *  roomTypes         {Array}   - from useRoomTypes
 *  ratePlans         {Array}   - from useRatePlans (all plans, all room types)
 *  defaultRoomTypeId {string|null}  - pre-select a room type
 *  defaultRatePlanId {string|null}  - pre-select a rate plan
 */
export const ARIEditorPanel = ({
  open,
  onClose,
  propertyId,
  channexPropertyId,
  roomTypes = [],
  ratePlans = [],
  defaultRoomTypeId = null,
  defaultRatePlanId = null,
}) => {
  const {
    availability,
    restrictions,
    loading: ariLoading,
    saving,
    load,
    saveAvailability,
    saveRestrictions,
    fullSync,
  } = useARI(propertyId, channexPropertyId);

  // ── Availability form state ───────────────────────────────────────────────
  const [availForm, setAvailForm] = useState({
    roomTypeId: "",
    dateFrom:   "",
    dateTo:     "",
    available:  1,
  });

  // ── Restrictions form state ───────────────────────────────────────────────
  const [restrForm, setRestrForm] = useState({
    ratePlanId:         "",
    dateFrom:           "",
    dateTo:             "",
    rateMajor:          "",       // pesos/dollars, entered in major units
    minStayArrival:     1,
    stopSell:           false,
    closedToArrival:    false,
    closedToDeparture:  false,
  });

  const [availSaving,  setAvailSaving]  = useState(false);
  const [restrSaving,  setRestrSaving]  = useState(false);
  const [syncing,      setSyncing]      = useState(false);

  // ── Derived ───────────────────────────────────────────────────────────────
  const roomTypeOptions = roomTypes.filter((rt) => !!rt.channex_room_type_id);
  const ratePlanOptions = ratePlans.filter((rp) => !!rp.channex_rate_plan_id);

  // Rate plans scoped to the selected availability room type
  const ratePlansForRoom = useMemo(() => {
    if (!availForm.roomTypeId) return ratePlanOptions;
    return ratePlanOptions.filter((rp) => rp.room_type_id === availForm.roomTypeId);
  }, [availForm.roomTypeId, ratePlanOptions]);

  const selectedRoomType  = roomTypes.find((rt) => rt.id === availForm.roomTypeId);
  const selectedRatePlan  = ratePlans.find((rp) => rp.id === restrForm.ratePlanId);

  // Today's date string for date input min
  const todayStr = new Date().toISOString().slice(0, 10);
  // Max date = 365 days from today
  const maxDateStr = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);

  // ── Initialise & load when panel opens ──────────────────────────────────
  useEffect(() => {
    if (!open) return;

    const initRoomTypeId = defaultRoomTypeId || roomTypeOptions[0]?.id || "";
    const initRatePlanId = defaultRatePlanId
      || ratePlanOptions.find((rp) => rp.room_type_id === initRoomTypeId)?.id
      || ratePlanOptions[0]?.id
      || "";

    setAvailForm({
      roomTypeId: initRoomTypeId,
      dateFrom:   todayStr,
      dateTo:     todayStr,
      available:  selectedRoomType?.count_of_rooms ?? 1,
    });
    setRestrForm({
      ratePlanId:        initRatePlanId,
      dateFrom:          todayStr,
      dateTo:            todayStr,
      rateMajor:         "",
      minStayArrival:    1,
      stopSell:          false,
      closedToArrival:   false,
      closedToDeparture: false,
    });

    // Load ARI data for all room types + rate plans
    const rtIds = roomTypeOptions.map((rt) => rt.id);
    const rpIds = ratePlanOptions.map((rp) => rp.id);
    if (rtIds.length > 0 || rpIds.length > 0) {
      load(rtIds, rpIds);
    }
  }, [open, defaultRoomTypeId, defaultRatePlanId]); // eslint-disable-line

  // Auto-update available count when room type changes
  useEffect(() => {
    if (!availForm.roomTypeId) return;
    const rt = roomTypes.find((r) => r.id === availForm.roomTypeId);
    if (rt) setAvailForm((f) => ({ ...f, available: rt.count_of_rooms ?? 1 }));
  }, [availForm.roomTypeId, roomTypes]);

  // ── Current values for display ────────────────────────────────────────────
  const currentAvail = availability[availForm.roomTypeId]?.[availForm.dateFrom];
  const currentRestr = restrictions[restrForm.ratePlanId]?.[restrForm.dateFrom];
  const currentRateMajor = currentRestr ? (currentRestr.rate / 100).toFixed(2) : null;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSaveAvailability = async (e) => {
    e.preventDefault();
    if (!availForm.roomTypeId) return toast.error("Select a room type");
    if (!availForm.dateFrom || !availForm.dateTo) return toast.error("Set a date range");
    if (availForm.dateFrom > availForm.dateTo) return toast.error("Date From must be ≤ Date To");
    if (!selectedRoomType?.channex_room_type_id) return toast.error("Room type has no Channex ID");

    setAvailSaving(true);
    try {
      const result = await saveAvailability({
        roomTypeId:       availForm.roomTypeId,
        channexRoomTypeId: selectedRoomType.channex_room_type_id,
        dateFrom:          availForm.dateFrom,
        dateTo:            availForm.dateTo,
        available:         Number(availForm.available),
      });
      toast.success(
        `Availability pushed`,
        { description: `${result.pushed} date(s) → ${result.ranges} range(s) sent to Channex` },
      );
    } catch (err) {
      toast.error("Failed to push availability", { description: err.message });
    } finally {
      setAvailSaving(false);
    }
  };

  const handleSaveRestrictions = async (e) => {
    e.preventDefault();
    if (!restrForm.ratePlanId)  return toast.error("Select a rate plan");
    if (!restrForm.dateFrom || !restrForm.dateTo) return toast.error("Set a date range");
    if (restrForm.dateFrom > restrForm.dateTo)    return toast.error("Date From must be ≤ Date To");
    if (restrForm.rateMajor === "") return toast.error("Enter a rate (use 0 to stop-sell)");
    if (!selectedRatePlan?.channex_rate_plan_id) return toast.error("Rate plan has no Channex ID");

    setRestrSaving(true);
    try {
      const result = await saveRestrictions({
        ratePlanId:       restrForm.ratePlanId,
        channexRatePlanId: selectedRatePlan.channex_rate_plan_id,
        sellMode:         selectedRatePlan.sell_mode || "per_room",
        dateFrom:         restrForm.dateFrom,
        dateTo:           restrForm.dateTo,
        rateMajor:        restrForm.rateMajor,
        minStayArrival:   restrForm.minStayArrival,
        stopSell:         restrForm.stopSell,
        closedToArrival:  restrForm.closedToArrival,
        closedToDeparture: restrForm.closedToDeparture,
      });
      toast.success(
        `Rates pushed`,
        { description: `${result.pushed} date(s) → ${result.ranges} range(s) sent to Channex` },
      );
    } catch (err) {
      toast.error("Failed to push rates", { description: err.message });
    } finally {
      setRestrSaving(false);
    }
  };

  const handleFullSync = async () => {
    setSyncing(true);
    try {
      await fullSync();
      // Reload local data
      const rtIds = roomTypeOptions.map((rt) => rt.id);
      const rpIds = ratePlanOptions.map((rp) => rp.id);
      if (rtIds.length > 0 || rpIds.length > 0) load(rtIds, rpIds);
    } finally {
      setSyncing(false);
    }
  };

  const isBusy = availSaving || restrSaving || syncing || ariLoading;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[540px] flex flex-col
          bg-background/80 dark:bg-[#0F172A]/90 backdrop-blur-2xl
          border-l border-black/5 dark:border-white/10 shadow-2xl
          transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* ── Panel Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <CalendarDays className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-tight">
                Set Availability &amp; Rates
              </h2>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                Push prices and room counts to Channex (and OTAs)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Sync Now button */}
            <button
              type="button"
              onClick={handleFullSync}
              disabled={isBusy}
              title="Re-push all ARI for this property to Channex (drift correction)"
              className="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg
                border border-border/60 bg-white/5 hover:bg-blue-500/10 hover:border-blue-400/40
                text-muted-foreground hover:text-blue-500 transition-all disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Sync All</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Loading state ──────────────────────────────────────────────── */}
        {ariLoading && (
          <div className="flex items-center justify-center gap-2 py-3 bg-blue-500/5 border-b border-blue-500/10 text-xs text-blue-500/80">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Loading current values from Supabase…
          </div>
        )}

        {/* ── Scrollable body ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">

          {/* ══════════════════════════════════════════════════════════════
              SECTION 1: AVAILABILITY
          ══════════════════════════════════════════════════════════════ */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                <BedDouble className="w-3.5 h-3.5 text-green-500" />
              </div>
              <h3 className="text-sm font-bold text-foreground/90">Availability</h3>
              <span className="text-[10px] text-muted-foreground/50 font-medium">per room type, per date</span>
            </div>

            <form id="ari-avail-form" onSubmit={handleSaveAvailability} className="space-y-4">

              {/* Room Type */}
              <Field label="Room Type">
                {roomTypeOptions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border py-3 px-3 text-xs text-muted-foreground/60 text-center">
                    No room types with a Channex ID. Create room types first.
                  </div>
                ) : (
                  <Select
                    value={availForm.roomTypeId}
                    onValueChange={(v) => setAvailForm((f) => ({ ...f, roomTypeId: v }))}
                  >
                    <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
                      <SelectValue placeholder="Select a room type…" />
                    </SelectTrigger>
                    <SelectContent className="glass-dropdown rounded-xl border-white/30">
                      {roomTypeOptions.map((rt) => (
                        <SelectItem key={rt.id} value={rt.id} className="text-sm rounded-lg">
                          {rt.title} <span className="text-muted-foreground">({rt.count_of_rooms} rooms)</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Field>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="From">
                  <input
                    className={inputCls}
                    type="date"
                    min={todayStr}
                    max={maxDateStr}
                    value={availForm.dateFrom}
                    onChange={(e) => {
                      const from = e.target.value;
                      setAvailForm((f) => ({
                        ...f,
                        dateFrom: from,
                        dateTo: f.dateTo < from ? from : f.dateTo,
                      }));
                    }}
                    required
                  />
                </Field>
                <Field label="To">
                  <input
                    className={inputCls}
                    type="date"
                    min={availForm.dateFrom || todayStr}
                    max={maxDateStr}
                    value={availForm.dateTo}
                    onChange={(e) => setAvailForm((f) => ({ ...f, dateTo: e.target.value }))}
                    required
                  />
                </Field>
              </div>

              {/* Available Rooms */}
              <Field label="Available Rooms">
                <div className="relative">
                  <input
                    className={`${inputCls} pr-24`}
                    type="number"
                    min="0"
                    max={selectedRoomType?.count_of_rooms ?? 99}
                    value={availForm.available}
                    onChange={(e) => setAvailForm((f) => ({ ...f, available: Number(e.target.value) }))}
                    required
                  />
                  {selectedRoomType && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/50">
                      max {selectedRoomType.count_of_rooms}
                    </span>
                  )}
                </div>
                {/* Show current value hint */}
                {currentAvail !== undefined && (
                  <p className="text-[11px] text-muted-foreground/60 flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    Currently <strong className="text-foreground/80">{currentAvail}</strong> on {availForm.dateFrom}
                  </p>
                )}
              </Field>

              <Button
                type="submit"
                form="ari-avail-form"
                disabled={availSaving || !availForm.roomTypeId || !availForm.dateFrom || !availForm.dateTo}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold"
              >
                {availSaving ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Pushing…</>
                ) : (
                  "Push Availability to Channex"
                )}
              </Button>
            </form>
          </section>

          {/* Divider */}
          <div className="border-t border-black/5 dark:border-white/10" />

          {/* ══════════════════════════════════════════════════════════════
              SECTION 2: RATES & RESTRICTIONS
          ══════════════════════════════════════════════════════════════ */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <h3 className="text-sm font-bold text-foreground/90">Rates &amp; Restrictions</h3>
              <span className="text-[10px] text-muted-foreground/50 font-medium">per rate plan, per date</span>
            </div>

            <form id="ari-restr-form" onSubmit={handleSaveRestrictions} className="space-y-4">

              {/* Rate Plan */}
              <Field label="Rate Plan">
                {ratePlanOptions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border py-3 px-3 text-xs text-muted-foreground/60 text-center">
                    No rate plans with a Channex ID. Create rate plans first.
                  </div>
                ) : (
                  <Select
                    value={restrForm.ratePlanId}
                    onValueChange={(v) => setRestrForm((f) => ({ ...f, ratePlanId: v }))}
                  >
                    <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
                      <SelectValue placeholder="Select a rate plan…" />
                    </SelectTrigger>
                    <SelectContent className="glass-dropdown rounded-xl border-white/30">
                      {ratePlanOptions.map((rp) => (
                        <SelectItem key={rp.id} value={rp.id} className="text-sm rounded-lg">
                          <span>{rp.title}</span>
                          <span className="text-muted-foreground ml-1.5 text-[10px]">{rp.currency}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Field>

              {selectedRatePlan?.sell_mode === "per_person" && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-600/90">
                    This is a <strong>per-person</strong> rate plan. The rate entered here is used for 1 occupancy.
                    Full per-person tier editing is available via the Channex dashboard for now.
                  </p>
                </div>
              )}

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="From">
                  <input
                    className={inputCls}
                    type="date"
                    min={todayStr}
                    max={maxDateStr}
                    value={restrForm.dateFrom}
                    onChange={(e) => {
                      const from = e.target.value;
                      setRestrForm((f) => ({
                        ...f,
                        dateFrom: from,
                        dateTo: f.dateTo < from ? from : f.dateTo,
                      }));
                    }}
                    required
                  />
                </Field>
                <Field label="To">
                  <input
                    className={inputCls}
                    type="date"
                    min={restrForm.dateFrom || todayStr}
                    max={maxDateStr}
                    value={restrForm.dateTo}
                    onChange={(e) => setRestrForm((f) => ({ ...f, dateTo: e.target.value }))}
                    required
                  />
                </Field>
              </div>

              {/* Rate (major units) */}
              <Field label={`Rate (${selectedRatePlan?.currency || "—"})`}>
                <div className="relative">
                  <input
                    className={`${inputCls} pr-20`}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 1380.00"
                    value={restrForm.rateMajor}
                    onChange={(e) => setRestrForm((f) => ({ ...f, rateMajor: e.target.value }))}
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/50">
                    {selectedRatePlan?.currency || ""}
                  </span>
                </div>
                {/* Current value hint */}
                {currentRateMajor !== null && (
                  <p className="text-[11px] text-muted-foreground/60 flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3 text-indigo-500" />
                    Currently <strong className="text-foreground/80">{currentRateMajor}</strong> on {restrForm.dateFrom}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground/40 mt-1">
                  Sent to Channex in cents. Enter full amount (e.g. 1380 for ₱1,380).
                </p>
              </Field>

              {/* Min Stay */}
              <Field label="Min Stay (nights)">
                <input
                  className={inputCls}
                  type="number"
                  min="1"
                  value={restrForm.minStayArrival}
                  onChange={(e) => setRestrForm((f) => ({ ...f, minStayArrival: Number(e.target.value) }))}
                />
              </Field>

              {/* Availability flags */}
              <div className="space-y-3 pt-1">
                <Toggle
                  checked={restrForm.stopSell}
                  onChange={(v) => setRestrForm((f) => ({ ...f, stopSell: v }))}
                  label="Stop Sell — close this rate plan on all OTAs"
                />
                <Toggle
                  checked={restrForm.closedToArrival}
                  onChange={(v) => setRestrForm((f) => ({ ...f, closedToArrival: v }))}
                  label="Closed to Arrival"
                />
                <Toggle
                  checked={restrForm.closedToDeparture}
                  onChange={(v) => setRestrForm((f) => ({ ...f, closedToDeparture: v }))}
                  label="Closed to Departure"
                />
              </div>

              <Button
                type="submit"
                form="ari-restr-form"
                disabled={restrSaving || !restrForm.ratePlanId || !restrForm.dateFrom || !restrForm.dateTo || restrForm.rateMajor === ""}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
              >
                {restrSaving ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Pushing…</>
                ) : (
                  "Push Rates to Channex"
                )}
              </Button>
            </form>
          </section>

          {/* Info footer */}
          <div className="rounded-xl border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] px-4 py-3 space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground/60">How it works</p>
            <ul className="text-[11px] text-muted-foreground/50 space-y-1 list-disc list-inside">
              <li>Availability and rates are sent as <strong className="text-muted-foreground/70">separate</strong> Channex messages</li>
              <li>Consecutive equal values are compressed into date ranges</li>
              <li>Only future dates are sent — past dates are filtered automatically</li>
              <li>Use <strong className="text-muted-foreground/70">Sync All</strong> at any time to correct drift</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};
