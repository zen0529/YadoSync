/**
 * Removes a photo from the form's photo list by index.
 */
export const removePhoto = ({ index, setForm }) => {
  setForm((f) => ({
    ...f,
    content: {
      ...f.content,
      photos: f.content.photos.filter((_, i) => i !== index),
    },
  }));
};
