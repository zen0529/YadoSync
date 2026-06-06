const CHANNEX_BASE_URL = import.meta.env.VITE_CHANNEX_BASE_URL;
const CHANNEX_API_KEY = import.meta.env.VITE_CHANNEX_STAGING_API_KEY;

/**
 * Creates a new property via the Channex API.
 *
 * POST https://staging.channex.io/api/v1/properties
 *
 * @param {object} form - The form state from AddPropertyPanel
 * @returns {object}    - The created property data from the API
 * @throws  {Error}     - Throws a descriptive error for 401 / 422 / other failures
 */
export const createProperty = async (form) => {
  const payload = {
    property: {
      title: form.title,
      is_active: form.status === "active",
      currency: form.currency,
      email: form.email || undefined,
      phone: form.phone || undefined,
      zip_code: form.zip_code || undefined,
      country: form.country || undefined,
      state: form.state || undefined,
      city: form.city || undefined,
      address: form.address || undefined,
      longitude: form.longitude || undefined,
      latitude: form.latitude || undefined,
      timezone: form.timezone || undefined,
      property_type: form.property_type || undefined,
      logo_url: form.logo_url || undefined,
      website: form.website || undefined,
      facilities: [],
      settings: {
        allow_availability_autoupdate_on_confirmation:
          form.settings.allow_availability_autoupdate_on_confirmation,
        allow_availability_autoupdate_on_modification:
          form.settings.allow_availability_autoupdate_on_modification,
        allow_availability_autoupdate_on_cancellation:
          form.settings.allow_availability_autoupdate_on_cancellation,
        min_stay_type: form.settings.min_stay_type,
        min_price: form.settings.min_price || null,
        max_price: form.settings.max_price || null,
        state_length: form.settings.state_length,
        cut_off_time: form.settings.cut_off_time,
        cut_off_days: form.settings.cut_off_days,
        max_day_advance: form.settings.max_day_advance || null,
      },
      content: {
        description: form.content.description || undefined,
        important_information: form.content.important_information || undefined,
        photos: form.content.photos.length > 0
          ? form.content.photos
          : undefined,
      },
    },
  };

  const response = await fetch(`${CHANNEX_BASE_URL}/api/v1/properties`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "user-api-key": CHANNEX_API_KEY,
    },
    body: JSON.stringify(payload),
  });


  // ── 201 Created ─────────────────────────────────────────────────────────────
  if (response.status === 201) {

    const data = await response.json();

    console.log("channex property creation success data", data)

    return data
  }

  // ── Parse error body for all failure cases ───────────────────────────────────
  let errorBody;
  try {
    errorBody = await response.json();
  } catch {
    throw new Error(`Unexpected response from Channex (${response.status})`);
  }

  // ── 401 Unauthorized ─────────────────────────────────────────────────────────
  if (response.status === 401) {
    throw new Error(
      errorBody?.errors?.title || "Unauthorized — check your API key."
    );
  }

  // ── 422 Validation Error ──────────────────────────────────────────────────────
  if (response.status === 422) {
    const details = errorBody?.errors?.details;
    if (details) {
      // Flatten field-level messages: { title: ["can't be blank"] } → one string
      const fieldMessages = Object.entries(details)
        .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
        .join(" | ");
      throw new Error(`Validation error — ${fieldMessages}`);
    }
    throw new Error(errorBody?.errors?.title || "Validation error from Channex.");
  }

  // ── Catch-all ─────────────────────────────────────────────────────────────────
  throw new Error(
    errorBody?.errors?.title ||
    `Channex API error (${response.status})`
  );
};
