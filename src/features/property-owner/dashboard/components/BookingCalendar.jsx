import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();
const formatDate = (year, month, day) => {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
};
const getOccupancyLevel = (bookingCount, totalRooms) => {
  if (bookingCount === 0) return 0;
  return Math.round((bookingCount / totalRooms) * 100);
};

const getOccupancyClasses = (pct) => {
  if (pct === 0) return "text-muted-foreground/40 hover:bg-white/5";
  if (pct <= 20) return "bg-green-500/15 text-foreground/60";
  if (pct <= 40) return "bg-green-500/30 text-foreground/70";
  if (pct <= 60) return "bg-green-500/50 text-white";
  if (pct <= 80) return "bg-green-500/70 text-white font-medium";
  if (pct < 100) return "bg-green-500/85 text-white font-medium";
  return "bg-green-500 text-white font-semibold";
};

export const BookingCalendar = ({
  bookingsByDate = {},
  totalRooms = 1,
  month: controlledMonth,
  year: controlledYear,
  onMonthChange,
  onDateClick,
}) => {
  const now = new Date();
  const [internalMonth, setInternalMonth] = useState(controlledMonth ?? now.getMonth());
  const [internalYear, setInternalYear] = useState(controlledYear ?? now.getFullYear());

  const month = controlledMonth ?? internalMonth;
  const year = controlledYear ?? internalYear;

  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);

  const todayStr = formatDate(now.getFullYear(), now.getMonth(), now.getDate());
  const isCurrentMonth = now.getMonth() === month && now.getFullYear() === year;

  const handlePrev = () => {
    const newMonth = month === 0 ? 11 : month - 1;
    const newYear = month === 0 ? year - 1 : year;
    if (onMonthChange) {
      onMonthChange(newMonth, newYear);
    } else {
      setInternalMonth(newMonth);
      setInternalYear(newYear);
    }
  };

  const handleNext = () => {
    const newMonth = month === 11 ? 0 : month + 1;
    const newYear = month === 11 ? year + 1 : year;
    if (onMonthChange) {
      onMonthChange(newMonth, newYear);
    } else {
      setInternalMonth(newMonth);
      setInternalYear(newYear);
    }
  };

  const handleDayClick = (day) => {
    const dateKey = formatDate(year, month, day);
    const bookings = bookingsByDate[dateKey] || [];
    if (bookings.length === 0) return;
    if (onDateClick) onDateClick(dateKey, bookings);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  return (
    <div className="w-full h-full">
      <div className="rounded-2xl p-4 h-full flex flex-col glass-card">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-foreground/85">
            {MONTH_NAMES[month]} {year}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground/60" />
            </button>
            <button
              onClick={handleNext}
              className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
            </button>
          </div>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {DAYS.map((d) => (
            <div
              key={d}
              className="text-center text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-wider py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5 flex-1">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} />;
            }

            const dateKey = formatDate(year, month, day);
            const bookings = bookingsByDate[dateKey] || [];
            const occupancy = getOccupancyLevel(bookings.length, totalRooms);
            const isToday = isCurrentMonth && dateKey === todayStr;

            return (
              <button
                key={dateKey}
                onClick={() => handleDayClick(day)}
                className={`flex items-center justify-center rounded-md text-xs transition-all duration-150 relative min-h-8
                  ${getOccupancyClasses(occupancy)}
                  ${bookings.length > 0 ? "cursor-pointer hover:brightness-110" : "cursor-default"}
                  ${isToday ? "ring-1 ring-foreground/20" : ""}`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
