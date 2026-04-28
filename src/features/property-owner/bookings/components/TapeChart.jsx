import { useMemo, useState } from "react";
import { addDays, format, eachDayOfInterval, differenceInDays, parseISO, isWithinInterval } from "date-fns";
import { ROOMS } from "@/data/constants";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLATFORM_COLORS = {
  klook: "bg-gradient-to-r from-orange-400 to-orange-500 border-orange-600/20",
  booking: "bg-gradient-to-r from-blue-500 to-blue-600 border-blue-700/20",
  agoda: "bg-gradient-to-r from-red-500 to-red-600 border-red-700/20",
  direct: "bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-700/20",
};

export const TapeChart = ({ bookings, selectedResort, selectedPlatform, onAddClick }) => {
  const [baseDate, setBaseDate] = useState(new Date(2026, 2, 25)); // Default to Mar 25, 2026 to see mock data
  const daysToShow = 30;
  
  const days = useMemo(() => {
    return eachDayOfInterval({ 
      start: baseDate, 
      end: addDays(baseDate, daysToShow - 1) 
    });
  }, [baseDate]);

  const filteredRooms = useMemo(() => {
    return ROOMS.filter(r => 
      selectedResort === "all" || r.resort === selectedResort
    );
  }, [selectedResort]);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => 
      (selectedPlatform === "all" || b.platform === selectedPlatform) &&
      (selectedResort === "all" || b.resort === selectedResort)
    );
  }, [selectedPlatform, selectedResort]);

  const handlePrev = () => setBaseDate(addDays(baseDate, -7));
  const handleNext = () => setBaseDate(addDays(baseDate, 7));

  // Determine if a booking falls within the current view for a specific room
  const getBookingsForRoom = (roomId) => {
    return filteredBookings.filter(b => {
      if (b.roomId !== roomId) return false;
      const bStart = parseISO(b.checkIn);
      const bEnd = parseISO(b.checkOut);
      const viewStart = days[0];
      const viewEnd = days[days.length - 1];
      
      // Check if they overlap at all
      return bStart <= viewEnd && bEnd >= viewStart;
    });
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col h-full border border-white/20">
      
      {/* Tape Chart Header Controls */}
      <div className="px-5 py-4 border-b border-white/20 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold text-foreground/85">Multi-Calendar</h3>
          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 rounded-lg p-0.5">
            <button onClick={handlePrev} className="p-1 rounded-md hover:bg-white/30 dark:hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-4 h-4 text-foreground/70" />
            </button>
            <span className="text-xs font-medium text-foreground/80 px-2 min-w-[120px] text-center">
              {format(days[0], "MMM d")} - {format(days[days.length - 1], "MMM d, yyyy")}
            </span>
            <button onClick={handleNext} className="p-1 rounded-md hover:bg-white/30 dark:hover:bg-white/10 transition-colors">
              <ChevronRight className="w-4 h-4 text-foreground/70" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 mr-4">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span><span className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wider">Klook</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span><span className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wider">Booking.com</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span><span className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wider">Agoda</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span><span className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wider">Direct</span></div>
          </div>
          <Button size="sm" onClick={onAddClick} className="bg-foreground text-background hover:bg-foreground/90 h-8 text-xs rounded-lg shadow-sm">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Block Date
          </Button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-auto relative custom-scrollbar bg-white/20 dark:bg-black/10">
        <div className="min-w-max">
          
          {/* Timeline Header */}
          <div className="flex sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-white/20">
            {/* Corner Cell */}
            <div className="w-48 shrink-0 sticky left-0 z-30 bg-background/90 backdrop-blur-md border-r border-white/20 flex items-end p-3 pb-2 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
              <span className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Rooms</span>
            </div>
            
            {/* Days Header */}
            <div className="flex">
              {days.map((day, i) => {
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const isToday = isWithinInterval(new Date(), { start: day, end: day });
                return (
                  <div key={i} className={`w-12 shrink-0 border-r border-white/10 flex flex-col items-center justify-center py-2
                    ${isWeekend ? "bg-black/5 dark:bg-white/5" : ""}
                  `}>
                    <span className={`text-[10px] font-semibold mb-0.5 ${isWeekend ? "text-orange-500/80" : "text-muted-foreground/60"}`}>
                      {format(day, "EEE")}
                    </span>
                    <span className={`text-sm font-bold ${isToday ? "bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-sm" : "text-foreground/80"}`}>
                      {format(day, "d")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rooms Grid */}
          <div className="flex flex-col relative">
            {filteredRooms.length === 0 ? (
               <div className="p-8 text-center text-sm text-muted-foreground/60">No rooms found.</div>
            ) : (
              filteredRooms.map((room, rowIndex) => {
                const roomBookings = getBookingsForRoom(room.id);
                
                return (
                  <div key={room.id} className="flex relative group">
                    {/* Room Info (Sticky Left) */}
                    <div className="w-48 shrink-0 sticky left-0 z-10 bg-background/70 backdrop-blur-md border-r border-b border-white/20 p-3 flex flex-col justify-center shadow-[2px_0_5px_rgba(0,0,0,0.02)] transition-colors group-hover:bg-background/90">
                      <span className="text-xs font-bold text-foreground/85 truncate" title={room.name}>{room.name}</span>
                      <span className="text-[10px] text-muted-foreground/60 truncate" title={room.resort}>{room.resort}</span>
                    </div>

                    {/* Day Cells (Background Grid) */}
                    <div className="flex border-b border-white/10 relative w-full">
                      {days.map((day, i) => {
                         const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                         return (
                          <div key={i} className={`w-12 shrink-0 border-r border-white/5 transition-colors hover:bg-white/30 dark:hover:bg-white/10
                            ${isWeekend ? "bg-black/[0.02] dark:bg-white/[0.02]" : ""}
                          `}></div>
                         );
                      })}
                      
                      {/* Booking Blocks (Absolute Overlay) */}
                      {roomBookings.map(b => {
                        const bStart = parseISO(b.checkIn);
                        const bEnd = parseISO(b.checkOut);
                        
                        // Calculate offset and width based on intersection with view
                        const viewStart = days[0];
                        
                        let startOffsetDays = differenceInDays(bStart, viewStart);
                        let durationDays = differenceInDays(bEnd, bStart);
                        
                        // Handle bookings that start before view
                        if (startOffsetDays < 0) {
                          durationDays += startOffsetDays; // shorten duration
                          startOffsetDays = 0;
                        }
                        
                        // Handle bookings that end after view
                        if (startOffsetDays + durationDays > daysToShow) {
                          durationDays = daysToShow - startOffsetDays;
                        }
                        
                        const cellWidth = 48; // w-12 is 3rem = 48px
                        const leftPos = startOffsetDays * cellWidth;
                        const width = durationDays * cellWidth;
                        
                        const bgClass = PLATFORM_COLORS[b.platform] || "bg-gray-500";
                        
                        return (
                          <div 
                            key={b.id} 
                            className={`absolute top-1 bottom-1 rounded-md shadow-md shadow-black/10 flex flex-col justify-center px-2 overflow-hidden cursor-pointer hover:brightness-110 transition-all z-10 border ${bgClass}`}
                            style={{ left: `${leftPos}px`, width: `${width}px` }}
                            title={`${b.guest} (${b.dates})`}
                          >
                            <span className="text-[10px] font-bold text-white truncate drop-shadow-sm">{b.guest}</span>
                            {durationDays > 1 && <span className="text-[9px] text-white/80 uppercase tracking-wider font-semibold truncate drop-shadow-sm">{b.platform}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
