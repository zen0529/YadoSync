/**
 * Handles the room type form submission.
 * Photos are already fully staged in form.content.photos — no pending state needed.
 */
export const handleSubmitRoomType = ({ e, form, onSave, roomTypeToEdit }) => {
  e.preventDefault();
  onSave(form, roomTypeToEdit?.id);
};
