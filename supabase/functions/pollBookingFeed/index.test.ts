// @vitest-environment node
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ handler: null as any, feed: vi.fn(), apply: vi.fn(), ack: vi.fn(), failure: vi.fn(), resolved: vi.fn(), dispatch: vi.fn() }));
vi.mock("https://deno.land/std@0.168.0/http/server.ts", () => ({ serve: (handler: any) => { mocks.handler = handler; } }));
vi.mock("https://esm.sh/@supabase/supabase-js@2.39.3", () => ({ createClient: () => ({
  from: () => ({ select: async () => ({ data: [{ channex_property_id: "property" }], error: null }), insert: async () => ({ error: null }) }),
}) }));
vi.mock("../_shared/channex.ts", () => ({ channexGetWithMeta: mocks.feed, channexPostRaw: mocks.ack }));
vi.mock("../_shared/bookingsPage/applyRevision.ts", () => ({ applyRevision: mocks.apply }));
vi.mock("../_shared/bookings.ts", () => ({ upsertRevisionFailure: mocks.failure, markRevisionResolved: mocks.resolved }));
vi.mock("../_shared/bookingsPage/dispatchSyncNotifications.ts", () => ({ dispatchSyncNotifications: mocks.dispatch }));
beforeAll(async () => {
  vi.stubGlobal("Deno", { env: { get: () => "test-only" } });
  await import("./index.ts");
});
afterAll(() => vi.unstubAllGlobals());
beforeEach(() => {
  vi.clearAllMocks();
  mocks.feed.mockResolvedValue({ data: [], meta: { total: 0 } });
  mocks.failure.mockResolvedValue({ first_failed_at: new Date().toISOString() });
});
const run = () => mocks.handler(new Request("http://localhost/poll", { method: "POST", body: "{}" }));
const revision = { id: "revision", attributes: { booking_id: "booking", property_id: "property", ota_reservation_code: "REF", status: "new" } };
it("checks durable incidents even when the feed is empty", async () => {
  expect((await run()).status).toBe(200);
  expect(mocks.dispatch).toHaveBeenCalledOnce();
});
it("checks durable incidents even when the feed request fails", async () => {
  mocks.feed.mockRejectedValue(new Error("feed unavailable"));
  expect((await run()).status).toBe(500);
  expect(mocks.dispatch).toHaveBeenCalledOnce();
});
it("persists owner mapping on failure and leaves the revision unacknowledged", async () => {
  mocks.feed.mockResolvedValue({ data: [revision], meta: { total: 1, limit: 100 } });
  mocks.apply.mockResolvedValue({ ok: false, reason: "raw error", kind: "transient" });
  await run();
  expect(mocks.failure).toHaveBeenCalledWith(expect.anything(), "revision", "booking", "raw error", "transient", "property", "REF");
  expect(mocks.ack).not.toHaveBeenCalled();
  expect(mocks.resolved).not.toHaveBeenCalled();
});
it("marks saved revisions resolved before dispatching the follow-up", async () => {
  mocks.feed.mockResolvedValue({ data: [revision], meta: { total: 1, limit: 100 } });
  mocks.apply.mockResolvedValue({ ok: true });
  await run();
  expect(mocks.resolved).toHaveBeenCalledWith(expect.anything(), "revision");
  expect(mocks.apply.mock.invocationCallOrder[0]).toBeLessThan(mocks.resolved.mock.invocationCallOrder[0]);
  expect(mocks.resolved.mock.invocationCallOrder[0]).toBeLessThan(mocks.dispatch.mock.invocationCallOrder[0]);
});
