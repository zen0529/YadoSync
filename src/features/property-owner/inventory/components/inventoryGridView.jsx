import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Search,
  X,
  Loader2,
  AlignJustify,
  Pencil,
  Check,
  Filter,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RestrictionEditModal } from "./RestrictionEditModal";
import {
  MONTH_NAMES,
  DOW_LABELS,
  toDateStr,
  daysInMonth,
} from "../utils/dateUtils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a rate stored in DB cents to a currency string. e.g. 450000 => "₱4,500" */
const formatRate = (cents, currency = "PHP") => {
  if (cents == null) return null;
  const major = cents / 100;
  try {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(major);
  } catch {
    return `${currency} ${major}`;
  }
};

// ─── Constants ────────────────────────────────────────────────────────────────

/** Restriction field definitions — matches ClearHost row order */
const RESTR_FIELDS = [
  {
    key: "closed_to_arrival",
    label: "CTA",
    type: "bool",
    tooltip: "Closed to Arrival",
    rowKey: "cta",
  },
  {
    key: "closed_to_departure",
    label: "CTD",
    type: "bool",
    tooltip: "Closed to Departure",
    rowKey: "ctd",
  },
  {
    key: "min_stay_arrival",
    label: "MSA",
    type: "num",
    tooltip: "Min Stay Arrival",
    rowKey: "msa",
  },
  {
    key: "min_stay_through",
    label: "MST",
    type: "num",
    tooltip: "Min Stay Through",
    rowKey: "mst",
  },
  {
    key: "max_stay",
    label: "MXS",
    type: "num",
    tooltip: "Max Stay (0 = none)",
    rowKey: "mxs",
  },
  {
    key: "stop_sell",
    label: "SS",
    type: "bool",
    tooltip: "Stop Sell",
    rowKey: "ss",
  },
];

/** Items shown as individual toggles in the restrictions dropdown */
const ROW_FILTER_ITEMS = [
  { rowKey: "rate", label: "Rate" },
  { rowKey: "cta", label: "Closed To Arrival" },
  { rowKey: "ctd", label: "Closed To Departure" },
  { rowKey: "msa", label: "Min Stay Arrival" },
  { rowKey: "mst", label: "Min Stay Through" },
  { rowKey: "mxs", label: "Max Stay" },
  { rowKey: "ss", label: "Stop Sell" },
];

const ALL_ROW_KEYS = new Set(ROW_FILTER_ITEMS.map((r) => r.rowKey));

// Fixed column pixel widths (used for sticky left offsets)
const C1 = 180; // room-type / rate-plan name column
const C2 = 96; // row-label column (AVL, RATE, CTA …)
const CD = 96; // each date column

// ─── Small sub-components ─────────────────────────────────────────────────────

