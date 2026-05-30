import { supabase } from "@/lib/supabase";

const BUCKET = "yadoManagement";

/**
 * Deletes photos from the Supabase `yadoManagement` storage bucket given their public URLs.
 * 
 * @param {Array<string>} urls - Array of public photo URLs to delete
 */
export const deletePropertyPhotos = async (urls) => {
  if (!urls || urls.length === 0) return;

  const filePaths = urls.map(url => {
    // The URLs typically look like: 
    // https://<project>.supabase.co/storage/v1/object/public/yadoManagement/property-photos/<filename>
    const parts = url.split(`/public/${BUCKET}/`);
    if (parts.length === 2) {
      return parts[1];
    }
    return null;
  }).filter(Boolean);

  if (filePaths.length === 0) return;

  const { error } = await supabase.storage.from(BUCKET).remove(filePaths);

  if (error) {
    console.error("[DEBUG] Failed to delete photos from storage bucket:", error.message);
  } else {
    console.log("[DEBUG] Successfully deleted photos from storage bucket:", filePaths);
  }
};
