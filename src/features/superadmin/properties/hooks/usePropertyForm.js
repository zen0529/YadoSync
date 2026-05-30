import { useState, useEffect } from "react";
import { AsYouType } from "libphonenumber-js";
import { toast } from "sonner";
import { validatePropertyForm } from "../utils/validatePropertyForm";
import { uploadPropertyPhotos } from "../utils/uploadPropertyPhotos";
import { deletePropertyPhotos } from "../utils/deletePropertyPhotos";
import { createProperty } from "../channex/createProperty";
import { updateProperty as updatePropertyChannex } from "../channex/updateProperty";
import { deleteProperty } from "../channex/deleteProperty";
import { deletePhoto } from "../channex/deletePhoto";
import { createPhoto } from "../channex/createPhoto";
import { updateProperty as updatePropertySupabase } from "../supabase/updateProperty";
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
export const usePropertyForm = (open, onClose, propertyToEdit) => {
  const [tab, setTab] = useState("basic");
  const [form, setForm] = useState(defaultForm);
  const [newPhoto, setNewPhoto] = useState({ file: null, preview: "", description: "", author: "" });
  const [logoData, setLogoData] = useState({ file: null, preview: "" });
  const [deletedPhotos, setDeletedPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const { create: saveToSupabase } = useCreateProperty();
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
      setNewPhoto({ file: null, preview: "", description: "", author: "" });
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

      // 2.5 Create Auth User via Edge Function (Only if creating)
      let newUserId = null;
      if (!propertyToEdit) {
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
        newUserId = edgeData.user.id;
        console.log("[DEBUG] Created new user with ID:", newUserId);
      }

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
      let channexResult;
      if (propertyToEdit) {
        channexResult = await updatePropertyChannex(propertyToEdit.channex_property_id, resolvedFormForChannex);
        console.log("[DEBUG] Channex update response:", JSON.stringify(channexResult, null, 2));
        console.log("[DEBUG] Channex response photos:", channexResult?.data?.attributes?.content?.photos);
        
        // 5. Update Supabase.
        // The property_photos table needs:
        //   - url             = Supabase storage URL (from uploadedPhotos)
        //   - channex_photo_id = ID assigned by Channex (from response)
        //
        // ⚠️ Channex re-hosts all images at img.channex.io — the URLs in the
        // Channex response are different from the Supabase URLs we sent.
        // We must merge the two sources:
        //   • Existing photos → match by their Channex ID (id field)
        //   • New photos      → match by position (no id yet before the PUT)
        //
        const deletedChannexIds = new Set(
          deletedPhotos.filter(p => p.channexId).map(p => p.channexId)
        );
        const channexResponsePhotos = (channexResult.data?.attributes?.content?.photos || [])
          .filter(p => !deletedChannexIds.has(p.id));  // exclude cleared/deleted ones

        // Build lookup maps from the Channex response
        const channexById       = {};
        const channexByPosition = {};
        channexResponsePhotos.forEach(p => {
          if (p.id)                     channexById[p.id]           = p;
          if (p.position !== undefined) channexByPosition[p.position] = p;
        });

        // Pair each uploadedPhoto's Supabase URL with the Channex ID
        const photosDataWithIds = uploadedPhotos
          .map(p => {
            const channexEntry = p.id
              ? channexById[p.id]             // existing photo: match by Channex ID
              : channexByPosition[p.position]; // new photo: match by position
            if (!channexEntry) return null;
            return {
              id:          channexEntry.id,   // Channex photo ID → channex_photo_id
              url:         p.url,             // Supabase storage URL → url
              position:    p.position,
              description: p.description || "",
              kind:        p.kind || "photo",
            };
          })
          .filter(Boolean);                   // drop any that had no matching Channex entry
        console.log("[DEBUG] Photos to sync to Supabase (Supabase URLs + Channex IDs):", photosDataWithIds);

        const addressData = {
          address_line: resolvedForm.address || null,
          city: resolvedForm.city || null,
          state: resolvedForm.state || null,
          country: resolvedForm.country || null,
          postcode: resolvedForm.zip_code || null,
          latitude: resolvedForm.latitude || null,
          longitude: resolvedForm.longitude || null
        };

        await updatePropertySupabase(
          propertyToEdit.id, 
          {
            name: resolvedForm.title,
            status: resolvedForm.status === "active" ? "active" : "inactive",
            owner_email: resolvedForm.email,
            owner_phone: resolvedForm.phone,
            owner_name: resolvedForm.owner_name,
            currency: resolvedForm.currency,
            property_type: resolvedForm.property_type,
            commission_rate: resolvedForm.commission_rate,
            channex_settings: channexResult.data?.attributes?.settings || {},
            content_description: resolvedForm.content.description || null,
            content_imp_info: resolvedForm.content.important_information || null,
          },
          addressData,
          photosDataWithIds  // ← Channex IDs for new photos, deleted ones excluded by URL filter
        );
        console.log("[DEBUG] Updated in Supabase");
      } else {
        channexResult = await createProperty(resolvedForm);
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
