import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns";

const dateKey = (value) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value))
    ? value
    : null;

export const getBookingPlatform = (otaName) => {
  const name = (otaName || "").toLowerCase();
  if (!name || name.includes("direct")) return "direct";
  if (name.includes("walk")) return "walkin";
  if (name.includes("phone")) return "phone";
  if (name.includes("manual")) return "manual";
  for (const channel of [
    "airbnb", "agoda", "booking", "expedia", "tripadvisor", "google", "hotels",
    "traveloka", "hostelworld", "rakuten", "despegar", "trivago", "hopper",
    "vrbo", "tiket", "klook", "ctrip", "kayak", "trip",
  ]) {
    if (name.includes(channel)) return channel;
  }
  return "other";
};

export const getBookingStatus = (status) => {
  if (status === "new" || status === "confirmed") return "confirmed";
  if (status === "modified" || status === "modified_pending") return "modified";
  if (status === "cancellation" || status === "cancelled") return "cancelled";
  return status || "pending";
};

export const makeCalendarRows = ({ roomTypes, ratePlans, bookings, days }) => {
  const firstDay = format(days[0], "yyyy-MM-dd");
  const lastDayExclusive = format(new Date(days[days.length - 1].getFullYear(), days[days.length - 1].getMonth(), days[days.length - 1].getDate() + 1), "yyyy-MM-dd");
  const typesByChannexId = new Map(roomTypes.map((type) => [type.channex_room_type_id, type]));
  const plansByChannexId = new Map(ratePlans.map((plan) => [plan.channex_rate_plan_id, plan]));
  const groups = roomTypes.map((type) => ({
    id: type.id,
    title: type.title,
    countOfRooms: type.count_of_rooms,
    rows: ratePlans
      .filter((plan) => plan.room_type_id === type.id)
      .map((plan) => ({ id: plan.id, title: plan.title, entries: [] })),
    entries: [],
  }));
  const groupsById = new Map(groups.map((group) => [group.id, group]));
  const unmapped = { id: "unmapped", title: "Unmapped bookings", countOfRooms: null, rows: [], entries: [] };

  for (const booking of bookings) {
    const status = getBookingStatus(booking.status);
    if (status === "cancelled") continue;
    const bookedRooms = Array.isArray(booking.booked_rooms) && booking.booked_rooms.length
      ? booking.booked_rooms
      : [{ checkin_date: booking.check_in, checkout_date: booking.check_out }];

    bookedRooms.forEach((bookedRoom, index) => {
      const checkIn = dateKey(bookedRoom.checkin_date) || dateKey(booking.check_in);
      const checkOut = dateKey(bookedRoom.checkout_date) || dateKey(booking.check_out);
      if (!checkIn || !checkOut || checkIn >= checkOut) return;
      if (checkOut <= firstDay || checkIn >= lastDayExclusive) return;

      const plan = plansByChannexId.get(bookedRoom.rate_plan_id);
      const type = typesByChannexId.get(bookedRoom.room_type_id)
        || (plan && roomTypes.find((item) => item.id === plan.room_type_id));
      const group = (type && groupsById.get(type.id)) || unmapped;
      const validPlan = plan?.room_type_id === type?.id ? plan : null;
      let row = validPlan && group.rows.find((item) => item.id === validPlan.id);
      if (!row) {
        const rowId = group === unmapped ? "unmapped-bookings" : "unmapped-rate-plan";
        row = group.rows.find((item) => item.id === rowId);
        if (!row) {
          row = { id: rowId, title: group === unmapped ? "Unknown room type" : "Unmapped rate plan", entries: [] };
          group.rows.push(row);
        }
      }

      const visibleStart = checkIn < firstDay ? firstDay : checkIn;
      const visibleEnd = checkOut > lastDayExclusive ? lastDayExclusive : checkOut;
      const startIndex = differenceInCalendarDays(parseISO(visibleStart), days[0]);
      const endIndex = differenceInCalendarDays(parseISO(visibleEnd), days[0]);
      const entry = {
        id: `${booking.id}-${index}`,
        bookingId: booking.id,
        guest: booking.guest_name || "Guest",
        platform: getBookingPlatform(booking.ota_name),
        status,
        checkIn,
        checkOut,
        nights: differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn)),
        amount: bookedRoom.amount ?? booking.amount,
        currency: booking.currency,
        code: booking.ota_reservation_code || booking.channex_booking_id,
        roomTypeTitle: group.title,
        ratePlanTitle: row.title,
        startIndex,
        endIndex,
        booking,
      };
      row.entries.push(entry);
      group.entries.push(entry);
    });
  }

  for (const group of groups) {
    group.occupancy = days.map((_, dayIndex) => group.entries.filter((entry) =>
      entry.startIndex <= dayIndex && entry.endIndex > dayIndex).length);
    group.maxOccupied = Math.max(0, ...group.occupancy);
    group.overbooked = group.countOfRooms != null
      && group.occupancy.some((count) => count > group.countOfRooms);
  }

  return unmapped.entries.length ? [...groups, unmapped] : groups;
};

export const stackBookingEntries = (entries) => {
  const lanes = [];
  const sorted = [...entries].sort((a, b) => a.startIndex - b.startIndex || a.endIndex - b.endIndex);
  for (const entry of sorted) {
    let laneIndex = lanes.findIndex((lane) => lane[lane.length - 1].endIndex <= entry.startIndex);
    if (laneIndex === -1) {
      laneIndex = lanes.length;
      lanes.push([]);
    }
    lanes[laneIndex].push(entry);
  }
  return lanes;
};
