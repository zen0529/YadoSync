import { toast } from "sonner";

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
  if (!form.currency)     errors.push("Currency is required.");

  if (errors.length > 0) {
    // Switch back to Basic Info tab so the user can see the empty fields
    setTab("basic");
    errors.forEach(msg =>
      toast.error(msg, {
        description: "Please fill in all required fields before creating a property.",
      })
    );
    return false;
  }

  return true;
};
