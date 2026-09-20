import { describe, it, expect } from "vitest";
import { formatDateTime, formatTime, timeAgo, getStatusStyle } from "./formatters";

describe("formatters", () => {
  it("formatDateTime formats valid ISO strings", () => {
    const res = formatDateTime("2026-09-18T14:30:00Z");
    expect(res).not.toBe("—");
    expect(typeof res).toBe("string");
  });

  it("formatDateTime returns — for null or invalid input", () => {
    expect(formatDateTime(null)).toBe("—");
    expect(formatDateTime("invalid")).toBe("—");
  });

  it("timeAgo returns just now for very recent timestamps", () => {
    const now = new Date().toISOString();
    expect(timeAgo(now)).toBe("just now");
  });

  it("getStatusStyle maps statuses correctly", () => {
    expect(getStatusStyle("ok")).toContain("emerald");
    expect(getStatusStyle("success")).toContain("emerald");
    expect(getStatusStyle("partial")).toContain("amber");
    expect(getStatusStyle("failed")).toContain("rose");
    expect(getStatusStyle("unknown")).toContain("slate");
  });
});
