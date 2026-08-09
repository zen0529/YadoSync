/**
 * _shared/channexPost.ts
 *
 * POST to Channex with exponential backoff and retry logic.
 * Retry policy lives in retryBackoff.ts (single responsibility).
 */

import { RETRYABLE_STATUSES, MAX_ATTEMPTS, backoff } from "./retryBackoff.ts";

// ── channexPost ────────────────────────────────────────────────────────────

/**
 * POST to Channex with exponential backoff.
 *
 * Automatically retries on transient errors (429 rate-limit, 5xx server
 * errors). Gives up immediately on 4xx client errors (bad payload, auth
 * failure) since retrying won't change the outcome.
 *
 * Unwraps the {data} envelope and throws a descriptive error on failure.
 */
export async function channexPost(
  path: string,
  body: unknown,
  apiKey: string,
  baseUrl: string,
): Promise<unknown> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // Wait before retrying (skip delay on the first attempt)
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
      // Network-level failure (DNS, timeout, etc.) — always retryable
      lastError = new Error(
        `Channex ${path} network error: ${networkErr.message}`,
      );
      console.warn(
        `[channex] POST ${path} network error (attempt ${attempt + 1}):`,
        networkErr.message,
      );
      continue;
    }

    if (res.ok) {
      const json = await res.json();
      return json?.data ?? json;
    }

    lastError = new Error(`Channex ${path} failed (${res.status})`);

    if (!RETRYABLE_STATUSES.has(res.status)) {
      // 4xx (except 429) are the caller's fault — don't retry
      break;
    }

    console.warn(
      `[channex] POST ${path} got ${res.status} (attempt ${attempt + 1}/${MAX_ATTEMPTS})`,
    );
  }

  throw (
    lastError ??
    new Error(`Channex ${path} failed after ${MAX_ATTEMPTS} attempts`)
  );
}
