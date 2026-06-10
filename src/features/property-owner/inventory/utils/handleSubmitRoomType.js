/**
 * Handles the room type form submission.
 * Auto-stages any pending photo that was selected but not explicitly added.
 */
export const handleSubmitRoomType = ({ e, form, newPhoto, onSave, roomTypeToEdit }) => {
  e.preventDefault();

  const finalForm = { ...form };
  if (newPhoto.file) {
    finalForm.content = {
      ...finalForm.content,
      photos: [...finalForm.content.photos, newPhoto],
    };
  }

  onSave(finalForm, roomTypeToEdit?.id);
};
