import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TapeChartToolbar } from "./TapeChartToolbar";

afterEach(cleanup);

const renderToolbar = (onChannelsApply = vi.fn()) => render(
  <div className="overflow-hidden">
    <TapeChartToolbar
      startDate={new Date(2026, 8, 30)}
      endDate={new Date(2026, 9, 15)}
      viewMode="week"
      selectedChannels={["all"]}
      onChannelsApply={onChannelsApply}
    />
  </div>,
);

describe("Channels filter popover", () => {
  it("opens outside the chart container and submits filters with Apply", async () => {
    const onApply = vi.fn();
    const { container } = renderToolbar(onApply);
    fireEvent.click(screen.getByRole("button", { name: "Channels" }));

    const menu = await screen.findByRole("dialog", { name: "Channel filters" });
    expect(document.body.contains(menu)).toBe(true);
    expect(container.contains(menu)).toBe(false);

    fireEvent.click(screen.getByRole("checkbox", { name: /Booking.com/ }));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(onApply).toHaveBeenCalledOnce();
    expect(onApply.mock.calls[0][0].channels).not.toContain("booking");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("closes with Escape and returns focus to Channels", async () => {
    renderToolbar();
    const trigger = screen.getByRole("button", { name: "Channels" });
    fireEvent.click(trigger);
    await screen.findByRole("dialog", { name: "Channel filters" });
    fireEvent.keyDown(document.activeElement, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
  });
});
