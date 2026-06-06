const CHANNEX_BASE_URL = import.meta.env.VITE_CHANNEX_BASE_URL;
const CHANNEX_API_KEY    = import.meta.env.VITE_CHANNEX_STAGING_API_KEY;

/**
 * Creates a single photo via the Channex API.
 *
 * POST https://staging.channex.io/api/v1/photos
 *
 * Used primarily to ROLLBACK a deletion: if a photo was deleted from Channex
 * but the subsequent Supabase operation fails, this re-creates the photo on Channex.
 *
 * @param {object} photoData
 * @param {string} photoData.property_id  - Channex property ID (required)
 * @param {string} photoData.url          - Supabase/public URL of the image (required)
 * @param {string} [photoData.kind]       - "photo" | "ad" | "menu" (default: "photo")
 * @param {string} [photoData.author]     - Author name
 * @param {string} [photoData.description]- Photo description
 * @param {number} [photoData.position]   - Display position (0 = cover photo)
 * @returns {object}                      - The created photo data from Channex
 * @throws  {Error}                       - Throws a descriptive error on failure
 */
export const createPhoto = async (photoData) => {
  const payload = {
    photo: {
      property_id:  photoData.property_id,
      url:          photoData.url,
      kind:         photoData.kind         || "photo",
      author:       photoData.author       || null,
      description:  photoData.description  || null,
      position:     photoData.position     ?? null,
      room_type_id: photoData.room_type_id || null,
    },
  };

  console.log("[CHANNEX] Creating (reverting) photo:", JSON.stringify(payload, null, 2));

  const response = await fetch(`${CHANNEX_BASE_URL}/api/v1/photos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "user-api-key": CHANNEX_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 201) {
    const result = await response.json();
    console.log("[CHANNEX] Photo re-created (rollback successful):", result?.data?.id);
    return result;
  }

  // ── Parse error body for all failure cases ────────────────────────────────
  let errorBody;
  try {
    errorBody = await response.json();
    console.error("[CHANNEX] createPhoto error body:", JSON.stringify(errorBody, null, 2));
  } catch {
    throw new Error(`Unexpected response from Channex when creating photo (${response.status})`);
  }

  if (response.status === 401) {
    throw new Error(errorBody?.errors?.title || "Unauthorized — check your API key.");
  }

  if (response.status === 422) {
    const details = errorBody?.errors?.details;
    if (details) {
      const fieldMessages = Object.entries(details)
        .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
        .join(" | ");
      throw new Error(`Validation error creating photo — ${fieldMessages}`);
    }
    throw new Error(errorBody?.errors?.title || "Validation error from Channex.");
  }

  throw new Error(
    errorBody?.errors?.title ||
    `Channex API error when creating photo (${response.status})`
  );
};
