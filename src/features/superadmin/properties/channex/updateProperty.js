const CHANNEX_URL     = import.meta.env.VITE_CHANNEX_URL;
const CHANNEX_API_KEY = import.meta.env.VITE_CHANNEX_STAGING_API_KEY;

/**
 * Updates an existing property via the Channex API.
 *
 * PUT https://staging.channex.io/api/v1/properties/{propertyId}
 *
 * @param {string} propertyId - The ID of the Channex property
 * @param {object} form - The form state from AddPropertyPanel
 * @returns {object}    - The updated property data from the API
 * @throws  {Error}     - Throws a descriptive error for 401 / 422 / other failures
 */
export const updateProperty = async (propertyId, form) => {
  const payload = {
    property: {
      title:         form.title,
      is_active:     form.status === "active",
      currency:      form.currency,
      email:         form.email         || undefined,
      phone:         form.phone         || undefined,
      zip_code:      form.zip_code      || undefined,
      country:       form.country       || undefined,
      state:         form.state         || undefined,
      city:          form.city          || undefined,
      address:       form.address       || undefined,
      longitude:     form.longitude     || undefined,
      latitude:      form.latitude      || undefined,
      timezone:      form.timezone      || undefined,
      property_type: form.property_type || undefined,
      logo_url:      form.logo_url      || undefined,
      website:       form.website       || undefined,
      facilities:    [],
      settings: {
        allow_availability_autoupdate_on_confirmation:
          form.settings.allow_availability_autoupdate_on_confirmation,
        allow_availability_autoupdate_on_modification:
          form.settings.allow_availability_autoupdate_on_modification,
        allow_availability_autoupdate_on_cancellation:
          form.settings.allow_availability_autoupdate_on_cancellation,
        min_stay_type:   form.settings.min_stay_type,
        min_price:       form.settings.min_price       || null,
        max_price:       form.settings.max_price       || null,
        state_length:    form.settings.state_length,
        cut_off_time:    form.settings.cut_off_time,
        cut_off_days:    form.settings.cut_off_days,
        max_day_advance: form.settings.max_day_advance || null,
      },
      content: {
        description:           form.content.description           || undefined,
        important_information: form.content.important_information || undefined,
        photos: form.content.photos,
      },
    },
  };

  console.log("[CHANNEX] PUT payload for property", propertyId, JSON.stringify(payload, null, 2));

  const response = await fetch(`${CHANNEX_URL}/${propertyId}`, {
    method:  "PUT",
    headers: {
      "Content-Type": "application/json",
      "user-api-key": CHANNEX_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  // ── 200 OK ─────────────────────────────────────────────────────────────
  if (response.status === 200) {
    const result = await response.json();
    console.log("[CHANNEX] PUT response for property", propertyId, JSON.stringify(result, null, 2));
    console.log("[CHANNEX] Response photos:", result?.data?.attributes?.content?.photos);
    return result;
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
