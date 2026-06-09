import { toast } from "sonner";
import { isValidPhoneNumber } from "libphonenumber-js";

/**
 * Validates the Add Property form.
 * Fires an error toast for each invalid field and returns false if validation fails.
 *
 * @param {object} form     - The current form state
 * @param {Function} setTab - Setter to switch the active tab (navigates to "basic" on error)
 * @returns {boolean} true if valid, false if not
 */
export const validatePropertyForm = (form, setTab) => {
  const errors = [];

  if (!form.title.trim()) errors.push("Property title is required.");
  if (!form.currency) errors.push("Currency is required.");

  if (form.phone && form.phone.trim()) {
    if (!isValidPhoneNumber(form.phone, form.country)) {
      errors.push("Phone number is invalid for the selected country.");
    }
  }

  if (errors.length > 0) {
    // Switch back to Basic Info tab so the user can see the empty/invalid fields
    setTab("basic");
    errors.forEach(msg =>
      toast.error(msg, {
        description: msg.includes("required")
          ? "Please fill in all required fields before creating a property."
          : "Please check the phone number format (e.g. +44 1234 567890).",
      })
    );
    return false;
  }

  return true;
};
