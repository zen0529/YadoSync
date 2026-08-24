/**
 * _shared/channexGetWithMeta.ts
 *
 * GET from Channex returning both `data` and `meta` envelopes,
 * with exponential backoff and retry logic.
 * Retry policy lives in retryBackoff.ts (single responsibility).
 */

import { RETRYABLE_STATUSES, MAX_ATTEMPTS, backoff } from "./retryBackoff.ts";

// ── channexGetWithMeta ─────────────────────────────────────────────────────

/**
 * GET from Channex — returns BOTH `data` and `meta` envelopes.
 *
 * Use this for paginated responses where you need `meta.total` to know
 * whether to keep draining (e.g. booking_revisions/feed).
 */
export async function channexGetWithMeta(
  path: string,
  apiKey: string,
  baseUrl: string,
): Promise<{ data: unknown; meta: unknown }> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await backoff(attempt - 1);

    let res: Response;
    try {
      res = await fetch(`${baseUrl}/api/v1${path}`, {
        headers: { "user-api-key": apiKey },
      });
    } catch (networkErr: any) {
      lastError = new Error(`Channex GET ${path} network error: ${networkErr.message}`);
      console.warn(`[channex] GET ${path} network error (attempt ${attempt + 1}):`, networkErr.message);
      continue;
    }

    if (res.ok) {
      const json = await res.json();
      return { data: json?.data ?? [], meta: json?.meta ?? {} };
    }

    let errBody: any;
    try { errBody = await res.json(); } catch { /* ignore */ }
    lastError = new Error(errBody?.errors?.title || `Channex GET ${path} failed (${res.status})`);

    if (!RETRYABLE_STATUSES.has(res.status)) break;
    console.warn(`[channex] GET ${path} got ${res.status} (attempt ${attempt + 1}/${MAX_ATTEMPTS})`);
  }

  throw lastError ?? new Error(`Channex GET ${path} failed after ${MAX_ATTEMPTS} attempts`);
}
