import { useState, useEffect } from "react";
import { AsYouType } from "libphonenumber-js";
import { toast } from "sonner";
import { validatePropertyForm } from "../utils/validatePropertyForm";
import { uploadPhotos } from "@/utils/uploadPhotos";
import { deletePropertyPhotos } from "../utils/deletePropertyPhotos";
import { defaultForm, COUNTRIES, TZ_MAP } from "../constants/propertyConstants";
import { useAuth } from "@/features/auth/context/AuthContext";
import { supabase } from "@/lib/supabase";

/**
 * usePropertyForm — encapsulates all form state and business logic
 * for the Add Property panel.
 *
 * @param {boolean} open    - Whether the panel is open (drives the reset effect)
 * @param {Function} onClose - Callback to close the panel
 */
export const usePropertyForm = (open, onClose, propertyToEdit) => {
  const [tab, setTab] = useState("basic");
  const [form, setForm] = useState(defaultForm);
  const [logoData, setLogoData] = useState({ file: null, preview: "" });
  const [deletedPhotos, setDeletedPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  // Reset to defaults each time the panel is opened
  useEffect(() => {
    if (open) {
      if (propertyToEdit) {
        setForm({
          ...defaultForm,
          title: propertyToEdit.name || "",
          status: propertyToEdit.status || "active",
          currency: propertyToEdit.currency || "GBP",
          commission_rate: propertyToEdit.commission_rate || 15,
          email: propertyToEdit.owner_email || "",
          phone: propertyToEdit.owner_phone || "",
          owner_name: propertyToEdit.owner_name || "",
          country: propertyToEdit.property_address?.country || "GB",
          state: propertyToEdit.property_address?.state || "",
          city: propertyToEdit.property_address?.city || "",
          address: propertyToEdit.property_address?.address_line || "",
          zip_code: propertyToEdit.property_address?.postcode || "",
          latitude: propertyToEdit.property_address?.latitude || "",
          longitude: propertyToEdit.property_address?.longitude || "",
          property_type: propertyToEdit.property_type || "hotel",
          settings: {
            ...defaultForm.settings,
            ...(propertyToEdit.channex_settings || {})
          },
          content: {
            ...defaultForm.content,
            description: propertyToEdit.content_description || "",
            important_information: propertyToEdit.content_imp_info || "",
            photos: (propertyToEdit.property_photos || []).map(photo => ({
              id: photo.channex_photo_id,
              url: photo.url,
              description: photo.description || "",
              position: photo.position || 0,
              kind: "photo",
              isExisting: true
            }))
          }
        });
      } else {
        setForm(defaultForm);
      }
      setTab("basic");
      setLogoData({ file: null, preview: "" });
      setDeletedPhotos([]);
    }
  }, [open, propertyToEdit]);

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
  const addPhotos = (files) => {
    const newPhotos = files.map((file, idx) => ({
      file,
      preview: URL.createObjectURL(file),
      description: "",
      author: "",
      position: form.content.photos.length + idx,
      kind: "photo",
    }));
    setContent("photos", [...form.content.photos, ...newPhotos]);
  };

  const updatePhotoField = (index, field, value) => {
    setContent(
      "photos",
      form.content.photos.map((ph, i) => (i === index ? { ...ph, [field]: value } : ph))
    );
  };

  const removePhoto = (index) => {
    const photoToRemove = form.content.photos[index];
    // Track both the Channex photo ID (for Channex API deletion) and
    // the storage URL (for Supabase storage bucket deletion).
    // Only existing photos (loaded from DB) have channex IDs and storage URLs.
    if (photoToRemove?.isExisting) {
      setDeletedPhotos(prev => [
        ...prev,
        {
          url:         photoToRemove.url,
          channexId:   photoToRemove.id,
          description: photoToRemove.description || null,
          author:      photoToRemove.author       || null,
          position:    photoToRemove.position     ?? null,
          kind:        photoToRemove.kind          || "photo",
        }
      ]);
    }
    setContent("photos", form.content.photos.filter((_, i) => i !== index));
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePropertyForm(form, setTab)) return;

    setSubmitting(true);
    try {
      const allPhotos = [...form.content.photos];

      // 0. Upload logo if there is a pending logo file
      let finalLogoUrl = form.logo_url;
      if (logoData.file) {
        const uploadedLogo = await uploadPhotos([{
          file: logoData.file,
          description: "Logo",
          author: ""
        }]);
        if (uploadedLogo.length > 0) {
          finalLogoUrl = uploadedLogo[0].url;
        }
      }

      // 1. Upload all photo files to Supabase; get back Channex-ready objects
      const uploadedPhotos = await uploadPhotos(allPhotos);
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

      // (User creation is now handled by the createProperty edge function during the create step)

      // 3. Build the Channex photos payload.
      // To delete a photo in Channex, simply omit it from the array.
      // uploadedPhotos already excludes any removed photos.
      // Sending [] deletes all photos; Channex handles multiple deletions correctly.
      const resolvedFormForChannex = {
        ...resolvedForm,
        content: {
          ...resolvedForm.content,
          photos: uploadedPhotos,
        },
      };
      console.log("[DEBUG] Channex photos payload:", JSON.stringify(uploadedPhotos, null, 2));

      // 4. Send updated property to Channex
      if (propertyToEdit) {
        console.log("[DEBUG] Invoking updateProperty edge function...");
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke('updateProperty', {
          body: {
            propertyId: propertyToEdit.id,
            channexPropertyId: propertyToEdit.channex_property_id,
            resolvedForm: resolvedFormForChannex,
            deletedPhotos
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
          throw new Error(`Failed to update property: ${realMessage}`);
        }
        console.log("[DEBUG] Property updated via edge function:", edgeData);
      } else {
        if (!form.email || !form.password) {
          throw new Error("Owner Email and Password are required to create the property account.");
        }
        
        console.log("[DEBUG] Invoking createProperty edge function...");
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke('createProperty', {
          body: {
            email: form.email,
            password: form.password,
            fullName: form.owner_name || form.title,
            resolvedForm
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
          throw new Error(`Failed to create property: ${realMessage}`);
        }
        console.log("[DEBUG] Property created via edge function:", edgeData);
      }

      // Delete removed photos from Channex via DELETE /api/v1/photos/:id
      const photosToDelete = deletedPhotos.filter(p => p.channexId);
      if (photosToDelete.length > 0) {
        console.log("[DEBUG] Deleting", photosToDelete.length, "photo(s) from Channex:", photosToDelete.map(p => p.channexId));
        await Promise.all(photosToDelete.map(p => deletePhoto(p.channexId)));
        console.log("[DEBUG] Channex photo(s) deleted successfully.");
      }

      // Delete removed photos from Supabase storage bucket.
      // If this fails after Channex deletion, we rollback by re-creating the photos on Channex.
      const deletedUrls = deletedPhotos.map(p => p.url).filter(Boolean);
      if (deletedUrls.length > 0) {
        try {
          await deletePropertyPhotos(deletedUrls);
          console.log("[DEBUG] Deleted", deletedUrls.length, "photo(s) from storage bucket.");
        } catch (storageErr) {
          console.error("[DEBUG] Storage bucket deletion failed — reverting Channex photo deletion...", storageErr);
          // Rollback: re-create every photo that was successfully deleted from Channex
          if (photosToDelete.length > 0 && propertyToEdit?.channex_property_id) {
            const rollbackResults = await Promise.allSettled(
              photosToDelete.map(p =>
                createPhoto({
                  property_id: propertyToEdit.channex_property_id,
                  url:         p.url,
                  kind:        p.kind        || "photo",
                  author:      p.author      || null,
                  description: p.description || null,
                  position:    p.position    ?? null,
                })
              )
            );
            const failedRollbacks = rollbackResults.filter(r => r.status === "rejected");
            if (failedRollbacks.length > 0) {
              console.error("[DEBUG] Some photos could not be re-created on Channex:", failedRollbacks);
            } else {
              console.log("[DEBUG] Channex photo deletion rolled back successfully.");
            }
          }
          throw new Error("Failed to delete photos from storage. The Channex deletion has been reverted.");
        }
      }

      toast.success(propertyToEdit ? "Property updated!" : "Property created!", {
        description: `"${form.title}" has been successfully ${propertyToEdit ? 'updated' : 'added'}.`,
      });
      
      onClose();
    } catch (err) {
      toast.error(propertyToEdit ? "Failed to update property" : "Failed to create property", {
        description: err.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    tab, setTab,
    form,
    logoData, setLogoData,
    submitting,
    set, setSetting, setContent,
    handleCountryChange,
    handlePhoneChange,
    addPhotos, removePhoto, updatePhotoField,
    handleSubmit,
  };
};
