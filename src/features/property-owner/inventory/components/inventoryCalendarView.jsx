import { useMemo } from "react";
import {
  CalendarDays,
  ChevronDown,
  Loader2,
  BedDouble,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MONTH_NAMES, DOW_LABELS, toDateStr } from "../utils/dateUtils";

const DayCell = ({ date, value, max, isToday, isPast, isOutside, onEdit }) => {
  if (isOutside) {
    return <div className="rounded-xl min-h-[90px] bg-muted/10" />;
  }

  const pct = max > 0 ? value / max : 0;
  const isSoldOut = value === 0;
  const isLow = !isSoldOut && pct <= 0.3;

  const bgAccent = isPast
    ? "bg-muted/20"
    : isSoldOut
      ? "bg-red-50/60 dark:bg-red-900/10"
      : isLow
        ? "bg-amber-50/60 dark:bg-amber-900/10"
        : "bg-green-50/40 dark:bg-green-900/5";

  const barColor = isPast
    ? "bg-muted/50"
    : isSoldOut
      ? "bg-red-400"
      : isLow
        ? "bg-amber-400"
        : "bg-green-500";

  const badgeColor = isPast
    ? "text-foreground/30"
    : isSoldOut
      ? "text-red-500 font-bold"
      : isLow
        ? "text-amber-600 dark:text-amber-400 font-semibold"
        : "text-green-600 dark:text-green-400 font-semibold";

  return (
    <div
      onClick={!isPast ? onEdit : undefined}
      className={`group relative rounded-xl min-h-[90px] p-2 flex flex-col border transition-all duration-200 overflow-hidden
        ${bgAccent}
        ${
          isPast
            ? "border-border/20 cursor-default opacity-60"
            : "border-border/40 cursor-pointer hover:border-green-400/50 hover:shadow-md hover:shadow-green-500/10 hover:-translate-y-px"
        }
        ${isToday ? "ring-2 ring-green-400/70 border-green-400/40" : ""}
      `}
    >
      {/* Day number */}
      <span
        className={`text-xs font-bold leading-none mb-auto
          ${
            isToday
              ? "w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center"
              : isPast
                ? "text-foreground/30"
                : "text-foreground/70"
          }`}
      >
        {date.getUTCDate()}
      </span>

      {/* Availability info */}
      <div className="mt-2 space-y-1">
        {/* Fill bar */}
        <div className="w-full h-1 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.max(2, Math.round(pct * 100))}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className={`text-[11px] leading-none ${badgeColor}`}>
            {isSoldOut ? "Sold out" : `${value}/${max}`}
          </span>
          {!isPast && (
            <Pencil className="w-2.5 h-2.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>
    </div>
  );
};

export const InventoryCalendarView = ({
  roomTypes,
  activeRoomTypeId,
  setActiveRoomTypeId,
  activeRoomType,
  onMonthChange,
  handleThisMonth,
  handlePrevMonth,
  handleNextMonth,
  viewMonth,
  viewYear,
  gridLoading,
  calendarData,
  today,
  availMap,
  setEditCell,
}) => {
  // Generate 13 month options: from current month to next year's same month
  const monthOptions = useMemo(() => {
    const baseDate = today || new Date();
    const baseYear = baseDate.getUTCFullYear?.() ?? baseDate.getFullYear();
    const baseMonth = baseDate.getUTCMonth?.() ?? baseDate.getMonth();
    const options = [];
    for (let offset = 0; offset <= 12; offset++) {
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

  return (
    <>
      {/* Toolbar — fixed */}
      <div className="shrink-0 flex items-center justify-between gap-3 flex-wrap">
        {/* Room type dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-9 text-xs w-52 glass-filter-btn rounded-xl border-0 justify-between font-normal"
            >
              <span className="flex items-center gap-1.5 truncate">
                <BedDouble className="w-3.5 h-3.5 shrink-0 text-muted-foreground/60" />
                {activeRoomType?.title ?? "Select room type…"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground/50 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="glass-dropdown rounded-xl border-white/30 w-52">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
              Room Types
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {roomTypes.map((rt) => (
              <DropdownMenuItem
                key={rt.id}
                onClick={() => setActiveRoomTypeId(rt.id)}
                className={`text-xs rounded-lg cursor-pointer focus:bg-green-500/10 focus:text-green-600 dark:focus:text-green-400 ${
                  activeRoomTypeId === rt.id
                    ? "bg-green-500/10 text-green-600 dark:text-green-400 font-semibold"
                    : ""
                }`}
              >
                {rt.title}
                <span className="ml-auto text-[10px] font-bold text-muted-foreground/50">
                  ×{rt.count_of_rooms}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Month selector DropdownMenu */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-8 text-xs glass-filter-btn rounded-xl border-border/50 justify-between font-medium gap-2 min-w-44"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <CalendarDays className="w-3.5 h-3.5 text-muted-foreground/60" />
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glass-dropdown rounded-xl border-white/30 w-52 max-h-72 overflow-y-auto">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
                Select Month
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {monthOptions.map((opt) => {
                const isSelected =
                  opt.year === viewYear && opt.month === viewMonth;
                return (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => onMonthChange?.(opt.year, opt.month)}
                    className={`text-xs rounded-lg cursor-pointer focus:bg-green-500/10 focus:text-green-600 dark:focus:text-green-400 ${
                      isSelected
                        ? "bg-green-500/10 text-green-600 dark:text-green-400 font-semibold"
                        : ""
                    }`}
                  >
                    {opt.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          {gridLoading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-green-500 shrink-0" />
          )}
        </div>
      </div>

      {/* Calendar — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-border/50 bg-background/50 dark:bg-white/[0.03] backdrop-blur-sm">
        {/* Day-of-week header — sticky inside scroll */}
        <div className="sticky top-0 z-10 grid grid-cols-7 border-b border-border/40 bg-background/90 dark:bg-background/80 backdrop-blur-sm">
          {DOW_LABELS.map((d) => (
            <div
              key={d}
              className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-border/30 p-px">
          {calendarData.map((cell, idx) => {
            if (!cell.date) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="bg-background/80 dark:bg-background/20 min-h-[90px]"
                />
              );
            }
            const ds = toDateStr(cell.date);
            const isToday = ds === toDateStr(today);
            const isPast = cell.date < today;
            const rtMap = availMap[activeRoomType?.id] ?? {};
            const value =
              rtMap[ds] !== undefined
                ? rtMap[ds]
                : (activeRoomType?.count_of_rooms ?? 0);
            return (
              <div
                key={ds}
                className="bg-background/80 dark:bg-background/20 p-1"
              >
                <DayCell
                  date={cell.date}
                  value={value}
                  max={activeRoomType?.count_of_rooms ?? 0}
                  isToday={isToday}
                  isPast={isPast}
                  isOutside={false}
                  onEdit={() =>
                    setEditCell({
                      roomTypeId: activeRoomType.id,
                      date: ds,
                      value,
                    })
                  }
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend — fixed */}
      <div className="shrink-0 flex items-center gap-4 flex-wrap px-1">
        {[
          { color: "bg-green-500", label: "> 30% available" },
          { color: "bg-amber-400", label: "≤ 30% available" },
          { color: "bg-red-400", label: "Sold out" },
          {
            color: "bg-muted/50 border border-border/40",
            label: "Past / no data",
          },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-1.5 rounded-full ${color}`} />
            <span className="text-[10px] text-muted-foreground/60">
              {label}
            </span>
          </div>
        ))}
        <span className="ml-auto text-[10px] text-muted-foreground/40 flex items-center gap-1">
          <Pencil className="w-2.5 h-2.5" /> Click any future date to edit
        </span>
      </div>
    </>
  );
};
