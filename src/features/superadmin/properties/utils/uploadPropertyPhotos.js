import { supabase } from "@/lib/supabase";

const BUCKET = "yadoManagement";
const FOLDER = "property-photos";

/**
 * Uploads an array of staged photo objects to the Supabase `yadoManagement`
 * storage bucket and returns Channex-compatible photo objects with public URLs.
 *
 * @param {Array<{file: File, description: string, author: string}>} photos
 *   Each item must have a `file` property (a File/Blob). `description` and
 *   `author` are passed through unchanged.
 *
 * @returns {Promise<Array<{url: string, position: number, author: string, kind: string, description: string}>>}
 *   Resolves to an array ready to pass directly into the Channex `content.photos` field.
 *
 * @throws {Error} If any upload fails, throws with a descriptive message.
 */
export const uploadPropertyPhotos = async (photos) => {
  if (!photos || photos.length === 0) return [];

  const uploaded = await Promise.all(
    photos.map(async (photo, index) => {
      const ext      = photo.file.name.split(".").pop();
      const fileName = `${FOLDER}/${Date.now()}-${index}.${ext}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, photo.file, {
          cacheControl: "3600",
          upsert:       false,
        });

      if (error) {
        throw new Error(
          `Failed to upload photo "${photo.file.name}": ${error.message}`
        );
      }

      const { data: publicData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(fileName);

      return {
        url:         publicData.publicUrl,
        position:    index,
        author:      photo.author      || "",
        kind:        "photo",
        description: photo.description || "",
      };
    })
  );

  return uploaded;
};
