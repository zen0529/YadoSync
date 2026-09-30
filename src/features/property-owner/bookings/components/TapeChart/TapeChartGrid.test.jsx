import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TapeChartGrid } from "./TapeChartGrid";
import { makeCalendarRows } from "../../utils/tapeChartLayout";

describe("TapeChartGrid", () => {
  it("shows four same-date bookings in one rate plan and marks the date overbooked", () => {
    const days = [1, 2, 3].map((day) => new Date(2026, 8, day));
    const roomTypes = [{ id: "room", title: "Ocean Villa", count_of_rooms: 3, channex_room_type_id: "ch-room" }];
    const ratePlans = [{ id: "plan", title: "Standard Rate", room_type_id: "room", channex_rate_plan_id: "ch-plan" }];
    const bookings = [1, 2, 3, 4].map((number) => ({
      id: String(number),
      status: "new",
      guest_name: `Guest ${number}`,
      check_in: "2026-09-01",
      check_out: "2026-09-03",
      booked_rooms: [{ room_type_id: "ch-room", rate_plan_id: "ch-plan", checkin_date: "2026-09-01", checkout_date: "2026-09-03" }],
    }));
    const groups = makeCalendarRows({ roomTypes, ratePlans, bookings, days });

    render(<TapeChartGrid days={days} groups={groups} searchQuery="" onSearchChange={() => {}} onBookingClick={() => {}} />);

    expect(screen.getAllByRole("button", { name: /^Guest \d/ })).toHaveLength(4);
    expect(screen.getAllByText("4/3")).toHaveLength(2);
    expect(screen.getByText("4/3 Overbooked")).toBeTruthy();
  });
});
