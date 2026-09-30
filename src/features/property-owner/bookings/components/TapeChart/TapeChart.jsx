import { useMemo, useState } from "react";
import { addDays, eachDayOfInterval, startOfDay } from "date-fns";
import { TapeChartToolbar } from "./TapeChartToolbar";
import { TapeChartGrid } from "./TapeChartGrid";
import { BookingDetailModal } from "./BookingDetailModal";
import { getBookingPlatform, getBookingStatus, makeCalendarRows } from "../../utils/tapeChartLayout";

export const TapeChart = ({ bookings = [], roomTypes = [], ratePlans = [], onAddClick }) => {
  const [baseDate, setBaseDate] = useState(() => startOfDay(new Date()));
  const [viewMode, setViewMode] = useState("week");
  const [selectedChannels, setSelectedChannels] = useState(["all"]);
  const [selectedStatuses, setSelectedStatuses] = useState(["confirmed", "modified", "pending", "blocked"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);

  const daysCount = { month: 30, week: 16, "3days": 3, today: 1 }[viewMode];
  const days = useMemo(() => eachDayOfInterval({
    start: baseDate,
    end: addDays(baseDate, daysCount - 1),
  }), [baseDate, daysCount]);

  const visibleBookings = useMemo(() => bookings.filter((booking) => {
    const channelMatch = selectedChannels.includes("all")
      || selectedChannels.includes(getBookingPlatform(booking.ota_name));
    const statusMatch = selectedStatuses.includes(getBookingStatus(booking.status));
    return channelMatch && statusMatch;
  }), [bookings, selectedChannels, selectedStatuses]);

  const groups = useMemo(() => makeCalendarRows({
    roomTypes, ratePlans, bookings: visibleBookings, days,
  }), [roomTypes, ratePlans, visibleBookings, days]);
  const occupancyGroups = useMemo(() => makeCalendarRows({
    roomTypes, ratePlans, bookings, days,
  }), [roomTypes, ratePlans, bookings, days]);
  const occupancyByGroup = useMemo(() => new Map(occupancyGroups.map((group) => [group.id, group])), [occupancyGroups]);
  const displayGroups = useMemo(() => groups.map((group) => ({
    ...group,
    occupancy: occupancyByGroup.get(group.id)?.occupancy,
    maxOccupied: occupancyByGroup.get(group.id)?.maxOccupied,
    overbooked: occupancyByGroup.get(group.id)?.overbooked,
  })), [groups, occupancyByGroup]);

  const handleShift = (direction) => {
    const shift = viewMode === "week" ? 7 : daysCount;
    setBaseDate((current) => addDays(current, shift * direction));
  };

  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <TapeChartToolbar
        startDate={days[0]}
        endDate={days[days.length - 1]}
        onPrev={() => handleShift(-1)}
        onNext={() => handleShift(1)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedChannels={selectedChannels}
        onChannelsApply={({ channels, statuses, allSelected }) => {
          setSelectedChannels(allSelected ? ["all"] : channels);
          setSelectedStatuses(statuses);
        }}
        onAddClick={onAddClick}
      />
      <TapeChartGrid
        days={days}
        groups={displayGroups}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onBookingClick={setSelectedBooking}
      />
      <BookingDetailModal
        booking={selectedBooking}
        open={Boolean(selectedBooking)}
        onOpenChange={(open) => { if (!open) setSelectedBooking(null); }}
      />
    </div>
  );
};

export default TapeChart;
