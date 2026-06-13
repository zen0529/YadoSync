import { toast } from "sonner";

export const handleSaveRoomType = async ({
  formData,
  localId,
  roomTypes,
  createRoomType,
  updateRoomType,
  setSubmitting,
  handleClose,
}) => {
  setSubmitting(true);
  try {
    if (!localId) {
      await createRoomType(formData);
      toast.success("Room type created");
    } else {
      const rt = roomTypes.find((r) => r.id === localId);
      if (rt) {
        await updateRoomType(rt.id, rt.channex_room_type_id, formData);
        toast.success("Room type updated");
      }
    }
    handleClose();
  } catch (err) {
    toast.error("Failed to save room type", { description: err.message });
  } finally {
    setSubmitting(false);
  }
};
