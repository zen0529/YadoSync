/**
 * _shared/channexPostRaw.ts
 *
 * POST to Channex returning the raw HTTP status code (no body parsed),
 * with exponential backoff and retry logic.
 * Retry policy lives in retryBackoff.ts (single responsibility).
 */

import { RETRYABLE_STATUSES, MAX_ATTEMPTS, backoff } from "./retryBackoff.ts";

// ── channexPostRaw ─────────────────────────────────────────────────────────

/**
 * POST to Channex — returns the raw HTTP status code, no body parsed.
 *
 * Use for endpoints that return 204 No Content (e.g. booking_revisions/:id/ack).
 * Retries on the same transient statuses as channexPost.
 */
export async function channexPostRaw(
  path: string,
  body: unknown,
  apiKey: string,
  baseUrl: string,
): Promise<number> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await backoff(attempt - 1);

    let res: Response;
    try {
      res = await fetch(`${baseUrl}/api/v1${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-api-key": apiKey,
        },
        body: JSON.stringify(body),
      });
    } catch (networkErr: any) {
      lastError = new Error(`Channex POST ${path} network error: ${networkErr.message}`);
      console.warn(`[channex] POST ${path} network error (attempt ${attempt + 1}):`, networkErr.message);
      continue;
    }

    if (res.ok) return res.status;   // 200 or 204 — success

    let errBody: any;
    try { errBody = await res.json(); } catch { /* ignore */ }
    lastError = new Error(errBody?.errors?.title || `Channex POST ${path} failed (${res.status})`);

    if (!RETRYABLE_STATUSES.has(res.status)) break;
    console.warn(`[channex] POST ${path} got ${res.status} (attempt ${attempt + 1}/${MAX_ATTEMPTS})`);
  }

  throw lastError ?? new Error(`Channex POST ${path} failed after ${MAX_ATTEMPTS} attempts`);
}
