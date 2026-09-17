/**
 * _shared/bookingsPage/classifyError.ts
 *
 * Single responsibility: classify any Supabase/Deno error as either
 * "transient" (safe to retry) or "permanent" (needs human intervention).
 *
 * Used by applyRevision.ts and any future callers that write to Supabase
 * and need to decide whether to retry or alert.
 */

// ── Error kind type ───────────────────────────────────────────────────────────

/**
 * Whether a failed apply should be retried (transient) or alerted on (permanent).
 *
 * transient → leave un-acked; the revision will re-surface in the next poll cycle.
 *             Keep retrying within the 30-minute Channex feed window.
 * permanent → alert immediately; retrying will never succeed without a code or
 *             data fix. Log loudly so a human can intervene.
 */
export type ErrorKind = "transient" | "permanent";

// ── Error classification sets ─────────────────────────────────────────────────

// SQLSTATE codes that are safe to retry
const TRANSIENT_SQLSTATE_CODES = new Set([
  "08000", "08001", "08006",  // connection failure / terminated
  "57P01",                    // admin_shutdown (Postgres restarted mid-query)
  "53300",                    // too_many_connections
  "23503",                    // foreign_key_violation — property row may not exist yet
]);

// PostgREST codes that are safe to retry
const TRANSIENT_PGRST_CODES = new Set([
  "PGRST001",  // PostgREST couldn't connect to database
  "PGRST002",  // PostgreSQL service/schema-cache connection problem
  "PGRST003",  // Couldn't obtain connection from pool before timeout
  "PGRST204",  // Schema cache miss — reloads within ~5 min after a migration
]);

// HTTP statuses (from the Supabase API gateway) that are safe to retry
const TRANSIENT_HTTP_STATUSES = new Set([408, 503, 504]);

// ── classifyError ─────────────────────────────────────────────────────────────

/**
 * Classify any error thrown by or returned from a Supabase write as
 * either "transient" (retry) or "permanent" (alert, stop retrying).
 *
 * Handles three error shapes:
 *   1. PostgrestError — { code, message, details, hint } returned in { data, error }
 *   2. HTTP-level error — has a numeric .status property
 *   3. Deno TypeError — network failure before the request left the runtime
 */
export function classifyError(err: unknown): ErrorKind {
  // ── HTTP gateway errors (408, 503, 504) ─────────────────────────────────────
  if (typeof (err as any)?.status === "number") {
    if (TRANSIENT_HTTP_STATUSES.has((err as any).status)) return "transient";
  }

  // ── PostgrestError: classify by SQLSTATE or PGRST code ──────────────────────
  const code: string | undefined = (err as any)?.code;
  if (code) {
    if (TRANSIENT_PGRST_CODES.has(code))    return "transient";
    if (TRANSIENT_SQLSTATE_CODES.has(code)) return "transient";
    // SQLSTATE class prefixes: 08* = connection errors, 57* = operator intervention
    if (code.startsWith("08") || code.startsWith("57")) return "transient";
    // All other PGRST codes (auth, RLS, schema mismatch) are permanent
    if (code.startsWith("PGRST")) return "permanent";
  }

  // ── Deno network errors — no code, just a TypeError ─────────────────────────
  if (err instanceof TypeError) {
    const msg = err.message.toLowerCase();
    if (msg.includes("networkerror") || msg.includes("fetch")) return "transient";
  }

  // Default: treat as transient so we retry at least once before alerting.
  // Better to retry unnecessarily than to permanently drop a booking.
  return "transient";
}
