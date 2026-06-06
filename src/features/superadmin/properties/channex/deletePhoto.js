// VITE_CHANNEX_BASE_URL points to the base API URL
const CHANNEX_BASE_URL = import.meta.env.VITE_CHANNEX_BASE_URL;
const CHANNEX_API_KEY    = import.meta.env.VITE_CHANNEX_STAGING_API_KEY;

/**
 * Deletes a single photo via the Channex API.
 *
 * DELETE https://staging.channex.io/api/v1/photos/:id
 *
 * @param {string} photoId - The Channex photo ID to delete
 * @returns {boolean}      - True if deleted successfully
 * @throws  {Error}        - Throws a descriptive error on failure
 */
export const deletePhoto = async (photoId) => {
  console.log("[CHANNEX] Deleting photo:", photoId);

  const response = await fetch(`${CHANNEX_BASE_URL}/api/v1/photos/${photoId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "user-api-key": CHANNEX_API_KEY,
    },
  });

  console.log("[CHANNEX] DELETE photo response status:", response.status);

  if (response.status === 200 || response.status === 204) {
    return true;
  }

  // ── Parse error body for all failure cases ────────────────────────────────
  let errorBody;
  try {
    errorBody = await response.json();
    console.log("[CHANNEX] DELETE photo error body:", JSON.stringify(errorBody, null, 2));
  } catch {
    throw new Error(`Unexpected response from Channex when deleting photo (${response.status})`);
  }

  // ── 401 Unauthorized ──────────────────────────────────────────────────────
  if (response.status === 401) {
    throw new Error(
      errorBody?.errors?.title || "Unauthorized — check your API key."
    );
  }

  // ── 404 Not Found ─────────────────────────────────────────────────────────
  if (response.status === 404) {
    throw new Error(`Photo not found on Channex (id: ${photoId})`);
  }

  // ── Catch-all ─────────────────────────────────────────────────────────────
  throw new Error(
    errorBody?.errors?.title ||
    `Channex API error when deleting photo (${response.status})`
  );
};
