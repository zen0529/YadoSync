/**
 * _shared/channexGet.ts
 *
 * GET from Channex with exponential backoff and retry logic.
 * Retry policy lives in retryBackoff.ts (single responsibility).
 */

import { RETRYABLE_STATUSES, MAX_ATTEMPTS, backoff } from "./retryBackoff.ts";

// ── channexGet ─────────────────────────────────────────────────────────────

/**
 * GET from Channex with exponential backoff.
 *
 * Same retry behaviour as channexPost — retries on 429 and 5xx,
 * gives up immediately on other 4xx errors.
 */
export async function channexGet(
  path: string,
  apiKey: string,
  baseUrl: string,
): Promise<unknown> {
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
      return json?.data ?? json;
    }

    let errBody: any;
    try { errBody = await res.json(); } catch { /* ignore */ }
    lastError = new Error(errBody?.errors?.title || `Channex GET ${path} failed (${res.status})`);

    if (!RETRYABLE_STATUSES.has(res.status)) break;

    console.warn(`[channex] GET ${path} got ${res.status} (attempt ${attempt + 1}/${MAX_ATTEMPTS})`);
  }

  throw lastError ?? new Error(`Channex GET ${path} failed after ${MAX_ATTEMPTS} attempts`);
}
