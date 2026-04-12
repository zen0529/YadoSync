import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlatformBadge } from "@/components/PlatformBadge";
import { SyncBadge } from "@/components/SyncBadge";
import { BOOKINGS, RESORTS } from "@/data/constants";
import { BOOKED_DATES, PARTIAL_DATES } from "../data/constants";
import {
  User,
  Building2,
  Globe,
  RefreshCw,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CalendarCheck,
} from "lucide-react";

export const BookingsPage = () => {
  const [platform, setPlatform] = useState("all");
  const [resort, setResort]     = useState("all");

  const filtered = BOOKINGS.filter(b =>
    (platform === "all" || b.platform === platform) &&
    (resort   === "all" || b.resort   === resort)
  );

  const pendingCount = BOOKINGS.filter(b => b.sync === "pending").length;

  return (
    <>
      {/* Alert Banner */}
      {pendingCount > 0 && (
        <div className="glass-card rounded-xl px-4 py-3 text-xs flex justify-between items-center mb-4 border-amber-200/50">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{pendingCount} booking{pendingCount > 1 ? "s have" : " has"} pending sync — dates may not be blocked on all platforms yet.</span>
          </div>
          <span className="text-green-600 font-semibold cursor-pointer hover:underline whitespace-nowrap ml-3">Resolve now &rarr;</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        {/* ALL BOOKINGS TABLE */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-white/20">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/20">
                <CalendarCheck className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-foreground/85">All Bookings</h3>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-12 h-12 rounded-full bg-green-100/60 flex items-center justify-center mb-3">
                <CalendarCheck className="w-6 h-6 text-green-500/60" />
              </div>
              <p className="text-sm font-medium text-foreground/60 mb-1">No bookings found</p>
              <p className="text-xs text-muted-foreground/60">Try adjusting your filters to see results.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/15">
              {/* Table Header */}
              <div className="grid grid-cols-[1fr_1fr_0.7fr_auto_auto] gap-3 px-5 py-2.5 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                <div className="flex items-center gap-1.5"><User className="w-3 h-3" /> Guest</div>
                <div className="flex items-center gap-1.5"><Building2 className="w-3 h-3" /> Resort</div>
                <div className="flex items-center gap-1.5"><CalendarDays className="w-3 h-3" /> Dates</div>
                <div className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> Platform</div>
                <div className="flex items-center gap-1.5"><RefreshCw className="w-3 h-3" /> Sync</div>
              </div>

              {/* Table Rows */}
              {filtered.map((b) => (
                <div
                  key={b.id}
                  className="grid grid-cols-[1fr_1fr_0.7fr_auto_auto] gap-3 px-5 py-3.5 items-center hover:bg-white/20 transition-colors duration-200 cursor-default"
                >
                  <span className="text-sm font-medium text-foreground/85">{b.guest}</span>
                  <span className="text-sm text-muted-foreground/70">{b.resort}</span>
                  <span className="text-xs text-muted-foreground/70">{b.dates}</span>
                  <PlatformBadge platform={b.platform} />
                  <SyncBadge sync={b.sync} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AVAILABILITY CALENDAR */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-white/20">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
                <CalendarDays className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-foreground/85">Availability Calendar</h3>
            </div>
            <Select>
              <SelectTrigger className="h-7 text-xs w-36 glass-filter-btn rounded-lg border-0">
                <SelectValue placeholder="Coral Bay Resort" />
              </SelectTrigger>
              <SelectContent className="glass-dropdown rounded-xl border-white/30">
                {RESORTS.map(r => <SelectItem key={r.name} value={r.name} className="text-xs rounded-lg">{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="p-4">
            {/* Month Navigation */}
            <div className="flex justify-between items-center mb-3">
              <button className="w-7 h-7 rounded-lg hover:bg-white/30 flex items-center justify-center transition-colors" aria-label="Previous month">
                <ChevronLeft className="w-4 h-4 text-muted-foreground/70" />
              </button>
              <span className="text-xs font-semibold text-foreground/80">April 2026</span>
              <button className="w-7 h-7 rounded-lg hover:bg-white/30 flex items-center justify-center transition-colors" aria-label="Next month">
                <ChevronRight className="w-4 h-4 text-muted-foreground/70" />
              </button>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 mb-3">
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="w-3 h-3 rounded-sm bg-green-500" aria-hidden="true" />
                <span className="text-muted-foreground/70 font-medium">Booked</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="w-3 h-3 rounded-sm bg-amber-400" aria-hidden="true" />
                <span className="text-muted-foreground/70 font-medium">Partial</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="w-3 h-3 rounded-sm bg-white/50 border border-black/10" aria-hidden="true" />
                <span className="text-muted-foreground/70 font-medium">Available</span>
              </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                <div key={d} className="text-center text-[9px] text-muted-foreground/60 font-semibold uppercase" role="columnheader">{d}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-0.5" role="grid" aria-label="April 2026 availability calendar">
              {[...Array(3).fill(null), ...Array(30).fill(0).map((_,i)=>i+1), null].map((day,i) => {
                const booked  = BOOKED_DATES.includes(day);
                const partial = PARTIAL_DATES.includes(day);
                return (
                  <div
                    key={i}
                    role={day ? "gridcell" : "presentation"}
                    aria-label={day ? `April ${day}${booked ? ", booked" : partial ? ", partially booked" : ", available"}` : undefined}
                    tabIndex={day ? 0 : undefined}
                    className={`aspect-square flex items-center justify-center rounded-lg text-[11px] transition-colors duration-150
                      ${booked  ? "bg-green-500 text-white font-semibold shadow-sm shadow-green-500/20" :
                        partial ? "bg-amber-100 text-amber-600 font-semibold" :
                        day     ? "text-foreground/70 hover:bg-white/40 cursor-pointer focus:ring-2 focus:ring-green-500/30 focus:outline-none" : ""}`}
                  >
                    {day || ""}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
