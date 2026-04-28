import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlatformBadge } from "@/components/PlatformBadge";
import { SyncBadge } from "@/components/SyncBadge";
import { BOOKINGS, RESORTS } from "@/data/constants";
import { TapeChart } from "../components/TapeChart";
import { AddBookingModal } from "../components/AddBookingModal";
import {
  User,
  Building2,
  Globe,
  RefreshCw,
  CalendarDays,
  AlertTriangle,
  CalendarCheck,
  List,
} from "lucide-react";

export const BookingsPage = () => {
  const [platform, setPlatform] = useState("all");
  const [resort, setResort]     = useState("all");
  const [view, setView]         = useState("calendar"); // "list" | "calendar"
  const [bookingsList, setBookingsList] = useState(BOOKINGS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = bookingsList.filter(b =>
    (platform === "all" || b.platform === platform) &&
    (resort   === "all" || b.resort   === resort)
  );

  const pendingCount = bookingsList.filter(b => b.sync === "pending").length;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Alert Banner */}
      {pendingCount > 0 && (
        <div className="glass-card rounded-xl px-4 py-3 text-xs flex justify-between items-center mb-4 border-amber-200/50 shrink-0">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{pendingCount} booking{pendingCount > 1 ? "s have" : " has"} pending sync — dates may not be blocked on all platforms yet.</span>
          </div>
          <span className="text-green-600 font-semibold cursor-pointer hover:underline whitespace-nowrap ml-3">Resolve now &rarr;</span>
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
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="h-9 text-xs w-36 glass-filter-btn rounded-xl border-0">
              <SelectValue placeholder="Platform: All" />
            </SelectTrigger>
            <SelectContent className="glass-dropdown rounded-xl border-white/30">
              <SelectItem value="all" className="text-xs rounded-lg">Platform: All</SelectItem>
              <SelectItem value="klook" className="text-xs rounded-lg">Klook</SelectItem>
              <SelectItem value="booking" className="text-xs rounded-lg">Booking.com</SelectItem>
              <SelectItem value="agoda" className="text-xs rounded-lg">Agoda</SelectItem>
            </SelectContent>
          </Select>

          <Select value={resort} onValueChange={setResort}>
            <SelectTrigger className="h-9 text-xs w-40 glass-filter-btn rounded-xl border-0">
              <SelectValue placeholder="Resort: All" />
            </SelectTrigger>
            <SelectContent className="glass-dropdown rounded-xl border-white/30">
              <SelectItem value="all" className="text-xs rounded-lg">Resort: All</SelectItem>
              {RESORTS.map(r => <SelectItem key={r.name} value={r.name} className="text-xs rounded-lg">{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0">
        {view === "calendar" ? (
          <TapeChart bookings={bookingsList} selectedResort={resort} selectedPlatform={platform} onAddClick={() => setIsModalOpen(true)} />
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden h-full flex flex-col">
            <div className="px-5 py-4 flex items-center justify-between border-b border-white/20 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/20">
                  <CalendarCheck className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-foreground/85">All Bookings</h3>
              </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
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
                  <div className="grid grid-cols-[1fr_1fr_0.7fr_auto_auto] gap-3 px-5 py-2.5 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider sticky top-0 bg-background/95 backdrop-blur z-10 border-b border-white/10">
                    <div className="flex items-center gap-1.5"><User className="w-3 h-3" /> Guest</div>
                    <div className="flex items-center gap-1.5"><Building2 className="w-3 h-3" /> Resort</div>
                    <div className="flex items-center gap-1.5"><CalendarDays className="w-3 h-3" /> Dates</div>
                    <div className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> Platform</div>
                    <div className="flex items-center gap-1.5"><RefreshCw className="w-3 h-3" /> Sync</div>
                  </div>

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
          </div>
        )}
      </div>
      <AddBookingModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        onSave={(b) => setBookingsList(prev => [...prev, b])} 
      />
    </div>
  );
};
