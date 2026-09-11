import React from "react";
import { PLATFORM_CONFIG } from "./tapeChartData";
import { Plane, Home, User, Wrench } from "lucide-react";

export const PlatformBadgeIcon = ({ platform }) => {
  const config = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.direct;

  if (platform === "booking") {
    return (
      <span className="w-5 h-5 rounded-full bg-[#1e3a8a] text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-xs">
        B.
      </span>
    );
  }

  if (platform === "airbnb") {
    return (
      <span className="w-5 h-5 rounded-full bg-[#be123c] text-white flex items-center justify-center shrink-0 shadow-xs">
        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C9.5 2 7.7 3.8 7.7 6.3c0 2.2 1.3 4.2 3.1 5.2-.4.7-.8 1.4-1.2 2.2-1.8 3.5-3.6 7-3.6 8.3 0 1.1.9 2 2 2 1.3 0 2.6-1.1 4-3 1.4 1.9 2.7 3 4 3 1.1 0 2-.9 2-2 0-1.3-1.8-4.8-3.6-8.3-.4-.8-.8-1.5-1.2-2.2 1.8-1 3.1-3 3.1-5.2C16.3 3.8 14.5 2 12 2zm0 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
        </svg>
      </span>
    );
  }

  if (platform === "expedia") {
    return (
      <span className="w-5 h-5 rounded-full bg-[#b45309] text-white flex items-center justify-center shrink-0 shadow-xs">
        <Plane className="w-3 h-3 fill-current" />
      </span>
    );
  }

  if (platform === "walkin") {
    return (
      <span className="w-5 h-5 rounded-full bg-[#6d28d9] text-white flex items-center justify-center shrink-0 shadow-xs">
        <User className="w-3 h-3" />
      </span>
    );
  }

  if (platform === "maintenance") {
    return (
      <span className="w-5 h-5 rounded-full bg-[#334155] text-white flex items-center justify-center shrink-0 shadow-xs">
        <Wrench className="w-3 h-3" />
      </span>
    );
  }

  // Direct (default)
  return (
    <span className="w-5 h-5 rounded-full bg-[#047857] text-white flex items-center justify-center shrink-0 shadow-xs">
      <Home className="w-3 h-3" />
    </span>
  );
};

export const BookingTape = ({
  booking,
  leftPos,
  width,
  onClick,
}) => {
  const config = PLATFORM_CONFIG[booking.platform] || PLATFORM_CONFIG.direct;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(booking);
      }}
      className={`absolute top-2 bottom-2 rounded-lg ${config.barBg} transition-all duration-150 cursor-pointer shadow-sm hover:shadow-md flex items-center px-2 z-10 select-none overflow-hidden group border`}
      style={{
        left: `${leftPos}px`,
        width: `${Math.max(width - 4, 36)}px`, // slight 4px gap so consecutive bookings don't touch
      }}
      title={`${booking.guest} • ${booking.nights} nights (${booking.checkIn} to ${booking.checkOut})`}
    >
      <div className="flex items-center justify-between w-full min-w-0 gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
          <PlatformBadgeIcon platform={booking.platform} />
          <span className="text-xs font-semibold text-white truncate tracking-tight">
            {booking.guest}
          </span>
        </div>

        {width > 90 && (
          <span className="text-[11px] font-medium text-white/95 whitespace-nowrap shrink-0 ml-1">
            {booking.nights} {booking.nights === 1 ? "night" : "nights"}
          </span>
        )}
      </div>
    </div>
  );
};
