// @vitest-environment node
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  handler: null as any, existing: [] as any[], feed: [] as any[],
  apply: vi.fn(), resolved: vi.fn(), recovered: vi.fn(), dispatch: vi.fn(),
}));
vi.mock("https://deno.land/std@0.168.0/http/server.ts", () => ({ serve: (handler: any) => { mocks.handler = handler; } }));
vi.mock("https://esm.sh/@supabase/supabase-js@2.39.3", () => ({
  createClient: () => ({ from: (table: string) => {
    const data = table === "bookings" ? mocks.existing : table === "revision_failures" ? [{ booking_id: "booking", first_failed_at: "2026-09-01T00:00:00Z" }] : [];
    const query: any = { then: (resolve: any) => Promise.resolve({ data, error: null }).then(resolve) };
    for (const method of ["select", "eq", "lt", "order", "in", "insert"]) query[method] = () => query;
    return query;
  } }),
}));
vi.mock("../_shared/channex.ts", () => ({ channexGetWithMeta: async () => ({ data: mocks.feed, meta: { total: mocks.feed.length } }) }));
vi.mock("../_shared/bookingsPage/applyRevision.ts", () => ({ applyRevision: mocks.apply }));
vi.mock("../_shared/bookings.ts", () => ({ markRevisionResolved: mocks.resolved, markRevisionRecoveredByBookingId: mocks.recovered }));
vi.mock("../_shared/bookingsPage/dispatchSyncNotifications.ts", () => ({ dispatchSyncNotifications: mocks.dispatch }));

beforeAll(async () => {
  vi.stubGlobal("Deno", { env: { get: () => "test-only" } });
  await import("./index.ts");
});
afterAll(() => vi.unstubAllGlobals());
beforeEach(() => {
  vi.clearAllMocks();
  mocks.existing = [{ channex_booking_id: "booking", channex_revision_id: "saved-revision" }];
  mocks.feed = [{ id: "booking", attributes: { booking_id: "booking", property_id: "property", status: "new" } }];
  mocks.apply.mockResolvedValue({ ok: true });
});
const run = (dry_run = false) => mocks.handler(new Request("http://localhost/recover", {
  method: "POST", headers: { Authorization: "Bearer test-only", "Content-Type": "application/json" }, body: JSON.stringify({ dry_run }),
}));

it("does not resolve incidents or send restored alerts during a dry run", async () => {
  expect((await run(true)).status).toBe(200);
  expect(mocks.resolved).not.toHaveBeenCalled();
  expect(mocks.recovered).not.toHaveBeenCalled();
  expect(mocks.dispatch).not.toHaveBeenCalled();
});
it("only resolves the exact saved revision for an existing booking", async () => {
  await run();
  expect(mocks.resolved).toHaveBeenCalledWith(expect.anything(), "saved-revision");
  expect(mocks.recovered).not.toHaveBeenCalled();
  expect(mocks.dispatch).toHaveBeenCalledOnce();
});
it("resolves missing-booking incidents only after successful recovery", async () => {
  mocks.existing = [];
  await run();
  expect(mocks.recovered).toHaveBeenCalledWith(expect.anything(), "booking");
  expect(mocks.apply.mock.invocationCallOrder[0]).toBeLessThan(mocks.recovered.mock.invocationCallOrder[0]);
});
it("does not resolve a failed recovery", async () => {
  mocks.existing = [];
  mocks.apply.mockResolvedValue({ ok: false, reason: "failed" });
  await run();
  expect(mocks.recovered).not.toHaveBeenCalled();
});
it("does not claim recovery for an unsupported no-op status", async () => {
  mocks.existing = [];
  mocks.feed[0].attributes.status = "unknown";
  await run();
  expect(mocks.apply).not.toHaveBeenCalled();
  expect(mocks.recovered).not.toHaveBeenCalled();
});
