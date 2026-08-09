/**
 * _shared/retryBackoff.ts
 *
 * Shared retry / exponential-backoff primitives used by every Channex HTTP
 * helper (channexGet, channexGetWithMeta, channexPost, channexPostRaw).
 *
 * Single responsibility: define the retry policy — nothing else.
 */

// ── Retry policy constants ────────────────────────────────────────────────────

/** Statuses that are worth retrying (transient — not the caller's fault) */
export const RETRYABLE_STATUSES = new Set([
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
]);

/** Maximum number of attempts (1 original + 3 retries) */
export const MAX_ATTEMPTS = 4;

// ── Internals ─────────────────────────────────────────────────────────────────

/** Base delay in ms — doubles with each retry (1s → 2s → 4s → 8s) */
const BASE_DELAY_MS = 1_000;

/** Sleep for `ms` milliseconds. */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Public helpers ────────────────────────────────────────────────────────────

/**
 * Wait before the next retry using exponential backoff with jitter.
 *
 * delay = BASE_DELAY_MS × 2^attempt + random(0..1000)ms
 *
 * @param attempt  0-based attempt index (0 = first retry, 1 = second, …)
 */
export async function backoff(attempt: number): Promise<void> {
  const exp = BASE_DELAY_MS * Math.pow(2, attempt); // 1s, 2s, 4s, 8s …
  const jitter = Math.random() * 1_000; // 0–1000 ms
  const delay = Math.min(exp + jitter, 30_000); // cap at 30s
  console.warn(
    `[channex] Retry ${attempt + 1}/${MAX_ATTEMPTS - 1} — waiting ${Math.round(delay)}ms`,
  );
  await sleep(delay);
}
