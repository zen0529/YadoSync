import { useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CalendarRateRow } from "./CalendarRateRow";

export const TapeChartGrid = ({ days, groups, searchQuery, onSearchChange, onBookingClick }) => {
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const query = searchQuery.trim().toLowerCase();
  const visibleGroups = groups.map((group) => {
    if (!query || group.title.toLowerCase().includes(query)) return group;
    const rows = group.rows.filter((row) => row.title.toLowerCase().includes(query));
    return rows.length ? { ...group, rows } : null;
  }).filter(Boolean);
  const roomCount = groups.reduce((sum, group) => sum + (group.countOfRooms || 0), 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-sm">
      <div className="relative min-h-0 flex-1 overflow-auto">
        <div className="w-max min-w-full">
          <div className="sticky top-0 z-30 flex border-b border-slate-200 dark:border-slate-800 bg-card shadow-sm">
            <div className="sticky left-0 z-40 flex w-[280px] shrink-0 flex-col gap-2 border-r border-slate-100 dark:border-slate-800 bg-card p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">Room types</span>
                <span className="text-xs text-muted-foreground">{roomCount} rooms</span>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Search room types or rate plans"
                  aria-label="Search room types or rate plans"
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>
            {days.map((day) => (
              <div
                key={format(day, "yyyy-MM-dd")}
                className={`flex w-[76px] shrink-0 flex-col items-center justify-center border-r border-slate-100 dark:border-slate-800 py-2 text-xs ${[0, 6].includes(day.getDay()) ? "bg-muted/70" : "bg-card"}`}
              >
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">{format(day, "EEE")}</span>
                <span className="font-semibold text-foreground">{format(day, "MMM d")}</span>
              </div>
            ))}
          </div>

          {visibleGroups.length ? visibleGroups.map((group) => {
            const collapsed = Boolean(collapsedGroups[group.id]);
            return (
              <div key={group.id}>
                <div className="flex border-b border-slate-100 dark:border-slate-800 bg-muted/50">
                  <button
                    type="button"
                    onClick={() => setCollapsedGroups((current) => ({ ...current, [group.id]: !current[group.id] }))}
                    aria-expanded={!collapsed}
                    className="sticky left-0 z-20 flex w-[280px] shrink-0 items-center gap-2 border-r border-slate-100 dark:border-slate-800 bg-muted px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-accent"
                  >
                    {collapsed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                    <span className="min-w-0 flex-1 truncate">{group.title}</span>
                    {group.countOfRooms != null && (
                      <span className="shrink-0 text-muted-foreground">{group.countOfRooms} rooms</span>
                    )}
                    {group.overbooked && (
                      <span className="shrink-0 rounded bg-destructive px-1.5 py-0.5 text-[10px] text-white" title="More bookings than rooms on at least one visible date">
                        {group.maxOccupied}/{group.countOfRooms} Overbooked
                      </span>
                    )}
                  </button>
                  <div className="flex">
                    {days.map((day, index) => {
                      const occupied = group.occupancy?.[index] ?? 0;
                      const isOverbooked = group.countOfRooms != null && occupied > group.countOfRooms;
                      return (
                        <div key={format(day, "yyyy-MM-dd")} className="flex h-10 w-[76px] shrink-0 items-center justify-center border-r border-slate-100/70 dark:border-slate-800/70 text-[11px]">
                          {group.countOfRooms != null && occupied > 0 && (
                            <span className={isOverbooked ? "font-bold text-destructive" : "text-muted-foreground"}>
                              {occupied}/{group.countOfRooms}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {!collapsed && (group.rows.length
                  ? group.rows.map((row) => (
                    <CalendarRateRow key={row.id} row={row} days={days} onBookingClick={onBookingClick} />
                  ))
                  : <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-4 text-xs text-muted-foreground">No rate plans for this room type.</div>)}
              </div>
            );
          }) : (
            <div className="p-6 text-sm text-muted-foreground">
              {query ? "No room types or rate plans match your search." : "No room types for this property yet."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
