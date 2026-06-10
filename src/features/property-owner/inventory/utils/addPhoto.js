/**
 * Stages a new photo into the form's photo list and resets the newPhoto state.
 */
export const addPhoto = ({ newPhoto, setForm, setNewPhoto }) => {
  if (!newPhoto.file && !newPhoto.url) return;
  setForm((f) => ({
    ...f,
    content: {
      ...f.content,
      photos: [...f.content.photos, newPhoto],
    },
  }));
  setNewPhoto({ file: null, preview: null, description: "" });
};
