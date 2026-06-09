import { supabase } from "@/lib/supabase";

const BUCKET = "yadoManagement";
const FOLDER = "property-photos";

/**
 * Uploads an array of staged photo objects to the Supabase `yadoManagement`
 * storage bucket and returns formatted photo objects.
 *
 * @param {Array<{file: File, description: string, author: string}>} photos
 * @param {object} options - Options for formatting the output
 * @param {string} options.property_id - Optional Channex property ID to include
 * @param {string} options.room_type_id - Optional Channex room type ID to include
 * @param {boolean} options.wrapInPhotoKey - If true, wraps the output in { photo: { ... } }
 *
 * @returns {Promise<Array<object>>}
 */
export const uploadPhotos = async (photos, options = {}) => {
  if (!photos || photos.length === 0) return [];

  const uploaded = await Promise.all(
    photos.map(async (photo, index) => {
      let finalUrl = photo.url;
      let photoId = photo.id;

      // If it's a new file, upload it
      if (photo.file && !photo.url) {
        const ext = photo.file.name.split(".").pop();
        const fileName = `${FOLDER}/${Date.now()}-${index}.${ext}`;

        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(fileName, photo.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          throw new Error(`Failed to upload photo "${photo.file.name}": ${error.message}`);
        }

        const { data: publicData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(fileName);

        finalUrl = publicData.publicUrl;
      }

      // Build the base photo object
      const photoObj = {
        ...(photoId ? { id: photoId } : {}),
        url: finalUrl,
        position: index,
        author: photo.author || "",
        kind: photo.kind || "photo",
        description: photo.description || "",
      };

      if (options.property_id) {
        photoObj.property_id = options.property_id;
      }
      if (options.room_type_id) {
        photoObj.room_type_id = options.room_type_id;
      }

      // Wrap if required
      if (options.wrapInPhotoKey) {
        return { photo: photoObj };
      }

      return photoObj;
    })
  );

  return uploaded;
};
