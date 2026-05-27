import { useState, useEffect } from "react";
import { AsYouType } from "libphonenumber-js";
import { toast } from "sonner";
import { validatePropertyForm } from "../utils/validatePropertyForm";
import { uploadPropertyPhotos } from "../utils/uploadPropertyPhotos";
import { createProperty } from "../channex/createProperty";
import { deleteProperty } from "../channex/deleteProperty";
import { defaultForm, COUNTRIES, TZ_MAP } from "../constants/propertyConstants";
import { useCreateProperty } from "./useCreateProperty";
import { useAuth } from "@/features/auth/context/AuthContext";
import { supabase } from "@/lib/supabase";

/**
 * usePropertyForm — encapsulates all form state and business logic
 * for the Add Property panel.
 *
 * @param {boolean} open    - Whether the panel is open (drives the reset effect)
 * @param {Function} onClose - Callback to close the panel
 */
export const usePropertyForm = (open, onClose) => {
  const [tab, setTab] = useState("basic");
  const [form, setForm] = useState(defaultForm);
  const [newPhoto, setNewPhoto] = useState({ file: null, preview: "", description: "", author: "" });
  const [logoData, setLogoData] = useState({ file: null, preview: "" });
  const [submitting, setSubmitting] = useState(false);
  const { create: saveToSupabase } = useCreateProperty();
  const { user } = useAuth();

  // Reset to defaults each time the panel is opened
  useEffect(() => {
    if (open) {
      setForm(defaultForm);
      setTab("basic");
      setNewPhoto({ file: null, preview: "", description: "", author: "" });
      setLogoData({ file: null, preview: "" });
    }
  }, [open]);

  /* ── Field setters ── */
  const set = (key, value) =>
    setForm(f => ({ ...f, [key]: value }));

  const setSetting = (key, value) =>
    setForm(f => ({ ...f, settings: { ...f.settings, [key]: value } }));

  const setContent = (key, value) =>
    setForm(f => ({ ...f, content: { ...f.content, [key]: value } }));

  /* ── Country cascade: updates country, currency, phone prefix, timezone ── */
  const handleCountryChange = (code) => {
    const selected = COUNTRIES.find(c => c.code === code);
    setForm(f => ({
      ...f,
      country: code,
      currency: selected?.currency || f.currency,
      phone: selected?.phoneCode ? `${selected.phoneCode} ` : f.phone,
      timezone: TZ_MAP[code] || f.timezone,
    }));
  };

  /* ── Phone formatting ── */
  const handlePhoneChange = (raw) => {
    const formatted = new AsYouType(form.country).input(raw);
    set("phone", formatted);
  };

  /* ── Photo helpers ── */
  const addPhoto = () => {
    if (!newPhoto.file) return;
    setContent("photos", [
      ...form.content.photos,
      {
        file: newPhoto.file,
        preview: newPhoto.preview,
        description: newPhoto.description,
        author: newPhoto.author,
        position: form.content.photos.length,
        kind: "photo",
      },
    ]);
    setNewPhoto({ file: null, preview: "", description: "", author: "" });
  };

  const removePhoto = (index) =>
    setContent("photos", form.content.photos.filter((_, i) => i !== index));

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePropertyForm(form, setTab)) return;

    setSubmitting(true);
    try {
      // Include any draft photo that was picked but not yet "Add Photo"-clicked
      const pendingPhoto = newPhoto.file
        ? [{
          file: newPhoto.file,
          preview: newPhoto.preview,
          description: newPhoto.description,
          author: newPhoto.author,
          position: form.content.photos.length,
          kind: "photo",
        }]
        : [];
      const allPhotos = [...form.content.photos, ...pendingPhoto];

      // 0. Upload logo if there is a pending logo file
      let finalLogoUrl = form.logo_url;
      if (logoData.file) {
        const uploadedLogo = await uploadPropertyPhotos([{
          file: logoData.file,
          description: "Logo",
          author: ""
        }]);
        if (uploadedLogo.length > 0) {
          finalLogoUrl = uploadedLogo[0].url;
        }
      }

      // 1. Upload all photo files to Supabase; get back Channex-ready objects
      const uploadedPhotos = await uploadPropertyPhotos(allPhotos);
      console.log("[DEBUG] Uploaded photos (public URLs):", uploadedPhotos);

      // 2. Build a resolved form where photos have public URLs instead of File refs
      const resolvedForm = {
        ...form,
        logo_url: finalLogoUrl,
        content: {
          ...form.content,
          photos: uploadedPhotos,
        },
      };
      console.log("[DEBUG] Channex payload:", JSON.stringify(resolvedForm, null, 2));

      // 2.5 Create Auth User via Edge Function
      if (!form.email || !form.password) {
        throw new Error("Owner Email and Password are required to create the property account.");
      }
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('create-property-user', {
        body: {
          email: form.email,
          password: form.password,
          fullName: form.owner_name || form.title
        }
      });

      if (edgeError) {
        let realMessage = edgeError.message;
        try {
          if (edgeError.context && typeof edgeError.context.json === 'function') {
            const errBody = await edgeError.context.json();
            if (errBody.error) realMessage = errBody.error;
          }
        } catch (_) {}
        throw new Error(`Failed to create owner account: ${realMessage}`);
      }
      if (edgeData?.error) {
        throw new Error(`Failed to create owner account: ${edgeData.error}`);
      }
      
      const newUserId = edgeData.user.id;
      console.log("[DEBUG] Created new user with ID:", newUserId);

      // 3. Send to Channex
      const channexResult = await createProperty(resolvedForm);
      if (channexResult?.data?.attributes) {
        channexResult.data.attributes.commission_rate = resolvedForm.commission_rate;
        channexResult.data.attributes.owner_name = resolvedForm.owner_name;
      }
      console.log("[DEBUG] Channex response:", channexResult);

      // 4. Save to Supabase
      try {
        await saveToSupabase(channexResult, newUserId);
        console.log("[DEBUG] Saved to Supabase");
      } catch (supabaseError) {
        // Rollback Channex creation if Supabase save fails
        console.error("[DEBUG] Supabase save failed, rolling back Channex property:", channexResult.data.id);
        const deletingProperty = await deleteProperty(channexResult.data.id);
        console.log("[DEBUG] Deleted Channex property:", deletingProperty);
        throw new Error("Failed to save property to database. The operation has been rolled back.");
      }

      toast.success("Property created!", {
        description: `"${form.title}" has been successfully added.`,
      });
      onClose();
    } catch (err) {
      toast.error("Failed to create property", {
        description: err.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    tab, setTab,
    form,
    newPhoto, setNewPhoto,
    logoData, setLogoData,
    submitting,
    set, setSetting, setContent,
    handleCountryChange,
    handlePhoneChange,
    addPhoto, removePhoto,
    handleSubmit,
  };
};
