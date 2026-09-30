import { describe, expect, it } from "vitest";
import { makeCalendarRows, stackBookingEntries } from "./tapeChartLayout";

const days = [1, 2, 3, 4].map((day) => new Date(2026, 8, day));
const roomTypes = [{ id: "room-1", title: "Ocean Villa", count_of_rooms: 3, channex_room_type_id: "ch-room-1" }];
const ratePlans = [
  { id: "rate-1", title: "Standard", room_type_id: "room-1", channex_rate_plan_id: "ch-rate-1" },
  { id: "rate-2", title: "Flexible", room_type_id: "room-1", channex_rate_plan_id: "ch-rate-2" },
];

const booking = (id, roomTypeId = "ch-room-1", ratePlanId = "ch-rate-1", status = "new") => ({
  id,
  status,
  guest_name: `Guest ${id}`,
  check_in: "2026-09-01",
  check_out: "2026-09-03",
  booked_rooms: [{
    room_type_id: roomTypeId,
    rate_plan_id: ratePlanId,
    checkin_date: "2026-09-01",
    checkout_date: "2026-09-03",
  }],
});

describe("bookings calendar layout", () => {
  it("stacks four overlapping bookings and flags room type overbooking across rate plans", () => {
    const bookings = [
      booking("1"), booking("2"), booking("3"), booking("4", "ch-room-1", "ch-rate-2"),
    ];
    const [group] = makeCalendarRows({ roomTypes, ratePlans, bookings, days });

    expect(group.occupancy).toEqual([4, 4, 0, 0]);
    expect(group.overbooked).toBe(true);
    expect(group.maxOccupied).toBe(4);
    expect(stackBookingEntries(group.rows[0].entries)).toHaveLength(3);
    expect(stackBookingEntries(group.rows[1].entries)).toHaveLength(1);
  });

  it("places four bookings on the same rate plan in four separate lanes", () => {
    const bookings = [booking("1"), booking("2"), booking("3"), booking("4")];
    const [group] = makeCalendarRows({ roomTypes, ratePlans, bookings, days });
    expect(stackBookingEntries(group.rows[0].entries)).toHaveLength(4);
    expect(group.occupancy[0]).toBe(4);
  });

  it("keeps unknown mappings visible and excludes cancellations", () => {
    const groups = makeCalendarRows({
      roomTypes,
      ratePlans,
      bookings: [
        booking("unmapped-plan", "ch-room-1", "missing-rate"),
        booking("unmapped-room", "missing-room", "missing-rate"),
        booking("cancelled", "ch-room-1", "ch-rate-1", "cancellation"),
      ],
      days,
    });

    expect(groups[0].rows.find((row) => row.title === "Unmapped rate plan")?.entries).toHaveLength(1);
    expect(groups[1].title).toBe("Unmapped bookings");
    expect(groups[1].rows[0].entries).toHaveLength(1);
    expect(groups[0].occupancy).toEqual([1, 1, 0, 0]);
  });

  it("uses each booked room date range for a multiroom booking", () => {
    const multiroom = booking("multi");
    multiroom.booked_rooms.push({
      room_type_id: "ch-room-1",
      rate_plan_id: "ch-rate-1",
      checkin_date: "2026-09-02",
      checkout_date: "2026-09-04",
    });
    const [group] = makeCalendarRows({ roomTypes, ratePlans, bookings: [multiroom], days });
    expect(group.rows[0].entries).toHaveLength(2);
    expect(group.occupancy).toEqual([1, 2, 1, 0]);
  });
});
