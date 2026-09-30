import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useNotificationBell } from "./useNotificationBell";

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), read: vi.fn(), useNotifications: vi.fn(), propertyId: "property-a" }));
vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@/features/property-owner/context/PropertyContext", () => ({ useActiveProperty: () => ({ selectedPropertyId: mocks.propertyId }) }));
vi.mock("./useNotifications", () => ({ useNotifications: mocks.useNotifications }));

afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); mocks.propertyId = "property-a"; });

function renderNotification(type, bookingId = "external-booking") {
  mocks.useNotifications.mockReturnValue({
    notifications: [{ id: "notification-1", type, booking_id: bookingId, status: "unread", message: "Full sync details. Contact support.", created_at: "2026-09-30T00:00:00Z" }],
    unreadCount: 1, markAsRead: mocks.read, markAllAsRead: vi.fn(), isLoading: false,
  });
  return renderHook(useNotificationBell);
}

describe("Notification bell routing", () => {
  it.each(["booking_sync_issue", "booking_sync_restored"])("opens %s details without entering modification recovery", (type) => {
    const { result } = renderNotification(type);
    act(() => result.current.handleNotificationClick(result.current.items[0]));
    expect(mocks.useNotifications).toHaveBeenCalledWith("property-a");
    expect(mocks.read).toHaveBeenCalledWith("notification-1");
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(result.current.selectedNotification.message).toBe("Full sync details. Contact support.");
  });

  it("shows the message without a saved booking and hides it when switching properties", () => {
    const { result, rerender } = renderNotification("booking_sync_issue", null);
    act(() => result.current.handleNotificationClick(result.current.items[0]));
    expect(result.current.selectedNotification.title).toBe("Booking Sync Delayed");
    mocks.propertyId = "property-b";
    rerender();
    expect(result.current.selectedNotification).toBeNull();
  });

  it("still routes explicit booking modifications to their review modal", () => {
    const { result } = renderNotification("booking_modified");
    act(() => result.current.handleNotificationClick(result.current.items[0]));
    expect(mocks.navigate).toHaveBeenCalledWith("/dashboard/bookings", {
      state: { openModifiedBookingId: "external-booking", openModifiedModal: true, timestamp: expect.any(Number) },
    });
    expect(result.current.selectedNotification).toBeNull();
  });
});
