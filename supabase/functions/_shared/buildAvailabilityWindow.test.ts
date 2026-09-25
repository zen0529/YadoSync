import { describe, expect, it } from "vitest";
import { buildAvailabilityWindow } from "./buildAvailabilityWindow.ts";

describe("buildAvailabilityWindow", () => {
  const dates = ["2026-09-25", "2026-09-26", "2026-09-27"];

  it("preserves edited availability and identifies only missing dates", () => {
    expect(buildAvailabilityWindow(dates, [
      { date: "2026-09-25", available: 0 },
      { date: "2026-09-26", available: 2 },
    ], 4)).toEqual({
      entries: [
        { date: "2026-09-25", available: 0 },
        { date: "2026-09-26", available: 2 },
        { date: "2026-09-27", available: 4 },
      ],
      missingDates: ["2026-09-27"],
    });
  });

  it("initializes an empty window once", () => {
    expect(buildAvailabilityWindow(dates, [], 3).missingDates).toEqual(dates);
    expect(buildAvailabilityWindow(dates, dates.map((date) => ({
      date,
      available: 3,
    })), 3).missingDates).toEqual([]);
  });
});
