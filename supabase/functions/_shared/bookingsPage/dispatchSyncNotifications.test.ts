import { afterEach, expect, it, vi } from "vitest";
import { dispatchSyncNotifications } from "./dispatchSyncNotifications";

afterEach(() => vi.restoreAllMocks());
it("dispatches persisted incidents independently of the feed contents", async () => {
  const rpc = vi.fn().mockResolvedValue({ error: null });
  await dispatchSyncNotifications({ rpc });
  expect(rpc).toHaveBeenCalledWith("dispatch_booking_sync_notifications");
});
it.each(["returned", "thrown"])("logs a %s notification error without failing booking processing", async (kind) => {
  const error = new Error("database unavailable");
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const rpc = kind === "returned" ? vi.fn().mockResolvedValue({ error }) : vi.fn().mockRejectedValue(error);
  await expect(dispatchSyncNotifications({ rpc })).resolves.toBeUndefined();
  expect(log).toHaveBeenCalledWith(expect.any(String), error);
});
