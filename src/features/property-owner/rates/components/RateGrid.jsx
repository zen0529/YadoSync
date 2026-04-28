import { useMemo, useState } from "react";
import { addDays, format, eachDayOfInterval, isWithinInterval } from "date-fns";
import { ROOMS } from "@/data/constants";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";

export const RateGrid = ({ selectedResort, rateOverrides }) => {
  const [baseDate, setBaseDate] = useState(new Date(2026, 3, 1)); // Default to April 1, 2026
  const daysToShow = 14;
  
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

  const handlePrev = () => setBaseDate(addDays(baseDate, -7));
  const handleNext = () => setBaseDate(addDays(baseDate, 7));

  const getRateForDay = (roomId, dateStr) => {
    const override = rateOverrides.find(o => o.roomId === roomId && o.date === dateStr);
    const room = ROOMS.find(r => r.id === roomId);
    if (override) {
      return { price: override.price, minStay: override.minStay, isOverride: true };
    }
    return { price: room.basePrice, minStay: room.baseMinStay, isOverride: false };
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col h-full border border-white/20">
      
      {/* Grid Header Controls */}
      <div className="px-5 py-4 border-b border-white/20 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold text-foreground/85">Rates & Availability Grid</h3>
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
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-1.5 text-[10px]">
             <span className="w-2.5 h-2.5 rounded bg-green-500/20 border border-green-500/50"></span>
             <span className="text-muted-foreground/70 font-medium">Modified Rate</span>
           </div>
           <div className="flex items-center gap-1.5 text-[10px]">
             <Lock className="w-3 h-3 text-amber-500" />
             <span className="text-muted-foreground/70 font-medium">Min Stay Restriction</span>
           </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-white/20 dark:bg-black/10">
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
                  <div key={i} className={`w-32 shrink-0 border-r border-white/10 flex flex-col items-center justify-center py-2
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
          <div className="flex flex-col">
            {filteredRooms.length === 0 ? (
               <div className="p-8 text-center text-sm text-muted-foreground/60">No rooms found.</div>
            ) : (
              filteredRooms.map((room) => (
                <div key={room.id} className="flex group border-b border-white/10">
                  {/* Room Info (Sticky Left) */}
                  <div className="w-48 shrink-0 sticky left-0 z-10 bg-background/70 backdrop-blur-md border-r border-white/20 p-3 flex flex-col justify-center shadow-[2px_0_5px_rgba(0,0,0,0.02)] transition-colors group-hover:bg-background/90">
                    <span className="text-xs font-bold text-foreground/85 truncate" title={room.name}>{room.name}</span>
                    <span className="text-[10px] text-muted-foreground/60 truncate" title={room.resort}>{room.resort}</span>
                  </div>

                  {/* Day Cells */}
                  <div className="flex w-full">
                    {days.map((day, i) => {
                       const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                       const dateStr = format(day, "yyyy-MM-dd");
                       const { price, minStay, isOverride } = getRateForDay(room.id, dateStr);
                       
                       return (
                        <div key={i} className={`w-32 shrink-0 border-r border-white/5 flex flex-col items-center justify-center py-3 transition-colors hover:bg-white/30 dark:hover:bg-white/10 cursor-pointer
                          ${isWeekend ? "bg-black/[0.02] dark:bg-white/[0.02]" : ""}
                          ${isOverride ? "bg-green-500/10 dark:bg-green-500/20" : ""}
                        `}>
                          <span className={`text-sm font-bold tracking-tight ${isOverride ? "text-green-600 dark:text-green-400" : "text-foreground/80"}`}>
                            ₱{price.toLocaleString()}
                          </span>
                          {minStay > 1 && (
                            <div className="flex items-center gap-1 mt-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded text-[9px] font-semibold">
                              <Lock className="w-2.5 h-2.5" />
                              <span>{minStay}N</span>
                            </div>
                          )}
                        </div>
                       );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
