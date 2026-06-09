import { toast } from "sonner";

export const handleDeleteRoomType = async ({
  rt,
  deleteRoomType,
  setSubmitting,
}) => {
  if (!window.confirm(`Are you sure you want to delete ${rt.title}?`)) return;
  setSubmitting(true);
  try {
    await deleteRoomType(rt.id, rt.channex_room_type_id);
    toast.success("Room type deleted");
  } catch (err) {
    toast.error("Failed to delete room type", { description: err.message });
  } finally {
    setSubmitting(false);
  }
};