/** Styled checkbox — blue when checked, empty border when not. */
const CheckboxCell = ({ checked }) => (
  <div
    className={`w-[15px] h-[15px] rounded-[3px] border-[1.5px] mx-auto flex items-center justify-center transition-colors ${
      checked ? "bg-blue-500 border-blue-500" : "border-gray-300 bg-white"
    }`}
  >
    {checked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
  </div>
);

/** Stepper display (decorative — clicking the cell opens the modal). */
const StepperDisplay = ({ value }) => (
  <div className="flex items-center justify-center gap-1.5">
    <span className="text-[11px] text-gray-300 font-medium select-none leading-none">
      −
    </span>
    <span className="text-[12px] font-medium text-gray-700 min-w-[14px] text-center leading-none">
      {value ?? 0}
    </span>
    <span className="text-[11px] text-gray-300 font-medium select-none leading-none">
      +
    </span>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const InventoryGridView = ({
  roomTypes = [],
  ratePlans = [],
  viewYear,
  viewMonth,
  onMonthChange,
  handleThisMonth,
  handlePrevMonth,
  handleNextMonth,
  gridLoading,
  availMap = {},
  restrMap = {},
  ratePlanRestrMap = {},
  today,
  setEditCell,
  channexPropertyId,
  propertyId,
  onRestrictionSaved,
}) => {
  // ── Scroll container ref ──────────────────────────────────────────────────
  const gridContainerRef = useRef(null);

  // ── Filter state ─────────────────────────────────────────────────────────
  const [showRatePlans, setShowRatePlans] = useState(true);
  const [visibleRows, setVisibleRows] = useState(new Set(ALL_ROW_KEYS));
  // Set of rate-plan IDs whose restriction rows are collapsed (rate row stays)
  const [collapsedRatePlans, setCollapsedRatePlans] = useState(new Set());

  // ── Other UI state ────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [editRestrCell, setEditRestrCell] = useState(null);

  // ── All days in the current month ────────────────────────────────────────
  const visibleDays = useMemo(() => {
    const total = daysInMonth(viewYear, viewMonth);
    const days = [];
    for (let d = 1; d <= total; d++) {
      days.push(new Date(Date.UTC(viewYear, viewMonth, d)));
    }
    return days;
  }, [viewYear, viewMonth]);

  const todayStr = toDateStr(today);

  // ── Auto-scroll to today's date column ────────────────────────────────────
  useEffect(() => {
    const todayIndex = visibleDays.findIndex((d) => toDateStr(d) === todayStr);
    const targetScroll = todayIndex > 0 ? todayIndex * CD : 0;

    const performScroll = () => {
      if (gridContainerRef.current) {
        gridContainerRef.current.scrollLeft = targetScroll;
      }
    };

    performScroll();
    const rafId = requestAnimationFrame(performScroll);
    return () => cancelAnimationFrame(rafId);
  }, [viewYear, viewMonth, visibleDays, todayStr]);

  // ── Header label: "August 2026" ───────────────────────────────────────────
  const dateRangeLabel = `${MONTH_NAMES[viewMonth]} ${viewYear}`;

  // ── Month picker options (past 3 → future 12) ─────────────────────────────
  const monthOptions = useMemo(() => {
    const baseDate = today || new Date();
    const baseYear = baseDate.getUTCFullYear?.() ?? baseDate.getFullYear();
    const baseMonth = baseDate.getUTCMonth?.() ?? baseDate.getMonth();
    const options = [];
    for (let offset = -3; offset <= 12; offset++) {
      const d = new Date(Date.UTC(baseYear, baseMonth + offset, 1));
      const y = d.getUTCFullYear();
      const m = d.getUTCMonth();
      options.push({
        value: `${y}-${m}`,
        year: y,
        month: m,
        label: `${MONTH_NAMES[m]} ${y}`,
      });
    }
    return options;
  }, [today]);

  // ── Filtered room types ───────────────────────────────────────────────────
  const filteredRoomTypes = useMemo(() => {
    if (!searchQuery.trim()) return roomTypes;
    const q = searchQuery.toLowerCase().trim();
    return roomTypes.filter((rt) => rt.title?.toLowerCase().includes(q));
  }, [roomTypes, searchQuery]);

  // ── Rate plans grouped by room type ──────────────────────────────────────
  const ratePlansByRoomType = useMemo(() => {
    const map = {};
    for (const rp of ratePlans) {
      if (!map[rp.room_type_id]) map[rp.room_type_id] = [];
      map[rp.room_type_id].push(rp);
    }
    return map;
  }, [ratePlans]);

  // ── Visible restriction fields (derived from visibleRows) ─────────────────
  const visibleRestrFields = RESTR_FIELDS.filter((f) =>
    visibleRows.has(f.rowKey),
  );

  // ── Month navigation ──────────────────────────────────────────────────────
  const handlePrevWeek = () => handlePrevMonth?.();
  const handleNextWeek = () => handleNextMonth?.();

  // ── Toggle helpers ────────────────────────────────────────────────────────
  const toggleRatePlanCollapse = (rpId) => {
    setCollapsedRatePlans((prev) => {
      const next = new Set(prev);
      if (next.has(rpId)) next.delete(rpId);
      else next.add(rpId);
      return next;
    });
  };

  const toggleRowKey = (rowKey) => {
    setShowRatePlans(true);
    setVisibleRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowKey)) next.delete(rowKey);
      else next.add(rowKey);
      return next;
    });
  };

  // ── Dropdown label — mirrors ClearHost: "N restrictions" ─────────────────
  const dropdownLabel = showRatePlans
    ? `${visibleRows.size} restriction${visibleRows.size !== 1 ? "s" : ""}`
    : "Only Availability";

  // ── Shared sticky-cell backgrounds ───────────────────────────────────────
  // Using explicit bg colours so cells don't bleed through when scrolling
  const hdrBg = "bg-[#f8f9fa]";
  const bodyBg = "bg-white";

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TOOLBAR                                                             */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="shrink-0 flex items-center justify-between gap-4 flex-wrap">
        {/* Search */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-gray-400 pointer-events-none" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rooms…"
            className="h-8 pl-8 pr-7 text-xs rounded-lg border border-gray-200 bg-white focus-visible:ring-1 focus-visible:ring-violet-400 focus-visible:border-violet-400 w-44 placeholder:text-gray-400 text-gray-700 shadow-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Week navigation — centre */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevWeek}
            className="w-7 h-7 rounded border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 text-gray-500 transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Date range — click to pick a month */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="text-[14px] font-semibold text-gray-800 hover:text-violet-600 transition-colors px-2 min-w-[180px] text-center"
              >
                {dateRangeLabel}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52 max-h-72 overflow-y-auto">
              {monthOptions.map((opt) => {
                const isSelected =
                  opt.year === viewYear && opt.month === viewMonth;
                return (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => onMonthChange?.(opt.year, opt.month)}
                    className={`text-xs cursor-pointer ${
                      isSelected ? "font-bold text-violet-600" : ""
                    }`}
                  >
                    {opt.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={handleNextWeek}
            className="w-7 h-7 rounded border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 text-gray-500 transition-colors"
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              handleThisMonth?.();
              const todayIdx = visibleDays.findIndex(
                (d) => toDateStr(d) === todayStr,
              );
              if (todayIdx !== -1 && gridContainerRef.current) {
                gridContainerRef.current.scrollTo({
                  left: todayIdx * CD,
                  behavior: "smooth",
                });
              }
            }}
            className="h-7 px-2.5 rounded border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors shadow-none"
          >
            Today
          </button>

          {gridLoading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500 ml-1" />
          )}
        </div>

        {/* Restrictions dropdown — right */}
        <div className="flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs transition-colors"
              >
                <span className="text-gray-500 font-medium">Restrictions:</span>
                <span className="text-gray-800 font-semibold">
                  {dropdownLabel}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {/* Preset shortcuts */}
              <DropdownMenuItem
                onClick={() => {
                  setShowRatePlans(false);
                  setVisibleRows(new Set());
                }}
                className="text-xs cursor-pointer"
              >
                Only Availability
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setShowRatePlans(true);
                  setVisibleRows(new Set(["rate"]));
                }}
                className="text-xs cursor-pointer"
              >
                Rate And Availability
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setShowRatePlans(true);
                  setVisibleRows(new Set(ALL_ROW_KEYS));
                }}
                className="text-xs cursor-pointer"
              >
                All Restrictions
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Individual toggles */}
              {ROW_FILTER_ITEMS.map((item) => (
                <DropdownMenuCheckboxItem
                  key={item.rowKey}
                  checked={showRatePlans && visibleRows.has(item.rowKey)}
                  onCheckedChange={() => toggleRowKey(item.rowKey)}
                  className="text-xs cursor-pointer font-medium"
                >
                  {item.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filter icon button (decorative, matches ClearHost layout) */}
          <button
            type="button"
            className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-500 transition-colors"
            title="Filter options"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* GRID TABLE                                                          */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div
        ref={gridContainerRef}
        className="flex-1 min-h-0 overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <table className="border-collapse text-left">
          {/* ── Sticky Date Header ── */}
          <thead>
            <tr className="sticky top-0 z-20 border-b border-gray-200">
              {/* Corner cell — spans both left columns (C1 + C2) */}
              <th
                colSpan={2}
                className={`sticky left-0 z-30 ${hdrBg} border-r border-gray-200 px-4 py-3 text-left`}
                style={{ width: C1 + C2, minWidth: C1 + C2 }}
              >
                <span className="text-[11px] font-semibold text-gray-500 tracking-wide">
                  Room Types and Rate Plans
                </span>
              </th>

              {/* Date columns */}
              {visibleDays.map((dateObj) => {
                const ds = toDateStr(dateObj);
                const isToday = ds === todayStr;
                const dow = dateObj.getUTCDay(); // 0=Sun, 6=Sat
                const isWeekend = dow === 0 || dow === 6;

                return (
                  <th
                    key={ds}
                    className={`text-center border-r border-gray-200 py-2.5 px-2 ${
                      isToday
                        ? "bg-violet-600"
                        : isWeekend
                          ? "bg-gray-100"
                          : hdrBg
                    }`}
                    style={{ width: CD, minWidth: CD }}
                  >
                    <div
                      className={`text-[9px] font-bold uppercase tracking-widest leading-none ${
                        isToday ? "text-violet-200" : "text-gray-400"
                      }`}
                    >
                      {DOW_LABELS[dow]}
                    </div>
                    <div
                      className={`text-[13px] font-bold leading-tight mt-0.5 ${
                        isToday
                          ? "text-white"
                          : isWeekend
                            ? "text-gray-600"
                            : "text-gray-700"
                      }`}
                    >
                      {/* ClearHost format: "8/4" = month/day */}
                      {dateObj.getUTCMonth() + 1}/{dateObj.getUTCDate()}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {filteredRoomTypes.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleDays.length + 2}
                  className="py-16 text-center text-xs text-gray-400"
                >
                  No room types match &quot;{searchQuery}&quot;
                </td>
              </tr>
            ) : (
              filteredRoomTypes.map((rt, rtIdx) => {
                const rtMap = availMap[rt.id] ?? {};
                const roomRatePlans = ratePlansByRoomType[rt.id] ?? [];

                return (
                  <React.Fragment key={`rt-${rt.id}`}>
                    {/* ══════════════════════════════════════════════════════ */}
                    {/* ROOM TYPE ROW — Col1: room name │ Col2: "AVL"         */}
                    {/* ══════════════════════════════════════════════════════ */}
                    <tr
                      className={`border-b border-gray-200 ${hdrBg} ${
                        rtIdx > 0 ? "border-t-2 border-t-gray-300" : ""
                      }`}
                    >
                      {/* Col 1: Room type name + hamburger icon */}
                      <td
                        className={`sticky left-0 z-10 ${hdrBg} border-r border-gray-200 px-4 py-2.5`}
                        style={{ width: C1, minWidth: C1 }}
                      >
                        <div className="flex items-center gap-2">
                          <AlignJustify className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="text-[13px] font-bold text-gray-800 truncate">
                            {rt.title}
                          </span>
                        </div>
                      </td>

                      {/* Col 2: "AVL" row label */}
                      <td
                        className={`sticky z-10 ${hdrBg} border-r border-gray-200 px-3 py-2.5`}
                        style={{ left: C1, width: C2, minWidth: C2 }}
                        title="Availability"
                      >
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                          AVL
                        </span>
                      </td>

                      {/* Availability cells */}
                      {visibleDays.map((dateObj) => {
                        const ds = toDateStr(dateObj);
                        const isToday = ds === todayStr;
                        const isPast = dateObj < today;
                        const max = rt.count_of_rooms ?? 0;
                        const avail = rtMap[ds] !== undefined ? rtMap[ds] : max;
                        const occupancy =
                          max > 0 ? Math.round(((max - avail) / max) * 100) : 0;
                        const isSoldOut = avail === 0;
                        const isLow = !isSoldOut && occupancy >= 60;

                        const cellBg = isPast
                          ? ""
                          : isSoldOut
                            ? "bg-orange-50"
                            : isLow
                              ? "bg-amber-50"
                              : "bg-green-50/70";

                        const cellText = isPast
                          ? "text-gray-400"
                          : isSoldOut
                            ? "text-orange-600"
                            : isLow
                              ? "text-amber-700"
                              : "text-green-700";

                        return (
                          <td
                            key={ds}
                            onClick={
                              !isPast
                                ? () =>
                                    setEditCell({
                                      roomTypeId: rt.id,
                                      date: ds,
                                      value: avail,
                                    })
                                : undefined
                            }
                            className={`border-r border-gray-100 text-center transition-colors group ${cellBg} ${
                              isToday
                                ? "outline outline-1 outline-violet-400/40 -outline-offset-1"
                                : ""
                            } ${
                              !isPast
                                ? "cursor-pointer hover:brightness-95"
                                : "opacity-50"
                            }`}
                            style={{ width: CD, minWidth: CD }}
                          >
                            <div
                              className={`flex items-center justify-center gap-1 py-2.5 ${cellText}`}
                            >
                              {/* Format matches ClearHost: "04 (0%)" */}
                              <span className="text-[12px] font-semibold tabular-nums">
                                {String(avail).padStart(2, "0")}
                              </span>
                              <span className="text-[10px] text-gray-400 font-normal">
                                ({occupancy}%)
                              </span>
                              {!isPast && (
                                <Pencil className="w-2.5 h-2.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* ══════════════════════════════════════════════════════ */}
                    {/* RATE PLAN ROWS                                        */}
                    {/* ══════════════════════════════════════════════════════ */}
                    {showRatePlans &&
                      roomRatePlans.map((rp, rpIdx) => {
                        const rpDateMap = ratePlanRestrMap[rp.id] ?? {};
                        const isCollapsed = collapsedRatePlans.has(rp.id);
                        const showRate = visibleRows.has("rate");

                        return (
                          <React.Fragment key={`rp-${rp.id}`}>
                            {/* Rate-plan row: Col1=name+chevron │ Col2=RATE badge */}
                            <tr className="border-b border-gray-100 bg-white hover:bg-gray-50/50 transition-colors">
                              {/* Col 1: Rate plan name + collapse toggle */}
                              <td
                                className={`sticky left-0 z-10 ${bodyBg} border-r border-gray-200 px-4 py-0 cursor-pointer select-none`}
                                style={{ width: C1, minWidth: C1 }}
                                onClick={() => toggleRatePlanCollapse(rp.id)}
                              >
                                <div className="flex items-center gap-1.5 py-2">
                                  {isCollapsed ? (
                                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  )}
                                  <span className="text-[12px] font-medium text-gray-700 truncate">
                                    {rp.title}
                                  </span>
                                </div>
                              </td>

                              {/* Col 2: "RATE" label + plan index badge */}
                              <td
                                className={`sticky z-10 ${bodyBg} border-r border-gray-200 px-2`}
                                style={{ left: C1, width: C2, minWidth: C2 }}
                              >
                                <div className="flex items-center gap-1 py-2">
                                  <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                    RATE
                                  </span>
                                  <span className="flex items-center gap-0.5 text-[10px] text-gray-400 font-semibold">
                                    <User className="w-2.5 h-2.5" />
                                    {rp.occupancy ?? 1}
                                  </span>
                                </div>
                              </td>

                              {/* Rate value cells */}
                              {visibleDays.map((dateObj) => {
                                const ds = toDateStr(dateObj);
                                const isToday = ds === todayStr;
                                const isPast = dateObj < today;
                                const restrObj = rpDateMap[ds];
                                const rateVal = restrObj?.rate;
                                const rateStr =
                                  showRate && restrObj != null
                                    ? formatRate(rateVal, rp.currency || "PHP")
                                    : null;

                                return (
                                  <td
                                    key={ds}
                                    onClick={
                                      !isPast
                                        ? () =>
                                            setEditRestrCell({
                                              ratePlan: rp,
                                              roomTypeName: rt.title,
                                              date: ds,
                                              currentRestr: restrObj,
                                            })
                                        : undefined
                                    }
                                    className={`border-r border-gray-100 text-center py-2.5 transition-colors ${
                                      isToday ? "bg-violet-50/40" : ""
                                    } ${
                                      !isPast
                                        ? "cursor-pointer hover:bg-gray-50"
                                        : "opacity-50"
                                    }`}
                                    style={{ width: CD, minWidth: CD }}
                                  >
                                    <span
                                      className={`text-[12px] font-medium ${
                                        rateStr == null
                                          ? "text-gray-300"
                                          : "text-gray-800"
                                      }`}
                                    >
                                      {rateStr ?? "—"}
                                    </span>
                                  </td>
                                );
                              })}
                            </tr>

                            {/* ── Restriction rows (when rate plan is expanded) ── */}
                            {!isCollapsed &&
                              visibleRestrFields.map((field) => (
                                <tr
                                  key={`rp-${rp.id}-${field.key}`}
                                  className="border-b border-gray-100 bg-white hover:bg-gray-50/50 transition-colors"
                                >
                                  {/* Col 1: empty spacer */}
                                  <td
                                    className={`sticky left-0 z-10 ${bodyBg} border-r border-gray-200`}
                                    style={{ width: C1, minWidth: C1 }}
                                  />

                                  {/* Col 2: restriction label */}
                                  <td
                                    className={`sticky z-10 ${bodyBg} border-r border-gray-200 px-3`}
                                    style={{
                                      left: C1,
                                      width: C2,
                                      minWidth: C2,
                                    }}
                                    title={field.tooltip}
                                  >
                                    <div className="flex items-center gap-1 py-2">
                                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                                        {field.label}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Value cells */}
                                  {visibleDays.map((dateObj) => {
                                    const ds = toDateStr(dateObj);
                                    const isToday = ds === todayStr;
                                    const isPast = dateObj < today;
                                    const restrObj = rpDateMap[ds];
                                    const rawVal = restrObj?.[field.key];

                                    // Decide cell content
                                    let cellContent;
                                    if (restrObj == null) {
                                      cellContent = (
                                        <span className="text-[11px] text-gray-200 select-none">
                                          —
                                        </span>
                                      );
                                    } else if (field.type === "bool") {
                                      cellContent = (
                                        <CheckboxCell checked={!!rawVal} />
                                      );
                                    } else {
                                      // Numeric — MXS=0 means "no maximum"
                                      const isNoMax =
                                        field.key === "max_stay" &&
                                        (rawVal === 0 || rawVal == null);
                                      cellContent = isNoMax ? (
                                        <span className="text-[11px] text-gray-300 select-none">
                                          —
                                        </span>
                                      ) : (
                                        <StepperDisplay value={rawVal ?? 0} />
                                      );
                                    }

                                    return (
                                      <td
                                        key={ds}
                                        onClick={
                                          !isPast
                                            ? () =>
                                                setEditRestrCell({
                                                  ratePlan: rp,
                                                  roomTypeName: rt.title,
                                                  date: ds,
                                                  currentRestr: restrObj,
                                                })
                                            : undefined
                                        }
                                        className={`border-r border-gray-100 text-center py-2 transition-colors ${
                                          isToday ? "bg-violet-50/30" : ""
                                        } ${
                                          !isPast
                                            ? "cursor-pointer hover:bg-gray-50"
                                            : "opacity-40"
                                        }`}
                                        style={{ width: CD, minWidth: CD }}
                                      >
                                        {cellContent}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                          </React.Fragment>
                        );
                      })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* LEGEND                                                              */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="shrink-0 flex items-center gap-4 flex-wrap">
        {[
          { color: "bg-green-400", label: "Available" },
          { color: "bg-amber-400", label: "Low (≥60% sold)" },
          { color: "bg-orange-400", label: "Sold out" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-sm ${color}`} />
            <span className="text-[10px] text-gray-500">{label}</span>
          </div>
        ))}
        <span className="ml-auto text-[10px] text-gray-400 flex items-center gap-1">
          <Pencil className="w-2.5 h-2.5" /> Click any cell to edit
        </span>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* RESTRICTION EDIT MODAL                                              */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <RestrictionEditModal
        open={!!editRestrCell}
        onClose={() => setEditRestrCell(null)}
        ratePlan={editRestrCell?.ratePlan}
        roomTypeName={editRestrCell?.roomTypeName}
        date={editRestrCell?.date}
        currentRestr={editRestrCell?.currentRestr}
        ratePlanRestrMap={ratePlanRestrMap}
        channexPropertyId={channexPropertyId}
        propertyId={propertyId}
        onSaved={(ratePlanId, dateOrDates, updatedObj) => {
          onRestrictionSaved?.(ratePlanId, dateOrDates, updatedObj);
          setEditRestrCell(null);
        }}
      />
    </>
  );
};
