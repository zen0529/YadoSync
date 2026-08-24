import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlatformBadge } from "@/components/PlatformBadge";
import { TapeChart } from "../components/TapeChart";
import { AddBookingModal } from "../components/AddBookingModal";
import { useBookings } from "../hooks/useBookings";
import {
  User,
  Building2,
  Globe,
  CalendarDays,
  AlertTriangle,
  CalendarCheck,
  List,
  RefreshCw,
  Loader2,
} from "lucide-react";

// OTA names that have appeared in real data — used to populate the platform filter
const KNOWN_OTAS = ["Booking.com", "Airbnb", "Expedia", "Agoda", "VRBO"];

/** Format a date string YYYY-MM-DD to a short human label */
const fmtDate = (d) => {
  if (!d) return "–";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export const BookingsPage = () => {
  const [otaFilter, setOtaFilter]   = useState("all");
  const [view, setView]             = useState("calendar"); // "list" | "calendar"
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Real data from Supabase — refreshes every 60 seconds
  const { data: bookings = [], isLoading, isError, refetch, isFetching } = useBookings();

  // Client-side filter by OTA
  const filtered = bookings.filter(
    (b) => otaFilter === "all" || b.ota_name === otaFilter,
  );

  // Bookings that need attention
  const pendingModCount = bookings.filter((b) => b.status === "modified_pending").length;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">

      {/* Modified-pending alert banner */}
      {pendingModCount > 0 && (
        <div className="glass-card rounded-xl px-4 py-3 text-xs flex justify-between items-center mb-4 border-amber-200/50 shrink-0">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              {pendingModCount} booking{pendingModCount > 1 ? "s have" : " has"} pending
              modification{pendingModCount > 1 ? "s" : ""} — please review and confirm.
            </span>
          </div>
          <span className="text-amber-600 font-semibold cursor-pointer hover:underline whitespace-nowrap ml-3">
            Review now →
          </span>
        </div>
      )}

      {/* View Toggle & Filters Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2 bg-white/10 dark:bg-black/20 p-1 rounded-xl glass-card">
          <button
            onClick={() => setView("calendar")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${view === "calendar" ? "bg-white dark:bg-white/10 text-foreground shadow-sm" : "text-muted-foreground/70 hover:text-foreground"}`}
          >
            <CalendarDays className="w-3.5 h-3.5" /> Tape Chart
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${view === "list" ? "bg-white dark:bg-white/10 text-foreground shadow-sm" : "text-muted-foreground/70 hover:text-foreground"}`}
          >
            <List className="w-3.5 h-3.5" /> List View
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Manual refresh button */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh bookings"
            className="p-2 rounded-lg glass-filter-btn text-muted-foreground/70 hover:text-foreground disabled:opacity-40 transition-colors"
          >
            {isFetching
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <RefreshCw className="w-3.5 h-3.5" />}
          </button>

          {/* Platform / OTA filter */}
          <Select value={otaFilter} onValueChange={setOtaFilter}>
            <SelectTrigger className="h-9 text-xs w-40 glass-filter-btn rounded-xl border-0">
              <SelectValue placeholder="Platform: All" />
            </SelectTrigger>
            <SelectContent className="glass-dropdown rounded-xl border-white/30">
              <SelectItem value="all" className="text-xs rounded-lg">Platform: All</SelectItem>
              {KNOWN_OTAS.map((ota) => (
                <SelectItem key={ota} value={ota} className="text-xs rounded-lg">{ota}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0">
        {view === "calendar" ? (
          <TapeChart
            bookings={filtered}
            selectedResort="all"
            selectedPlatform={otaFilter}
            onAddClick={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden h-full flex flex-col">
            <div className="px-5 py-4 flex items-center justify-between border-b border-white/20 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/20">
                  <CalendarCheck className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-foreground/85">All Bookings</h3>
              </div>
              <span className="text-xs text-muted-foreground/50">
                {isLoading ? "Loading…" : `${filtered.length} booking${filtered.length !== 1 ? "s" : ""}`}
              </span>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              {/* Loading state */}
              {isLoading && (
                <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground/50">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading bookings…</span>
                </div>
              )}

              {/* Error state */}
              {isError && !isLoading && (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <AlertTriangle className="w-8 h-8 text-amber-400/60 mb-3" />
                  <p className="text-sm font-medium text-foreground/60 mb-1">Failed to load bookings</p>
                  <button
                    onClick={() => refetch()}
                    className="text-xs text-primary hover:underline mt-1"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* Empty state */}
              {!isLoading && !isError && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <div className="w-12 h-12 rounded-full bg-green-100/60 flex items-center justify-center mb-3">
                    <CalendarCheck className="w-6 h-6 text-green-500/60" />
                  </div>
                  <p className="text-sm font-medium text-foreground/60 mb-1">No bookings yet</p>
                  <p className="text-xs text-muted-foreground/60 text-center">
                    Bookings from OTAs will appear here automatically within 1 minute of being made.
                  </p>
                </div>
              )}

              {/* Booking list */}
              {!isLoading && !isError && filtered.length > 0 && (
                <div className="divide-y divide-white/15">
                  {/* Header row */}
                  <div className="grid grid-cols-[1fr_1fr_0.8fr_auto_auto] gap-3 px-5 py-2.5 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider sticky top-0 bg-background/95 backdrop-blur z-10 border-b border-white/10">
                    <div className="flex items-center gap-1.5"><User className="w-3 h-3" /> Guest</div>
                    <div className="flex items-center gap-1.5"><Building2 className="w-3 h-3" /> Property</div>
                    <div className="flex items-center gap-1.5"><CalendarDays className="w-3 h-3" /> Dates</div>
                    <div className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> Platform</div>
                    <div>Status</div>
                  </div>

                  {filtered.map((b) => (
                    <div
                      key={b.id}
                      className={`grid grid-cols-[1fr_1fr_0.8fr_auto_auto] gap-3 px-5 py-3.5 items-center hover:bg-white/20 transition-colors duration-200 cursor-default ${b.status === "cancelled" ? "opacity-50" : ""}`}
                    >
                      {/* Guest */}
                      <span className="text-sm font-medium text-foreground/85 truncate">
                        {b.guest_name ?? "Unknown guest"}
                      </span>

                      {/* Property */}
                      <span className="text-sm text-muted-foreground/70 truncate">
                        {b.properties?.name ?? "–"}
                      </span>

                      {/* Dates */}
                      <span className="text-xs text-muted-foreground/70">
                        {fmtDate(b.check_in)} – {fmtDate(b.check_out)}
                      </span>

                      {/* Platform badge */}
                      <PlatformBadge platform={b.ota_name ?? "unknown"} />

                      {/* Status chip */}
                      <StatusChip status={b.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AddBookingModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={() => refetch()}
      />
    </div>
  );
};

// ── Status chip ───────────────────────────────────────────────────────────────

function StatusChip({ status }) {
  const map = {
    confirmed:        { label: "Confirmed",  cls: "bg-green-100/70 text-green-700" },
    cancelled:        { label: "Cancelled",  cls: "bg-red-100/70 text-red-600" },
    modified_pending: { label: "Needs review", cls: "bg-amber-100/70 text-amber-700" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-muted/50 text-muted-foreground" };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${cls}`}>
      {label}
    </span>
  );
}
