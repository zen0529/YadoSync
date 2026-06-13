/**
 * Handles file input change for multi-photo upload.
 * Converts each selected file into a staged photo object and appends
 * them all to the form's photo list in one go.
 */
export const handleFileChange = ({ e, setForm }) => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;

  const newPhotos = files.map((file) => ({
    file,
    preview: URL.createObjectURL(file),
    description: "",
  }));

  setForm((f) => ({
    ...f,
    content: {
      ...f.content,
      photos: [...f.content.photos, ...newPhotos],
    },
  }));

  e.target.value = "";
};
