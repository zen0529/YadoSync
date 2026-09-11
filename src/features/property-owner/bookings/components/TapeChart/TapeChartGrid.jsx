import React, { useState, useRef } from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import {
  Search,
  ChevronDown,
  ChevronRight,
  BedDouble,
  Users,
} from "lucide-react";
import { BookingTape } from "./BookingTape";

export const TapeChartGrid = ({
  days,
  categories,
  bookings,
  searchQuery,
  onSearchChange,
  onBookingClick,
  onScrollRight,
}) => {
  const [expandedCategories, setExpandedCategories] = useState(() => {
    const map = {};
    categories.forEach((cat) => {
      map[cat.id] = cat.defaultExpanded;
    });
    return map;
  });

  const scrollRef = useRef(null);
  const colWidth = 76; // width in pixels per date column

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Filter categories and rooms based on search query
  const filteredCategories = categories
    .map((cat) => {
      const matchCat = cat.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const filteredRooms = cat.rooms.filter(
        (r) =>
          matchCat ||
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.subtitle.toLowerCase().includes(searchQuery.toLowerCase()),
      );

      if (matchCat || filteredRooms.length > 0) {
        return {
          ...cat,
          rooms: filteredRooms.length > 0 ? filteredRooms : cat.rooms,
        };
      }
      return null;
    })
    .filter(Boolean);

  const totalVisibleRooms = filteredCategories.reduce(
    (acc, cat) => acc + cat.rooms.length,
    0,
  );

  // Helper to compute layout for a booking
  const getBookingLayout = (b) => {
    try {
      const bStart = parseISO(b.checkIn);
      const bEnd = parseISO(b.checkOut);
      const viewStart = days[0];
      const viewEnd = days[days.length - 1];

      if (bEnd <= viewStart || bStart > viewEnd) return null;

      let startOffset = differenceInDays(bStart, viewStart);
      let duration = differenceInDays(bEnd, bStart);

      if (startOffset < 0) {
        duration += startOffset;
        startOffset = 0;
      }

      if (startOffset + duration > days.length) {
        duration = days.length - startOffset;
      }

      if (duration <= 0) return null;

      return {
        leftPos: startOffset * colWidth,
        width: duration * colWidth,
      };
    } catch {
      return null;
    }
  };

  const handleHeaderScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: colWidth * 4, behavior: "smooth" });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
      {/* Scrollable Matrix Container */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto relative custom-scrollbar select-none"
      >
        <div className="min-w-max flex flex-col">
          {/* Header Row (Sticky Top) */}
          <div className="flex sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 shadow-xs">
            {/* Top-Left Corner Cell (Sticky Top & Left) */}
            <div className="w-[260px] sm:w-[280px] shrink-0 sticky left-0 z-30 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Rooms
                  </span>
                  <span className="text-xs text-slate-400 font-normal">
                    {totalVisibleRooms} rooms
                  </span>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative mt-2">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search rooms..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg pl-8 pr-2.5 py-1.5 outline-none placeholder:text-slate-400 focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Date Columns Header */}
            <div className="flex items-stretch">
              {days.map((day, idx) => {
                const dayOfWeek = day.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

                return (
                  <div
                    key={idx}
                    style={{ width: `${colWidth}px` }}
                    className={`shrink-0 border-r border-slate-100 dark:border-slate-800/80 flex flex-col items-center justify-center py-2.5 px-1 ${
                      isWeekend
                        ? "bg-slate-50/90 dark:bg-slate-800/50"
                        : "bg-white dark:bg-slate-900"
                    }`}
                  >
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none">
                      {format(day, "EEE")}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 leading-none">
                      {format(day, "MMM d")}
                    </span>
                  </div>
                );
              })}

              {/* Scroll Right Arrow Button at end of header */}
              <div className="w-10 shrink-0 border-r border-slate-100 dark:border-slate-800/80 flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/30">
                <button
                  onClick={handleHeaderScrollRight}
                  className="w-7 h-7 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
                  title="Scroll right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid Rows */}
          <div className="flex flex-col">
            {filteredCategories.map((category) => {
              const isExpanded = !!expandedCategories[category.id];
              const categoryBookings = bookings.filter(
                (b) => b.categoryId === category.id,
              );

              return (
                <div key={category.id} className="flex flex-col">
                  {/* Category Header Row */}
                  <div
                    onClick={() => toggleCategory(category.id)}
                    className="flex cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors border-b border-slate-200/60 dark:border-slate-800/80"
                  >
                    {/* Category Sticky Left Header */}
                    <div className="w-[260px] sm:w-[280px] shrink-0 sticky left-0 z-10 bg-slate-50/90 dark:bg-slate-800/80 backdrop-blur-xs border-r border-slate-200/80 dark:border-slate-800/80 px-3 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {category.name}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-700/60">
                        {category.rooms.length} rooms
                      </span>
                    </div>

                    {/* Category Grid Track */}
                    <div className="flex relative bg-slate-50/50 dark:bg-slate-800/40">
                      {days.map((day, idx) => {
                        const dayOfWeek = day.getDay();
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        return (
                          <div
                            key={idx}
                            style={{ width: `${colWidth}px` }}
                            className={`h-9 shrink-0 border-r border-slate-100 dark:border-slate-800/50 ${
                              isWeekend
                                ? "bg-slate-100/50 dark:bg-slate-800/60"
                                : ""
                            }`}
                          />
                        );
                      })}
                      <div className="w-10 shrink-0 border-r border-slate-100 dark:border-slate-800/50" />

                      {/* If category is collapsed, render its bookings right on this row! */}
                      {!isExpanded &&
                        categoryBookings.map((b) => {
                          const layout = getBookingLayout(b);
                          if (!layout) return null;
                          return (
                            <BookingTape
                              key={b.id}
                              booking={b}
                              leftPos={layout.leftPos}
                              width={layout.width}
                              onClick={onBookingClick}
                            />
                          );
                        })}
                    </div>
                  </div>

                  {/* Sub-rooms (Visible when category is expanded) */}
                  {isExpanded &&
                    category.rooms.map((room) => {
                      const roomBookings = bookings.filter(
                        (b) => b.roomId === room.id,
                      );

                      return (
                        <div
                          key={room.id}
                          className="flex border-b border-slate-100 dark:border-slate-800/70 group"
                        >
                          {/* Room Info Cell (Sticky Left) */}
                          <div className="w-[260px] sm:w-[280px] shrink-0 sticky left-0 z-10 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 p-2.5 flex items-center justify-between transition-colors group-hover:bg-slate-50/80 dark:group-hover:bg-slate-800/50">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                  {room.name}
                                </p>
                                <p className="text-[10.5px] text-slate-400 dark:text-slate-400 truncate mt-0.5">
                                  {room.subtitle}
                                </p>
                              </div>
                            </div>

                            {/* Bed / Occupant count indicator */}
                            <div className="flex items-center gap-1 text-slate-400 dark:text-slate-400 shrink-0 pl-1">
                              <BedDouble className="w-3.5 h-3.5" />
                              <span className="text-xs font-semibold">
                                {room.capacity}
                              </span>
                            </div>
                          </div>

                          {/* Grid Track for Room */}
                          <div className="flex relative">
                            {days.map((day, idx) => {
                              const dayOfWeek = day.getDay();
                              const isWeekend =
                                dayOfWeek === 0 || dayOfWeek === 6;

                              return (
                                <div
                                  key={idx}
                                  style={{ width: `${colWidth}px` }}
                                  className={`h-14 shrink-0 border-r border-slate-100 dark:border-slate-800/60 transition-colors ${
                                    isWeekend
                                      ? "bg-slate-50/50 dark:bg-slate-800/30"
                                      : "bg-white dark:bg-slate-900"
                                  } group-hover:bg-slate-50/40 dark:group-hover:bg-slate-800/30`}
                                />
                              );
                            })}
                            <div className="w-10 shrink-0 border-r border-slate-100 dark:border-slate-800/60" />

                            {/* Booking Bars for this room */}
                            {roomBookings.map((b) => {
                              const layout = getBookingLayout(b);
                              if (!layout) return null;
                              return (
                                <BookingTape
                                  key={b.id}
                                  booking={b}
                                  leftPos={layout.leftPos}
                                  width={layout.width}
                                  onClick={onBookingClick}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
