import React, { useState, useMemo } from "react";
import { addDays, eachDayOfInterval } from "date-fns";
import { TapeChartToolbar } from "./TapeChartToolbar";
import { TapeChartGrid } from "./TapeChartGrid";
import { BookingDetailModal } from "./BookingDetailModal";
import { ROOM_CATEGORIES, INITIAL_BOOKINGS } from "./tapeChartData";

export const TapeChart = ({
  bookings: propBookings = [],
  selectedResort = "all",
  selectedPlatform = "all",
  onAddClick,
}) => {
  // Default to Mar 25, 2026 to exactly match the reference screenshot
  const [baseDate, setBaseDate] = useState(() => new Date(2026, 2, 25));
  const [viewMode, setViewMode] = useState("week");
  const [selectedChannels, setSelectedChannels] = useState(() => {
    return selectedPlatform && selectedPlatform !== "all" ? [selectedPlatform] : ["all"];
  });
  const [selectedStatuses, setSelectedStatuses] = useState([
    "confirmed",
    "pending",
    "cancelled",
    "blocked",
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Sync external filter if it changes
  React.useEffect(() => {
    if (selectedPlatform && selectedPlatform !== "all") {
      setSelectedChannels([selectedPlatform]);
    } else if (selectedPlatform === "all") {
      setSelectedChannels(["all"]);
    }
  }, [selectedPlatform]);

  // Determine how many days to display based on viewMode
  const daysCount = useMemo(() => {
    switch (viewMode) {
      case "month":
        return 30;
      case "3days":
        return 3;
      case "today":
        return 1;
      case "week":
      default:
        return 16; // 16 days gives 12-14 in viewport + right scroll buffer matching screenshot
    }
  }, [viewMode]);

  // Generate date array
  const days = useMemo(() => {
    return eachDayOfInterval({
      start: baseDate,
      end: addDays(baseDate, daysCount - 1),
    });
  }, [baseDate, daysCount]);

  // Navigation handlers
  const handlePrev = () => {
    const shift = viewMode === "week" ? 7 : daysCount;
    setBaseDate((prev) => addDays(prev, -shift));
  };

  const handleNext = () => {
    const shift = viewMode === "week" ? 7 : daysCount;
    setBaseDate((prev) => addDays(prev, shift));
  };

  // Merge mock data with any real bookings passed from Supabase
  const allBookings = useMemo(() => {
    // If real bookings are present and non-empty, format any that have check_in
    if (propBookings && propBookings.length > 0) {
      const realMapped = propBookings.map((b) => {
        let plat = "direct";
        const otaLower = (b.ota_name || "").toLowerCase();
        if (otaLower.includes("booking")) plat = "booking";
        else if (otaLower.includes("airbnb")) plat = "airbnb";
        else if (otaLower.includes("agoda")) plat = "agoda";
        else if (otaLower.includes("expedia")) plat = "expedia";
        else if (otaLower.includes("walk")) plat = "walkin";

        return {
          id: b.id || `prop-${Math.random()}`,
          guest: b.guest_name || "Guest",
          platform: plat,
          categoryId: b.room_type_id || "cat-ocean-villa",
          roomId: b.room_id || "r1",
          checkIn: b.check_in,
          checkOut: b.check_out,
          nights: b.nights || 3,
          amount: b.amount ? `₱${Number(b.amount).toLocaleString()}` : "₱15,000",
          status: b.status || "Confirmed",
          code: b.ota_reservation_code || `BKG-${b.id}`,
        };
      });

      // Combine both so the rich design always has full demonstration data
      const combined = [...INITIAL_BOOKINGS];
      realMapped.forEach((rb) => {
        if (!combined.some((cb) => cb.id === rb.id)) {
          combined.push(rb);
        }
      });
      return combined;
    }

    return INITIAL_BOOKINGS;
  }, [propBookings]);

  // Filter bookings by selected channels and statuses
  const filteredBookings = useMemo(() => {
    return allBookings.filter((b) => {
      const channelMatch =
        selectedChannels.includes("all") || selectedChannels.includes(b.platform);

      const statusLower = (b.status || "confirmed").toLowerCase();
      const statusMatch =
        selectedStatuses.length === 0 ||
        selectedStatuses.some((st) => statusLower.includes(st));

      return channelMatch && statusMatch;
    });
  }, [allBookings, selectedChannels, selectedStatuses]);

  const handleChannelsApply = ({ channels, statuses, allSelected }) => {
    if (allSelected) {
      setSelectedChannels(["all"]);
    } else {
      setSelectedChannels(channels);
    }
    setSelectedStatuses(statuses);
  };

  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
    setIsDetailOpen(true);
  };

  // Find room name for modal
  const selectedRoomName = useMemo(() => {
    if (!selectedBooking) return "";
    for (const cat of ROOM_CATEGORIES) {
      const room = cat.rooms.find((r) => r.id === selectedBooking.roomId);
      if (room) return `${cat.name} — ${room.name}`;
    }
    return selectedBooking.guest;
  }, [selectedBooking]);

  return (
    <div className="flex flex-col h-full w-full">
      {/* 1. Toolbar (Date nav, View mode switcher, Channels Dropdown, New Booking) */}
      <TapeChartToolbar
        startDate={days[0]}
        endDate={days[days.length - 1]}
        onPrev={handlePrev}
        onNext={handleNext}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedChannels={selectedChannels}
        onChannelsApply={handleChannelsApply}
        onAddClick={onAddClick}
      />

      {/* 3. Main Grid Matrix */}
      <TapeChartGrid
        days={days}
        categories={ROOM_CATEGORIES}
        bookings={filteredBookings}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onBookingClick={handleBookingClick}
      />

      {/* 4. Booking Details Modal */}
      <BookingDetailModal
        booking={selectedBooking}
        roomName={selectedRoomName}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  );
};

export default TapeChart;
