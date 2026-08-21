import { useState, useEffect, useMemo, useCallback } from "react";
import {
  SlidersHorizontal,
  Loader2,
  Calendar,
  ArrowRight,
  ShieldAlert,
  DollarSign,
  Clock,
  AlertTriangle,
  Undo2,
  Send,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { usePushRestrictionCell } from "../hooks/usePushRestrictionCell";
import { DOW_LABELS } from "../utils/dateUtils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Short month names for compact range formatting */
const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Generate array of YYYY-MM-DD date strings between start and end (inclusive) */
const getDatesInRange = (startStr, endStr) => {
  if (!startStr || !endStr) return [];
  const dates = [];
  const curr = new Date(startStr + "T00:00:00Z");
  const end = new Date(endStr + "T00:00:00Z");
  if (isNaN(curr.getTime()) || isNaN(end.getTime()) || curr > end) return [];
  while (curr <= end) {
    dates.push(curr.toISOString().slice(0, 10));
    curr.setUTCDate(curr.getUTCDate() + 1);
  }
  return dates;
};

/** Format a single date: "Fri, 21 Aug 2026" */
const formatFullDateLabel = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00Z");
  if (isNaN(d.getTime())) return dateStr;
  const dow = DOW_LABELS[d.getUTCDay()];
  const day = d.getUTCDate();
  const month = SHORT_MONTHS[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${dow}, ${day} ${month} ${year}`;
};

/** Format date range: "21–27 Aug 2026" or "28 Aug – 3 Sep 2026" or "Fri, 21 Aug 2026" */
const formatDateRangeLabel = (startStr, endStr) => {
  if (!startStr) return "";
  if (!endStr || startStr === endStr) return formatFullDateLabel(startStr);

  const d1 = new Date(startStr + "T00:00:00Z");
  const d2 = new Date(endStr + "T00:00:00Z");
  if (isNaN(d1.getTime()) || isNaN(d2.getTime()))
    return `${startStr} – ${endStr}`;

  const m1 = SHORT_MONTHS[d1.getUTCMonth()];
  const m2 = SHORT_MONTHS[d2.getUTCMonth()];
  const y1 = d1.getUTCFullYear();
  const y2 = d2.getUTCFullYear();
  const day1 = d1.getUTCDate();
  const day2 = d2.getUTCDate();

  if (y1 === y2 && m1 === m2) {
    return `${day1}–${day2} ${m1} ${y1}`;
  }
  if (y1 === y2) {
    return `${day1} ${m1} – ${day2} ${m2} ${y1}`;
  }
  return `${day1} ${m1} ${y1} – ${day2} ${m2} ${y2}`;
};

/**
 * RestrictionEditModal
 *
 * Professional, high-density hotel channel management modal for editing pricing & restrictions.
 * Supports single-date and multi-date bulk editing, mixed values detection, non-destructive
 * "keep existing" defaults, and explicit OTA push notifications.
 */
export const RestrictionEditModal = ({
  open,
  onClose,
  ratePlan, // { id, title, channex_rate_plan_id, currency, sell_mode, room_types }
  roomTypeName, // string (e.g. "Deluxe Room")
  date, // initial clicked date YYYY-MM-DD
  currentRestr, // { rate, min_stay_arrival, min_stay_through, max_stay, stop_sell, closed_to_arrival, closed_to_departure }
  ratePlanRestrMap = {}, // { [ratePlanId]: { [date]: restrictionObj } }
  channexPropertyId,
  propertyId,
  onSaved, // (ratePlanId, dateOrDates, updatedObjOrMap) => void
}) => {
  const { pushRange, loading } = usePushRestrictionCell();

  // ─── Scope State ─────────────────────────────────────────────────────────────
  const [startDate, setStartDate] = useState(date || "");
  const [endDate, setEndDate] = useState(date || "");

  // ─── Form Fields State ───────────────────────────────────────────────────────
  const [form, setForm] = useState({
    rate: "",
    min_stay_arrival: "1",
    min_stay_through: "1",
    max_stay: "0",
    closed_to_arrival: false,
    closed_to_departure: false,
    stop_sell: false,
  });

  // Track which fields the user has explicitly modified
  const [dirty, setDirty] = useState({
    rate: false,
    min_stay_arrival: false,
    min_stay_through: false,
    max_stay: false,
    closed_to_arrival: false,
    closed_to_departure: false,
    stop_sell: false,
  });

  // ─── Selected Dates Array ───────────────────────────────────────────────────
  const selectedDates = useMemo(() => {
    return getDatesInRange(startDate, endDate);
  }, [startDate, endDate]);

  const daysCount = selectedDates.length;

  // ─── Analyze Existing Values Across Range ───────────────────────────────────
  const existingAnalysis = useMemo(() => {
    if (!ratePlan || !selectedDates.length) {
      return {
        isMixed: {
          rate: false,
          min_stay_arrival: false,
          min_stay_through: false,
          max_stay: false,
          closed_to_arrival: false,
          closed_to_departure: false,
          stop_sell: false,
        },
        uniform: {
          rate: "",
          min_stay_arrival: "1",
          min_stay_through: "1",
          max_stay: "0",
          closed_to_arrival: false,
          closed_to_departure: false,
          stop_sell: false,
        },
      };
    }

    const planMap = ratePlanRestrMap[ratePlan.id] || {};

    const rates = [];
    const minArrivals = [];
    const minThroughs = [];
    const maxStays = [];
    const ctaList = [];
    const ctdList = [];
    const ssList = [];

    for (const d of selectedDates) {
      const rec = planMap[d] || (d === date ? currentRestr : null);
      if (rec) {
        if (rec.rate != null) rates.push((rec.rate / 100).toFixed(2));
        if (rec.min_stay_arrival != null)
          minArrivals.push(String(rec.min_stay_arrival));
        if (rec.min_stay_through != null)
          minThroughs.push(String(rec.min_stay_through));
        if (rec.max_stay != null) maxStays.push(String(rec.max_stay));
        if (rec.closed_to_arrival != null)
          ctaList.push(Boolean(rec.closed_to_arrival));
        if (rec.closed_to_departure != null)
          ctdList.push(Boolean(rec.closed_to_departure));
        if (rec.stop_sell != null) ssList.push(Boolean(rec.stop_sell));
      }
    }

    const checkUniform = (arr, fallback) => {
      if (arr.length === 0) return { mixed: false, val: fallback };
      const first = arr[0];
      const allSame = arr.every((v) => v === first);
      const isComplete = arr.length === selectedDates.length;
      return {
        mixed: !allSame || (!isComplete && selectedDates.length > 1),
        val: allSame ? first : fallback,
      };
    };

    const rRate = checkUniform(
      rates,
      currentRestr?.rate != null
        ? (currentRestr.rate / 100).toFixed(2)
        : "0.00",
    );
    const rMsa = checkUniform(
      minArrivals,
      String(currentRestr?.min_stay_arrival ?? 1),
    );
    const rMst = checkUniform(
      minThroughs,
      String(currentRestr?.min_stay_through ?? 1),
    );
    const rMxs = checkUniform(maxStays, String(currentRestr?.max_stay ?? 0));
    const rCta = checkUniform(
      ctaList,
      Boolean(currentRestr?.closed_to_arrival ?? false),
    );
    const rCtd = checkUniform(
      ctdList,
      Boolean(currentRestr?.closed_to_departure ?? false),
    );
    const rSs = checkUniform(ssList, Boolean(currentRestr?.stop_sell ?? false));

    return {
      isMixed: {
        rate: rRate.mixed,
        min_stay_arrival: rMsa.mixed,
        min_stay_through: rMst.mixed,
        max_stay: rMxs.mixed,
        closed_to_arrival: rCta.mixed,
        closed_to_departure: rCtd.mixed,
        stop_sell: rSs.mixed,
      },
      uniform: {
        rate: rRate.val,
        min_stay_arrival: rMsa.val,
        min_stay_through: rMst.val,
        max_stay: rMxs.val,
        closed_to_arrival: rCta.val,
        closed_to_departure: rCtd.val,
        stop_sell: rSs.val,
      },
    };
  }, [ratePlan, selectedDates, ratePlanRestrMap, date, currentRestr]);

  // ─── Sync Form When Modal Opens or Initial Date Changes ─────────────────────
  useEffect(() => {
    if (!open) return;
    const initialDate = date || "";
    setStartDate(initialDate);
    setEndDate(initialDate);
    setDirty({
      rate: false,
      min_stay_arrival: false,
      min_stay_through: false,
      max_stay: false,
      closed_to_arrival: false,
      closed_to_departure: false,
      stop_sell: false,
    });
  }, [open, date]);

  // ─── Initialize field values when uniform analysis updates and field not dirty
  useEffect(() => {
    if (!open) return;
    setForm((prev) => ({
      rate: dirty.rate
        ? prev.rate
        : existingAnalysis.isMixed.rate
          ? ""
          : existingAnalysis.uniform.rate,
      min_stay_arrival: dirty.min_stay_arrival
        ? prev.min_stay_arrival
        : existingAnalysis.isMixed.min_stay_arrival
          ? ""
          : existingAnalysis.uniform.min_stay_arrival,
      min_stay_through: dirty.min_stay_through
        ? prev.min_stay_through
        : existingAnalysis.isMixed.min_stay_through
          ? ""
          : existingAnalysis.uniform.min_stay_through,
      max_stay: dirty.max_stay
        ? prev.max_stay
        : existingAnalysis.isMixed.max_stay
          ? ""
          : existingAnalysis.uniform.max_stay,
      closed_to_arrival: dirty.closed_to_arrival
        ? prev.closed_to_arrival
        : existingAnalysis.uniform.closed_to_arrival,
      closed_to_departure: dirty.closed_to_departure
        ? prev.closed_to_departure
        : existingAnalysis.uniform.closed_to_departure,
      stop_sell: dirty.stop_sell
        ? prev.stop_sell
        : existingAnalysis.uniform.stop_sell,
    }));
  }, [open, existingAnalysis, dirty]);

  if (!ratePlan) return null;

  const currency = ratePlan.currency || "PHP";
  const currencySymbol = currency === "PHP" ? "₱" : "$";
  const resolvedRoomType =
    roomTypeName || ratePlan.room_types?.title || "Accommodation";
  const sellModeLabel =
    ratePlan.sell_mode === "per_person" ? "Per Person" : "Per Room";

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleStartDateChange = (val) => {
    setStartDate(val);
    if (endDate && val > endDate) {
      setEndDate(val);
    }
  };

  const handleFieldChange = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setDirty((d) => ({ ...d, [key]: true }));
  };

  const handleResetField = (key) => {
    setDirty((d) => ({ ...d, [key]: false }));
    if (!existingAnalysis.isMixed[key]) {
      setForm((f) => ({ ...f, [key]: existingAnalysis.uniform[key] }));
    } else {
      setForm((f) => ({
        ...f,
        [key]:
          typeof existingAnalysis.uniform[key] === "boolean"
            ? existingAnalysis.uniform[key]
            : "",
      }));
    }
  };

  // Consequential warning state: Stop Sell is active
  const isStopSellActive = dirty.stop_sell
    ? form.stop_sell
    : !existingAnalysis.isMixed.stop_sell && existingAnalysis.uniform.stop_sell;

  // ─── Submit Action ──────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!ratePlan.channex_rate_plan_id) {
      toast.error(
        "Rate plan has no Channex ID. Please sync in Rooms & Rates first.",
      );
      return;
    }

    if (daysCount === 0) {
      toast.error(
        "Please select a valid date range (End date must be on or after start date).",
      );
      return;
    }

    const planMap = ratePlanRestrMap[ratePlan.id] || {};

    // Construct per-date values array, preserving untouched values for each individual date
    const values = selectedDates.map((d) => {
      const existing = planMap[d] || (d === date ? currentRestr : null);

      const rateValCents = dirty.rate
        ? Math.round(Number(form.rate || 0) * 100)
        : (existing?.rate ?? currentRestr?.rate ?? 0);

      const minArrivalVal = dirty.min_stay_arrival
        ? Number(form.min_stay_arrival || 1)
        : (existing?.min_stay_arrival ?? currentRestr?.min_stay_arrival ?? 1);

      const minThroughVal = dirty.min_stay_through
        ? Number(form.min_stay_through || 1)
        : (existing?.min_stay_through ?? currentRestr?.min_stay_through ?? 1);

      const maxStayVal = dirty.max_stay
        ? Number(form.max_stay || 0)
        : (existing?.max_stay ?? currentRestr?.max_stay ?? 0);

      const ctaVal = dirty.closed_to_arrival
        ? Boolean(form.closed_to_arrival)
        : (existing?.closed_to_arrival ??
          currentRestr?.closed_to_arrival ??
          false);

      const ctdVal = dirty.closed_to_departure
        ? Boolean(form.closed_to_departure)
        : (existing?.closed_to_departure ??
          currentRestr?.closed_to_departure ??
          false);

      const ssVal = dirty.stop_sell
        ? Boolean(form.stop_sell)
        : (existing?.stop_sell ?? currentRestr?.stop_sell ?? false);

      return {
        date: d,
        rate: rateValCents,
        min_stay_arrival: minArrivalVal,
        min_stay_through: minThroughVal,
        max_stay: maxStayVal,
        closed_to_arrival: ctaVal,
        closed_to_departure: ctdVal,
        stop_sell: ssVal,
      };
    });

    try {
      await pushRange({
        propertyId,
        ratePlanId: ratePlan.id,
        channexPropertyId,
        channexRatePlanId: ratePlan.channex_rate_plan_id,
        sellMode: ratePlan.sell_mode ?? "per_room",
        dates: selectedDates,
        values,
      });

      toast.success(
        daysCount > 1
          ? `Restrictions updated & pushed for ${daysCount} days`
          : "Restrictions updated & pushed to OTAs",
        {
          description: `${resolvedRoomType} · ${ratePlan.title} (${formatDateRangeLabel(startDate, endDate)})`,
        },
      );

      // Local optimistic update
      const fallbackObj = values[0] || {};
      onSaved?.(ratePlan.id, selectedDates, fallbackObj);
      onClose();
    } catch (err) {
      toast.error("Failed to push restrictions to OTAs", {
        description: err.message,
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && !loading && onClose()}
    >
      <DialogContent className="sm:max-w-[720px] p-0 overflow-hidden bg-background shadow-2xl rounded-2xl">
        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* 1. STRENGTHENED MODAL HEADER                                         */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <div className="px-6 pt-6 pb-4 bg-gradient-to-b border-b-muted from-muted/30 to-background">
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-base font-semibold text-foreground tracking-tight">
              Edit Restrictions
            </DialogTitle>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col max-h-[80vh]">
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* ════════════════════════════════════════════════════════════════ */}
            {/* 2. DATE SCOPE (SCOPE OF THE OPERATION)                           */}
            {/* ════════════════════════════════════════════════════════════════ */}
            <div className="p-3.5 rounded-xl bg-muted/30 border-muted space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                    Date Range Scope
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    (Operation Target)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                  >
                    {daysCount > 0
                      ? `${daysCount} ${daysCount === 1 ? "day" : "days"} selected`
                      : "Invalid Range"}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground block">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="h-8 text-xs bg-background font-medium focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground block">
                    End Date
                  </label>
                  <Input
                    type="date"
                    min={startDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-8 text-xs bg-background font-medium focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {daysCount > 1
                    ? `Changes applied below will overwrite modified fields across all ${daysCount} selected dates (${formatDateRangeLabel(startDate, endDate)}).`
                    : `Editing restrictions for ${formatFullDateLabel(startDate)}.`}
                </span>
              </p>
            </div>

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* 3. TWO-COLUMN OPERATIONAL LAYOUT (NO NESTED CARDS)              */}
            {/* ════════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ── LEFT COLUMN: PRICING & STAY RULES ───────────────────────── */}
              <div className="space-y-4 border border-black">
                <div className="flex items-center justify-between pb-1 border-b border-border/60">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Pricing & Stay Rules
                    </h3>
                  </div>
                </div>

                {/* Rate Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                      Rate per Night
                      {existingAnalysis.isMixed.rate && !dirty.rate && (
                        <span className="text-[10px] font-normal text-amber-600 dark:text-amber-400">
                          (Mixed values)
                        </span>
                      )}
                    </label>
                    {dirty.rate && existingAnalysis.isMixed.rate && (
                      <button
                        type="button"
                        onClick={() => handleResetField("rate")}
                        className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                        title="Revert to keep existing rates unchanged"
                      >
                        <Undo2 className="w-2.5 h-2.5" /> Keep existing
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
                      {currencySymbol}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.rate}
                      onChange={(e) =>
                        handleFieldChange("rate", e.target.value)
                      }
                      placeholder={
                        existingAnalysis.isMixed.rate && !dirty.rate
                          ? "Mixed values across dates (No change)"
                          : "0.00"
                      }
                      className={`pl-7 pr-14 h-9 text-xs font-semibold focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 ${
                        dirty.rate ? "border-emerald-500 bg-emerald-500/5" : ""
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground pointer-events-none">
                      {currency}
                    </span>
                  </div>
                  {dirty.rate && daysCount > 1 && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Will set rate to {currencySymbol}
                      {form.rate || "0.00"} for all {daysCount} selected dates.
                    </p>
                  )}
                </div>

                {/* Length of Stay Restrictions */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Length of Stay Rules</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {/* MSA: Min Stay on Arrival */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label
                          className="text-[10px] font-semibold text-muted-foreground tracking-tight"
                          title="Minimum Stay on Arrival (MSA)"
                        >
                          Min Arrival{" "}
                          <span className="text-[9px] text-emerald-600 font-bold">
                            (MSA)
                          </span>
                        </label>
                      </div>
                      <Input
                        type="number"
                        min={1}
                        value={form.min_stay_arrival}
                        onChange={(e) =>
                          handleFieldChange("min_stay_arrival", e.target.value)
                        }
                        placeholder={
                          existingAnalysis.isMixed.min_stay_arrival &&
                          !dirty.min_stay_arrival
                            ? "Mixed"
                            : "1"
                        }
                        className={`h-8 text-xs text-center font-medium focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 ${
                          dirty.min_stay_arrival
                            ? "border-emerald-500 bg-emerald-500/5"
                            : ""
                        }`}
                      />
                      <span className="text-[9px] text-muted-foreground/70 block text-center">
                        Nights
                      </span>
                    </div>

                    {/* MST: Min Stay Through */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label
                          className="text-[10px] font-semibold text-muted-foreground tracking-tight"
                          title="Minimum Stay Through (MST)"
                        >
                          Min Through{" "}
                          <span className="text-[9px] text-emerald-600 font-bold">
                            (MST)
                          </span>
                        </label>
                      </div>
                      <Input
                        type="number"
                        min={1}
                        value={form.min_stay_through}
                        onChange={(e) =>
                          handleFieldChange("min_stay_through", e.target.value)
                        }
                        placeholder={
                          existingAnalysis.isMixed.min_stay_through &&
                          !dirty.min_stay_through
                            ? "Mixed"
                            : "1"
                        }
                        className={`h-8 text-xs text-center font-medium focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 ${
                          dirty.min_stay_through
                            ? "border-emerald-500 bg-emerald-500/5"
                            : ""
                        }`}
                      />
                      <span className="text-[9px] text-muted-foreground/70 block text-center">
                        Nights
                      </span>
                    </div>

                    {/* MXS: Max Stay */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label
                          className="text-[10px] font-semibold text-muted-foreground tracking-tight"
                          title="Maximum Stay (MXS)"
                        >
                          Max Stay{" "}
                          <span className="text-[9px] text-emerald-600 font-bold">
                            (MXS)
                          </span>
                        </label>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        value={form.max_stay}
                        onChange={(e) =>
                          handleFieldChange("max_stay", e.target.value)
                        }
                        placeholder={
                          existingAnalysis.isMixed.max_stay && !dirty.max_stay
                            ? "Mixed"
                            : "0"
                        }
                        className={`h-8 text-xs text-center font-medium focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 ${
                          dirty.max_stay
                            ? "border-emerald-500 bg-emerald-500/5"
                            : ""
                        }`}
                      />
                      <span className="text-[9px] text-muted-foreground/70 block text-center">
                        0 = none
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground/80 bg-muted/40 p-2 rounded-lg leading-relaxed">
                  <strong>LOS Tips:</strong> MSA applies to check-in dates; MST
                  applies to any stay spanning the selected dates; MXS limits
                  stay length.
                </div>
              </div>

              {/* ── RIGHT COLUMN: BOOKING CONTROLS ──────────────────────────── */}
              <div className="space-y-4 flex flex-col justify-between border border-black">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-border">
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Booking Controls
                      </h3>
                    </div>
                  </div>

                  {/* Closed to Arrival (CTA) */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg border-muted bg-card/60 hover:bg-muted/30 transition-colors">
                    <div className="space-y-0.5 pr-2">
                      <div className="flex items-center gap-1.5">
                        <label
                          htmlFor="cta-switch"
                          className="text-xs font-semibold text-foreground cursor-pointer"
                        >
                          Closed to Arrival (CTA)
                        </label>
                        {existingAnalysis.isMixed.closed_to_arrival &&
                          !dirty.closed_to_arrival && (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1 py-0 border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950/40"
                            >
                              Mixed
                            </Badge>
                          )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Block guest check-ins on selected dates
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="cta-switch"
                        checked={
                          dirty.closed_to_arrival
                            ? form.closed_to_arrival
                            : existingAnalysis.uniform.closed_to_arrival
                        }
                        onCheckedChange={(checked) =>
                          handleFieldChange("closed_to_arrival", checked)
                        }
                        className="data-[state=checked]:bg-emerald-600"
                      />
                      <span
                        className={`text-[11px] font-bold w-7 text-right ${
                          (
                            dirty.closed_to_arrival
                              ? form.closed_to_arrival
                              : existingAnalysis.uniform.closed_to_arrival
                          )
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {(
                          dirty.closed_to_arrival
                            ? form.closed_to_arrival
                            : existingAnalysis.uniform.closed_to_arrival
                        )
                          ? "ON"
                          : "OFF"}
                      </span>
                    </div>
                  </div>

                  {/* Closed to Departure (CTD) */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg border-muted bg-card/60 hover:bg-muted/30 transition-colors">
                    <div className="space-y-0.5 pr-2">
                      <div className="flex items-center gap-1.5">
                        <label
                          htmlFor="ctd-switch"
                          className="text-xs font-semibold text-foreground cursor-pointer"
                        >
                          Closed to Departure (CTD)
                        </label>
                        {existingAnalysis.isMixed.closed_to_departure &&
                          !dirty.closed_to_departure && (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1 py-0 border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950/40"
                            >
                              Mixed
                            </Badge>
                          )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Block guest check-outs on selected dates
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="ctd-switch"
                        checked={
                          dirty.closed_to_departure
                            ? form.closed_to_departure
                            : existingAnalysis.uniform.closed_to_departure
                        }
                        onCheckedChange={(checked) =>
                          handleFieldChange("closed_to_departure", checked)
                        }
                        className="data-[state=checked]:bg-emerald-600"
                      />
                      <span
                        className={`text-[11px] font-bold w-7 text-right ${
                          (
                            dirty.closed_to_departure
                              ? form.closed_to_departure
                              : existingAnalysis.uniform.closed_to_departure
                          )
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {(
                          dirty.closed_to_departure
                            ? form.closed_to_departure
                            : existingAnalysis.uniform.closed_to_departure
                        )
                          ? "ON"
                          : "OFF"}
                      </span>
                    </div>
                  </div>

                  {/* Stop Sell (SS) */}
                  <div
                    className={`p-2.5 rounded-lg border transition-colors ${
                      isStopSellActive
                        ? "border-amber-400/80 bg-amber-500/10 dark:bg-amber-950/30"
                        : "border-muted bg-card/60 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5 pr-2">
                        <div className="flex items-center gap-1.5">
                          <label
                            htmlFor="stop-sell-switch"
                            className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1"
                          >
                            Stop Sell (SS)
                            {isStopSellActive && (
                              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            )}
                          </label>
                          {existingAnalysis.isMixed.stop_sell &&
                            !dirty.stop_sell && (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1 py-0 border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950/40"
                              >
                                Mixed
                              </Badge>
                            )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Completely close sales for selected dates
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="stop-sell-switch"
                          checked={
                            dirty.stop_sell
                              ? form.stop_sell
                              : existingAnalysis.uniform.stop_sell
                          }
                          onCheckedChange={(checked) =>
                            handleFieldChange("stop_sell", checked)
                          }
                          className="data-[state=checked]:bg-amber-600"
                        />
                        <span
                          className={`text-[11px] font-bold w-7 text-right ${
                            isStopSellActive
                              ? "text-amber-600 dark:text-amber-400 font-extrabold"
                              : "text-muted-foreground"
                          }`}
                        >
                          {isStopSellActive ? "ON" : "OFF"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── High-Consequence Stop Sell Warning ─────────────────────── */}
                {isStopSellActive && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 animate-in fade-in-50">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-tight">
                      <p className="font-semibold">
                        Stop Sell Active: New bookings will NOT be accepted
                      </p>
                      <p className="text-amber-800/80 dark:text-amber-300/80 text-[10px] mt-0.5">
                        Inventory for {resolvedRoomType} ({ratePlan.title}) will
                        be closed across all connected OTA channels for the
                        selected {daysCount} {daysCount === 1 ? "day" : "days"}.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* 4. FOOTER WITH EXPLICIT OTA PUSH CONFIRMATION                        */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          <div className="px-6 py-3.5 bg-muted/40 border-t-muted border-border flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                Changes push live immediately to all connected OTA channels.
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="h-8.5 px-4 text-xs font-medium border-border"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={loading || daysCount === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 gap-1.5 h-8.5 px-4 text-xs font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Pushing to OTAs…</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>
                      {daysCount > 1
                        ? `Save & Push to OTAs (${daysCount} days)`
                        : "Save & Push to OTAs"}
                    </span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
